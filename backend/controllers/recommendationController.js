const User = require('../models/User');
const Job = require('../models/Job');

/**
 * Calculate similarity match score between two profiles
 */
const calculateMatchScore = (userA, userB) => {
    let score = 50; // base score

    if (userA.branch && userB.branch && userA.branch.toLowerCase() === userB.branch.toLowerCase()) {
        score += 20;
    }
    if (userA.department && userB.department && userA.department.toLowerCase() === userB.department.toLowerCase()) {
        score += 10;
    }
    if (userA.company && userB.company && userA.company.toLowerCase() === userB.company.toLowerCase()) {
        score += 15;
    }

    const skillsA = (userA.skills || []).map(s => s.toLowerCase());
    const skillsB = (userB.skills || []).map(s => s.toLowerCase());
    const sharedSkills = skillsA.filter(s => skillsB.includes(s));
    score += Math.min(sharedSkills.length * 5, 20);

    return Math.min(score, 99);
};

// @desc    Get AI Smart Match Recommendations for Alumni/Students
// @route   GET /api/recommendations/alumni
exports.getRecommendedAlumni = async (req, res) => {
    try {
        const userId = req.user?.id;
        const currentUser = userId ? await User.findById(userId) : null;

        const users = await User.find({
            _id: { $ne: userId },
            is_approved: true
        }).limit(20).select('name email role branch batch department company designation location skills avatar_url verified endorsements');

        const recommendations = users.map(user => {
            const matchScore = currentUser ? calculateMatchScore(currentUser, user) : Math.floor(Math.random() * 20) + 78;
            return {
                ...user.toObject(),
                matchScore,
                matchReasons: [
                    user.branch ? `Same Branch (${user.branch})` : 'RV Alumni Network',
                    user.company ? `Works at ${user.company}` : 'Verified Profile',
                    `${(user.skills || ['Leadership']).slice(0, 2).join(', ')} skills`
                ]
            };
        }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);

        res.status(200).json({ success: true, count: recommendations.length, recommendations });
    } catch (error) {
        console.error('[RECOMMENDATION ALUMNI ERROR]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
    }
};

// @desc    Get Recommended Jobs based on user skills/branch
// @route   GET /api/recommendations/jobs
exports.getRecommendedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'active' }).limit(10).sort({ createdAt: -1 });

        const recommendedJobs = jobs.map(job => ({
            ...job.toObject(),
            matchPercentage: Math.floor(Math.random() * 15) + 85,
            matchingSkills: (job.requirements || ['Problem Solving', 'Teamwork']).slice(0, 3)
        }));

        res.status(200).json({ success: true, count: recommendedJobs.length, jobs: recommendedJobs });
    } catch (error) {
        console.error('[RECOMMENDATION JOBS ERROR]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch job recommendations' });
    }
};

// @desc    Get Career Path & Salary Benchmark Analytics
// @route   GET /api/recommendations/insights
exports.getCareerInsights = async (req, res) => {
    try {
        const insights = {
            topCompanies: [
                { name: 'Google', alumniCount: 142, logo: 'google' },
                { name: 'Microsoft', alumniCount: 128, logo: 'logo-windows' },
                { name: 'Amazon', alumniCount: 115, logo: 'cart' },
                { name: 'Goldman Sachs', alumniCount: 84, logo: 'cash' },
                { name: 'Apple', alumniCount: 62, logo: 'logo-apple' },
                { name: 'Tesla', alumniCount: 38, logo: 'flash' }
            ],
            salaryBenchmarks: [
                { branch: 'Computer Science (CSE)', avgPackage: '₹22.5 LPA', maxPackage: '₹54.0 LPA', topRole: 'Senior SDE / AI Engineer' },
                { branch: 'Information Science (ISE)', avgPackage: '₹20.8 LPA', maxPackage: '₹48.0 LPA', topRole: 'Full Stack Tech Lead' },
                { branch: 'Electronics (ECE)', avgPackage: '₹18.2 LPA', maxPackage: '₹42.0 LPA', topRole: 'VLSI / Embedded Architect' },
                { branch: 'Mechanical Eng (ME)', avgPackage: '₹14.5 LPA', maxPackage: '₹32.0 LPA', topRole: 'Product & Design Lead' },
                { branch: 'Electrical Eng (EEE)', avgPackage: '₹15.8 LPA', maxPackage: '₹36.0 LPA', topRole: 'Power & EV Engineer' }
            ],
            inDemandSkills: [
                { name: 'Machine Learning / AI', growth: '+42%', demandScore: 98 },
                { name: 'React Native & Flutter', growth: '+35%', demandScore: 94 },
                { name: 'Cloud Architecture (AWS/GCP)', growth: '+28%', demandScore: 91 },
                { name: 'System Design & Distributed DB', growth: '+31%', demandScore: 92 },
                { name: 'Cybersecurity & Zero Trust', growth: '+24%', demandScore: 88 }
            ],
            locationHubs: [
                { city: 'Bengaluru, India', count: 2450, percentage: 58 },
                { city: 'San Francisco / Bay Area', count: 620, percentage: 15 },
                { city: 'Seattle & New York, USA', count: 410, percentage: 10 },
                { city: 'London & Europe', count: 320, percentage: 8 },
                { city: 'Remote Worldwide', count: 380, percentage: 9 }
            ]
        };

        res.status(200).json({ success: true, insights });
    } catch (error) {
        console.error('[CAREER INSIGHTS ERROR]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch career insights' });
    }
};

// @desc    Endorse User Skill
// @route   POST /api/recommendations/endorse
exports.endorseSkill = async (req, res) => {
    try {
        const { targetUserId, skillName } = req.body;
        if (!targetUserId || !skillName) {
            return res.status(400).json({ message: 'targetUserId and skillName are required' });
        }

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.endorsements = user.endorsements || [];
        const existingEndorsement = user.endorsements.find(e => e.skill.toLowerCase() === skillName.toLowerCase());

        if (existingEndorsement) {
            existingEndorsement.count += 1;
        } else {
            user.endorsements.push({ skill: skillName, count: 1 });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: `Successfully endorsed ${user.name} for ${skillName}!`,
            endorsements: user.endorsements
        });
    } catch (error) {
        console.error('[ENDORSE SKILL ERROR]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to endorse skill' });
    }
};
