const Job = require('../models/Job');
const JobPreference = require('../models/JobPreference');
const User = require('../models/User');
const { extractKeywords, calculateJobMatch } = require('../utils/keywordExtractor');

// @desc    Get all jobs with filters & search
// @route   GET /api/jobs
exports.getJobs = async (req, res) => {
    try {
        const { search, workplaceType, jobType, location } = req.query;
        let query = { isActive: true };

        // Non-super-admins only see jobs targeted to their institution or posted for all
        if (req.user && req.user.role !== 'Super Admin') {
            const userDoc = await User.findById(req.user._id).select('institution');
            const userInstitution = req.user.institution || userDoc?.institution;
            if (userInstitution) {
                query.$or = [
                    { institution: new RegExp(`^${userInstitution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    { institution: 'All Institutions' },
                    { institution: { $exists: false } }
                ];
            }
        } else if (req.query.institution && req.query.institution !== 'All') {
            query.institution = new RegExp(`^${req.query.institution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        }

        if (search) {
            query.$or = (query.$or || []).length > 0 
                ? [
                    { $and: [
                        { $or: query.$or },
                        { $or: [
                            { title: { $regex: search, $options: 'i' } },
                            { company: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } }
                        ]}
                    ]}
                ]
                : [
                    { title: { $regex: search, $options: 'i' } },
                    { company: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
        }

        if (workplaceType) query.workplaceType = workplaceType;
        if (jobType) query.jobType = jobType;
        if (location) query.location = { $regex: location, $options: 'i' };

        const jobs = await Job.find(query)
            .populate('postedBy', 'name profilePicture role company designation institution')
            .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new job posting
// @route   POST /api/jobs
exports.createJob = async (req, res) => {
    try {
        const { title, company, location, workplaceType, jobType, experienceLevel, salaryRange, description, requirements, institution } = req.body;

        const userDoc = await User.findById(req.user._id).select('institution');
        const jobInstitution = institution || req.user.institution || userDoc?.institution || 'All Institutions';

        const reqList = Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []);
        // Automatically detect and extract keywords (e.g., Python, React, AWS, AI) from title & description
        const autoKeywords = extractKeywords(title, description, reqList);

        const job = await Job.create({
            title,
            company,
            location,
            institution: jobInstitution,
            workplaceType: workplaceType || 'On-site',
            jobType: jobType || 'Full-time',
            experienceLevel: experienceLevel || 'Mid-Senior',
            salaryRange: salaryRange || '',
            description,
            requirements: reqList,
            keywords: autoKeywords,
            postedBy: req.user._id
        });

        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Save / Bookmark Job (LinkedIn Saved Jobs)
// @route   POST /api/jobs/:id/save
exports.toggleSaveJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const userId = req.user._id;
        const index = job.savedBy.indexOf(userId);

        if (index > -1) {
            job.savedBy.splice(index, 1);
        } else {
            job.savedBy.push(userId);
        }

        await job.save();
        res.json({ message: 'Save status updated', isSaved: index === -1, savedCount: job.savedBy.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Easy Apply to a Job
// @route   POST /api/jobs/:id/apply
exports.applyToJob = async (req, res) => {
    try {
        const { resumeUrl, coverNote } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const alreadyApplied = job.applicants.some(app => app.user.toString() === req.user._id.toString());
        if (alreadyApplied) {
            return res.status(400).json({ message: 'You have already applied to this position' });
        }

        job.applicants.push({
            user: req.user._id,
            resumeUrl: resumeUrl || '',
            coverNote: coverNote || 'Interested in this opportunity.',
            status: 'Applied',
            appliedAt: new Date()
        });

        await job.save();
        res.json({ message: 'Application submitted successfully', job });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get LinkedIn Job Tracker (Saved & Applied Jobs)
// @route   GET /api/jobs/tracker
exports.getJobTracker = async (req, res) => {
    try {
        const userId = req.user._id;

        const savedJobs = await Job.find({ savedBy: userId })
            .populate('postedBy', 'name company profilePicture')
            .sort({ createdAt: -1 });

        const appliedJobsList = await Job.find({ 'applicants.user': userId })
            .populate('postedBy', 'name company profilePicture');

        const appliedJobsFormatted = appliedJobsList.map(job => {
            const applicantObj = job.applicants.find(app => app.user.toString() === userId.toString());
            return {
                _id: job._id,
                title: job.title,
                company: job.company,
                location: job.location,
                workplaceType: job.workplaceType,
                jobType: job.jobType,
                status: applicantObj ? applicantObj.status : 'Applied',
                appliedAt: applicantObj ? applicantObj.appliedAt : job.createdAt,
            };
        });

        res.json({
            savedJobs,
            appliedJobs: appliedJobsFormatted
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get LinkedIn Job Preferences & Open to Work
// @route   GET /api/jobs/preferences
exports.getPreferences = async (req, res) => {
    try {
        const userDoc = await User.findById(req.user._id).select('skills domain branch department');
        let prefs = await JobPreference.findOne({ user: req.user._id });
        if (!prefs) {
            prefs = await JobPreference.create({
                user: req.user._id,
                openToWork: true,
                targetTitles: ['Software Engineer', 'Full Stack Developer', 'Data Engineer'],
                targetLocations: ['Bangalore', 'Remote', 'Hybrid'],
                keywords: userDoc?.skills?.length ? userDoc.skills : ['Python', 'React', 'Cloud'],
                skills: userDoc?.skills || [],
                jobTypes: ['Full-time', 'Contract']
            });
        }
        res.json(prefs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update LinkedIn Job Preferences & Open to Work
// @route   PUT /api/jobs/preferences
exports.updatePreferences = async (req, res) => {
    try {
        const { openToWork, targetTitles, targetLocations, keywords, skills, jobTypes, preferredIndustry, minSalary } = req.body;

        let prefs = await JobPreference.findOne({ user: req.user._id });
        if (!prefs) {
            prefs = new JobPreference({ user: req.user._id });
        }

        if (typeof openToWork === 'boolean') prefs.openToWork = openToWork;
        if (targetTitles) prefs.targetTitles = targetTitles;
        if (targetLocations) prefs.targetLocations = targetLocations;
        if (keywords) prefs.keywords = keywords;
        if (skills) prefs.skills = skills;
        if (jobTypes) prefs.jobTypes = jobTypes;
        if (preferredIndustry) prefs.preferredIndustry = preferredIndustry;
        if (minSalary) prefs.minSalary = minSalary;

        await prefs.save();

        // Also synchronize keywords to user skills in User profile
        if (keywords && Array.isArray(keywords) && keywords.length > 0) {
            await User.findByIdAndUpdate(req.user._id, { $addToSet: { skills: { $each: keywords } } });
        }

        res.json(prefs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Recommended Jobs based on Alumni Preferences & Keywords (e.g. Python, AI)
// @route   GET /api/jobs/recommended
exports.getRecommendedJobs = async (req, res) => {
    try {
        const userId = req.user._id;
        const [prefs, userDoc] = await Promise.all([
            JobPreference.findOne({ user: userId }),
            User.findById(userId).select('skills domain branch department institution')
        ]);

        const userPreferences = {
            keywords: prefs?.keywords || [],
            targetTitles: prefs?.targetTitles || [],
            targetLocations: prefs?.targetLocations || [],
            skills: userDoc?.skills || [],
            branch: userDoc?.branch || '',
            department: userDoc?.department || '',
            domain: userDoc?.domain || ''
        };

        // Query active jobs (considering institution scope)
        let query = { isActive: true };
        if (req.user && req.user.role !== 'Super Admin') {
            const userInstitution = req.user.institution || userDoc?.institution;
            if (userInstitution) {
                query.$or = [
                    { institution: new RegExp(`^${userInstitution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    { institution: 'All Institutions' },
                    { institution: { $exists: false } }
                ];
            }
        }

        const allJobs = await Job.find(query)
            .populate('postedBy', 'name company profilePicture role institution')
            .sort({ createdAt: -1 });

        // Score each job with keyword detection engine
        const scoredJobs = allJobs.map(job => {
            const jobObj = job.toObject();
            if (!jobObj.keywords || jobObj.keywords.length === 0) {
                jobObj.keywords = extractKeywords(jobObj.title, jobObj.description, jobObj.requirements);
            }
            const match = calculateJobMatch(jobObj, userPreferences);
            return {
                ...jobObj,
                matchScore: match.matchScore,
                isMatch: match.isMatch,
                matchingKeywords: match.matchingKeywords,
                matchReasons: match.matchReasons
            };
        });

        // Filter and sort by highest matchScore
        const recommended = scoredJobs
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 25);

        res.json(recommended);
    } catch (error) {
        console.error('Error fetching recommended jobs:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Alumni Resume Book
// @route   GET /api/jobs/resume-book
exports.getResumeBook = async (req, res) => {
    try {
        const { search, institution, domain } = req.query;
        let query = {
            is_approved: true,
            $or: [
                { resumeUrl: { $exists: true, $ne: '' } },
                { isJobSeeker: true }
            ]
        };

        // If not super admin, restrict to user's institution
        if (req.user && req.user.role !== 'Super Admin') {
            const userInstitution = req.user.institution;
            if (userInstitution && userInstitution !== 'All') {
                query.institution = new RegExp(`^${userInstitution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            }
        } else if (institution && institution !== 'All') {
            query.institution = new RegExp(`^${institution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        }

        if (domain && domain !== 'All') {
            query.domain = new RegExp(`^${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        }

        if (search && search.trim()) {
            const term = search.trim();
            const searchRegex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$and = [
                {
                    $or: [
                        { name: searchRegex },
                        { company: searchRegex },
                        { designation: searchRegex },
                        { headline: searchRegex },
                        { skills: searchRegex },
                        { department: searchRegex },
                        { branch: searchRegex },
                        { domain: searchRegex }
                    ]
                }
            ];
        }

        const candidates = await User.find(query)
            .select('_id name email institution branch department batchYear company designation headline domain experienceYears skills resumeUrl resumeFileName resumeUpdatedAt isJobSeeker avatar_url profilePicture bio')
            .sort({ resumeUpdatedAt: -1, updatedAt: -1 })
            .limit(100);

        res.json(candidates);
    } catch (error) {
        console.error('Error fetching resume book:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch resume book' });
    }
};

// @desc    Share Candidate Resume via Email
// @route   POST /api/jobs/resume-book/share
exports.shareResumeViaEmail = async (req, res) => {
    try {
        const { sendCandidateResumeEmail } = require('../utils/sendEmail');
        const { candidateId, recipientEmail, subject, message } = req.body;

        if (!candidateId || !recipientEmail) {
            return res.status(400).json({ message: 'Candidate ID and recipient email are required' });
        }

        // Validate recipient email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail.trim())) {
            return res.status(400).json({ message: 'Please provide a valid recipient email address' });
        }

        const candidate = await User.findById(candidateId).select('name email institution branch department batchYear company designation headline domain experienceYears skills resumeUrl resumeFileName bio');
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate profile not found' });
        }

        const adminName = req.user.name || 'Alumni Administrator';
        const adminInstitution = req.user.institution || candidate.institution || 'Alumni Network';

        const result = await sendCandidateResumeEmail({
            recipientEmail: recipientEmail.trim(),
            candidate,
            adminName,
            adminInstitution,
            customMessage: message,
            subject
        });

        res.json({
            success: true,
            message: `Candidate resume for ${candidate.name} was successfully forwarded to ${recipientEmail.trim()}`,
            result
        });
    } catch (error) {
        console.error('Error sharing resume via email:', error);
        res.status(500).json({ message: error.message || 'Failed to share candidate resume' });
    }
};
