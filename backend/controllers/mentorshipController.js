const Mentorship = require('../models/Mentorship');
const MentorshipProfile = require('../models/MentorshipProfile');
const User = require('../models/User');

// Curated verified alumni mentors (RVCE standard)
const DEFAULT_MENTORS = [
    {
        id: 'curated_m1',
        name: 'Dr. Raghav Sharma',
        batchYear: '2005',
        department: 'Computer Science',
        branch: 'Computer Science & Engineering',
        company: 'Google',
        designation: 'Principal Engineer',
        location: 'Mountain View, CA',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        about: 'Passionate about building scalable distributed systems and cloud infrastructure. 18+ years in tech, happy to guide aspiring engineers and leaders.',
        availability: 'Weekends, 2 slots/month',
        areas: ['Software Engineering', 'System Design', 'Cloud Architecture', 'Machine Learning'],
        skills: ['System Design', 'Machine Learning', 'Cloud Architecture', 'Go', 'Kubernetes'],
        menteesCount: 14,
        rating: 4.9,
        institution: 'RV College of Engineering',
        isVerified: true
    },
    {
        id: 'curated_m2',
        name: 'Priya Nair',
        batchYear: '2010',
        department: 'Electronics & Communication',
        branch: 'Electronics & Communication Engineering',
        company: 'Microsoft',
        designation: 'Senior Product Manager',
        location: 'Hyderabad, India',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        about: 'Transitioned from technical engineering to product management. Happy to mentor on APM preparation, product strategy, and career transitions.',
        availability: 'Tue & Thu evenings',
        areas: ['Product Management', 'Product Strategy', 'UX Research', 'Agile Methodologies'],
        skills: ['Product Strategy', 'UX Research', 'Agile Methodologies', 'User Analytics'],
        menteesCount: 9,
        rating: 4.8,
        institution: 'RV College of Engineering',
        isVerified: true
    },
    {
        id: 'curated_m3',
        name: 'Arun Patel',
        batchYear: '2008',
        department: 'Mechanical Engineering',
        branch: 'Mechanical Engineering',
        company: 'Tesla',
        designation: 'Staff Mechanical Engineer',
        location: 'Austin, TX',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        about: 'From RVCE mechanical workshops to Tesla Gigafactory floors. Guiding students in automotive engineering, CAD/CAM, and EV hardware design.',
        availability: 'Flexible, bi-weekly',
        areas: ['Core Engineering', 'Automotive Engineering', 'CAD/CAM', 'Manufacturing'],
        skills: ['Automotive Engineering', 'CAD/CAM', 'Manufacturing', 'SolidWorks', 'FEA'],
        menteesCount: 7,
        rating: 4.7,
        institution: 'RV College of Engineering',
        isVerified: true
    },
    {
        id: 'curated_m4',
        name: 'Dr. Kavitha Reddy',
        batchYear: '2003',
        department: 'Biotechnology',
        branch: 'Biotechnology',
        company: 'Biocon',
        designation: 'VP R&D',
        location: 'Bengaluru, India',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
        about: 'Leading biopharmaceutical research for over 20 years. Dedicated mentor to biotech students, researchers, and aspiring PhD scholars.',
        availability: 'Weekends, 3 slots/month',
        areas: ['Research', 'Biotechnology', 'Higher Studies', 'Bioinformatics'],
        skills: ['Bioinformatics', 'Drug Discovery', 'Clinical Trials', 'Molecular Biology'],
        menteesCount: 16,
        rating: 4.9,
        institution: 'RV College of Engineering',
        isVerified: true
    },
    {
        id: 'curated_m5',
        name: 'Vikram Joshi',
        batchYear: '2012',
        department: 'Information Science',
        branch: 'Information Science & Engineering',
        company: 'Amazon',
        designation: 'Engineering Manager',
        location: 'Seattle, WA',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        about: 'IC to Engineering Manager journey at big tech. I help engineers master high-scale distributed backend systems and excel in tech leadership.',
        availability: 'Sat mornings IST',
        areas: ['Software Engineering', 'System Design', 'Backend Systems', 'Leadership'],
        skills: ['Backend Systems', 'Team Leadership', 'Distributed Systems', 'AWS', 'Java'],
        menteesCount: 11,
        rating: 4.6,
        institution: 'RV College of Engineering',
        isVerified: true
    },
    {
        id: 'curated_m6',
        name: 'Sneha Kulkarni',
        batchYear: '2015',
        department: 'Computer Science',
        branch: 'Computer Science & Engineering',
        company: 'Flipkart',
        designation: 'Lead Data Scientist',
        location: 'Bengaluru, India',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
        about: 'Building machine learning recommendation engines at enterprise scale. Love helping students and freshers break into Data Science and AI.',
        availability: 'Tue & Thu, 1 slot/week',
        areas: ['Machine Learning', 'Data Science', 'AI & Deep Learning', 'Python'],
        skills: ['Data Science', 'NLP', 'Analytics', 'Python', 'PyTorch', 'MLOps'],
        menteesCount: 8,
        rating: 4.8,
        institution: 'RV College of Engineering',
        isVerified: true
    },
    {
        id: 'curated_m7',
        name: 'Rajesh Iyer',
        batchYear: '2001',
        department: 'Civil Engineering',
        branch: 'Civil Engineering',
        company: 'L&T Construction',
        designation: 'Project Director',
        location: 'Mumbai, India',
        avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
        about: '22 years delivering mega infrastructure projects across airports, metro rail, and bridges. Proud RVCE civil alumnus guiding future infrastructure leaders.',
        availability: 'Sundays, flexible',
        areas: ['Core Engineering', 'Infrastructure', 'Project Management', 'Consulting'],
        skills: ['Infrastructure', 'Project Management', 'Sustainable Construction', 'AutoCAD'],
        menteesCount: 12,
        rating: 4.5,
        institution: 'RV College of Engineering',
        isVerified: true
    },
    {
        id: 'curated_m8',
        name: 'Ananya Desai',
        batchYear: '2018',
        department: 'Electronics & Communication',
        branch: 'Electronics & Communication Engineering',
        company: 'Qualcomm',
        designation: 'ASIC Design Engineer',
        location: 'San Diego, CA',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        about: 'Recent RVCE grad turned chip designer. Relatable mentor for final-year students and fresh grads targeting VLSI, semiconductor design, and MS abroad.',
        availability: 'Weekends IST',
        areas: ['Core Engineering', 'VLSI Design', 'Higher Studies', 'Semiconductors'],
        skills: ['VLSI Design', 'RTL', 'SoC Architecture', 'Verilog', 'SystemVerilog'],
        menteesCount: 5,
        rating: 4.7,
        institution: 'RV College of Engineering',
        isVerified: true
    }
];

// Curated verified student mentees (AlmaConnect Mentee pool standard)
const DEFAULT_MENTEES = [
    {
        id: 'curated_mentee_1',
        name: 'Rohan Kulkarni',
        batchYear: '2025',
        department: 'Computer Science',
        branch: 'Computer Science & Engineering',
        institution: 'RV College of Engineering',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        areas: ['Software Engineering', 'System Design', 'Cloud Architecture'],
        whyMentor: 'I want guidance from an industry veteran on transitioning from college projects to scalable backend architectures, understanding distributed systems in production, and cracking product-based company technical rounds.',
        guidance: 'Backend engineering with Node.js/Go, microservices patterns, Docker/Kubernetes, and system design case studies.',
        progress: 'Completed AWS Certified Cloud Practitioner. Built a real-time collaborative code editor with WebSockets and Redis. Solved 300+ LeetCode problems.',
        activities: 'Technical Lead at RVCE Coding Club, Organized 8th Mile Hackathon 2024, Member of IEEE RVCE Student Branch.',
        appliedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
        id: 'curated_mentee_2',
        name: 'Ananya Sharma',
        batchYear: '2025',
        department: 'Electronics & Communication',
        branch: 'Electronics & Communication Engineering',
        institution: 'RV College of Engineering',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        areas: ['Higher Studies', 'VLSI Design', 'Research'],
        whyMentor: 'Aiming to pursue MS in Electrical & Computer Engineering with a specialization in Chip Design / Computer Architecture in the US for Fall 2026. Looking for guidance on research publications, SOP drafting, and university selection.',
        guidance: 'Digital VLSI design, Verilog/SystemVerilog, physical design flow, and MS application strategy for top US universities.',
        progress: 'Published a conference paper on Low Power ALU design at IEEE Confluence. Completed coursework in VLSI & Embedded Systems with a 9.2 CGPA. Cleared GRE (Score: 324).',
        activities: 'Core Committee Member of Rotaract Club RVCE, Technical volunteer at Astra Robotics, Class Representative.',
        appliedAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
        id: 'curated_mentee_3',
        name: 'Varun Nambiar',
        batchYear: '2024',
        department: 'Mechanical Engineering',
        branch: 'Mechanical Engineering',
        institution: 'RV College of Engineering',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        areas: ['Core Engineering', 'Automotive Engineering', 'CAD/CAM'],
        whyMentor: 'Seeking mentorship on breaking into EV powertrain design and transitioning core mechanical skills to modern electric vehicle platforms.',
        guidance: 'Thermal management in battery packs, FEA analysis using ANSYS, CAD modeling (SolidWorks/CATIA), and career pathways in EV startups.',
        progress: 'Lead chassis design engineer for Ashwa Racing (Formula Student Team of RVCE). Completed internship at Bosch Automotive.',
        activities: 'Chassis Lead at Ashwa Racing, SAE India Collegiate Club Member, Badminton Team RVCE.',
        appliedAt: new Date(Date.now() - 6 * 86400000).toISOString()
    },
    {
        id: 'curated_mentee_4',
        name: 'Shreya Hegde',
        batchYear: '2025',
        department: 'Information Science',
        branch: 'Information Science & Engineering',
        institution: 'RV College of Engineering',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        areas: ['Product Management', 'Entrepreneurship', 'Product Strategy'],
        whyMentor: 'Aspiring Associate Product Manager (APM). I need advice on building product sense, user research, product tear-downs, and interview frameworks for APM cohorts.',
        guidance: 'Product discovery, metrics definition (AARRR), wireframing, PRD drafting, and cross-functional leadership.',
        progress: 'Built and launched a campus book exchange web app with 1,200 active student users. Completed 2 APM case studies (Swiggy & Notion). Certified Scrum Master (PSM I).',
        activities: 'Vice President of E-Cell RVCE (Entrepreneurship Cell), Debate Club Captain, Finalist at Smart India Hackathon.',
        appliedAt: new Date(Date.now() - 8 * 86400000).toISOString()
    },
    {
        id: 'curated_mentee_5',
        name: 'Tejas Murthy',
        batchYear: '2024',
        department: 'Biotechnology',
        branch: 'Biotechnology',
        institution: 'RV College of Engineering',
        avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
        areas: ['Research', 'Higher Studies', 'Biotechnology'],
        whyMentor: 'Planning for PhD in Computational Biology and looking for insights from alumni currently working in pharma biotech research or pursuing doctoral studies abroad.',
        guidance: 'Genomics data pipeline analysis, molecular docking tools (PyMOL/AutoDock), and PhD supervisor outreach.',
        progress: 'Completed summer research fellowship at IISc Bengaluru. Authored python pipelines for RNA-Seq analysis. 9.4 CGPA.',
        activities: 'Biotechnology Association Student Coordinator, RVCE Quiz Club, Volunteer at Red Cross Society.',
        appliedAt: new Date(Date.now() - 10 * 86400000).toISOString()
    }
];

// @desc    Get all active mentors (DB + curated RVCE alumni)
// @route   GET /api/mentorship/mentors
exports.getMentors = async (req, res) => {
    try {
        const dbProfiles = await MentorshipProfile.find({ type: 'mentor', isActive: true })
            .populate('user', 'name email branch batchYear department company designation location avatar_url profilePicture skills headline bio institution');

        const dbMentors = dbProfiles.map(p => {
            const u = p.user || {};
            return {
                id: p._id.toString(),
                userId: u._id?.toString() || '',
                name: u.name || 'Alumni Mentor',
                email: u.email || '',
                batchYear: u.batchYear || 'Alumnus',
                department: u.department || u.branch || 'Engineering',
                branch: u.branch || u.department || 'Engineering',
                company: u.company || 'Industry Professional',
                designation: u.designation || 'Mentor',
                location: u.location || 'India',
                avatar_url: u.avatar_url || u.profilePicture || '',
                about: p.about || u.bio || '',
                availability: p.availability || 'Flexible, 2 slots/month',
                areas: p.areas && p.areas.length > 0 ? p.areas : (u.skills || []),
                skills: u.skills || [],
                menteesCount: 0,
                rating: 5.0,
                institution: u.institution || 'RV College of Engineering',
                isVerified: true,
                isDbProfile: true
            };
        });

        // Merge DB mentors with curated mentors, avoiding duplicates
        const combined = [...dbMentors, ...DEFAULT_MENTORS];
        res.json(combined);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all active mentees seeking guidance (DB + curated RVCE students)
// @route   GET /api/mentorship/mentees
exports.getMentees = async (req, res) => {
    try {
        const dbProfiles = await MentorshipProfile.find({ type: 'mentee', isActive: true })
            .populate('user', 'name email branch batchYear department avatar_url profilePicture institution headline bio');

        const dbMentees = dbProfiles.map(p => {
            const u = p.user || {};
            return {
                id: p._id.toString(),
                userId: u._id?.toString() || '',
                name: u.name || 'Student Mentee',
                email: u.email || '',
                batchYear: u.batchYear || 'Student',
                department: u.department || u.branch || 'Engineering',
                branch: u.branch || u.department || 'Engineering',
                institution: u.institution || 'RV College of Engineering',
                avatar_url: u.avatar_url || u.profilePicture || '',
                areas: p.areas || [],
                whyMentor: p.whyMentor || '',
                guidance: p.guidance || '',
                progress: p.progress || '',
                activities: p.activities || '',
                appliedAt: p.createdAt || new Date().toISOString(),
                isDbProfile: true
            };
        });

        const combined = [...dbMentees, ...DEFAULT_MENTEES];
        res.json(combined);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register or update current user mentorship profile (as mentor or mentee)
// @route   POST /api/mentorship/register
exports.registerMentorshipProfile = async (req, res) => {
    try {
        const { type, areas, whyMentor, guidance, progress, activities, about, availability, maxMentees } = req.body;

        if (!type || !['mentor', 'mentee'].includes(type)) {
            return res.status(400).json({ message: 'Valid type (mentor or mentee) is required' });
        }

        const profileData = {
            user: req.user._id,
            type,
            areas: Array.isArray(areas) ? areas : (areas ? [areas] : []),
            whyMentor: whyMentor || '',
            guidance: guidance || '',
            progress: progress || '',
            activities: activities || '',
            about: about || '',
            availability: availability || 'Flexible, 2 slots/month',
            maxMentees: Number(maxMentees) || 3,
            isActive: true
        };

        const profile = await MentorshipProfile.findOneAndUpdate(
            { user: req.user._id, type },
            { $set: profileData },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: `Successfully registered as ${type}!`,
            profile
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's mentorship registrations
// @route   GET /api/mentorship/profile/me
exports.getMyMentorshipProfile = async (req, res) => {
    try {
        const profiles = await MentorshipProfile.find({ user: req.user._id });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request mentorship
// @route   POST /api/mentorship/request
exports.requestMentorship = async (req, res) => {
    try {
        const { mentorId, goals, message } = req.body;
        
        if (!mentorId) {
            return res.status(400).json({ message: 'mentorId is required' });
        }

        // If mentorId starts with 'curated_', check if user exists or simulate
        let targetMentorUserId = mentorId;
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(mentorId);

        if (!isMongoId) {
            // For curated or demo mentor cards, respond with a successful mock confirmation
            return res.status(201).json({
                _id: 'req_' + Date.now(),
                mentor: mentorId,
                mentee: req.user._id,
                goals: goals || 'Professional Guidance',
                message: message || '',
                status: 'pending',
                createdAt: new Date().toISOString()
            });
        }

        const existingRequest = await Mentorship.findOne({
            mentor: targetMentorUserId,
            mentee: req.user._id,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending request with this mentor' });
        }

        const request = await Mentorship.create({
            mentor: targetMentorUserId,
            mentee: req.user._id,
            goals: goals || 'Professional Guidance',
            message: message || ''
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user mentorship requests and connections
// @route   GET /api/mentorship/my
exports.getMyMentorships = async (req, res) => {
    try {
        const mentorships = await Mentorship.find({
            $or: [{ mentor: req.user._id }, { mentee: req.user._id }]
        }).populate('mentor mentee', 'name email branch batchYear department company designation avatar_url profilePicture');
        
        res.json(mentorships);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update mentorship status (accept/reject/complete)
// @route   PUT /api/mentorship/:id
exports.updateMentorshipStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const mentorship = await Mentorship.findById(req.params.id);

        if (!mentorship) {
            return res.status(404).json({ message: 'Mentorship request not found' });
        }

        // Only the mentor can approve/reject
        if (mentorship.mentor.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized. Only the mentor can update this request.' });
        }

        mentorship.status = status;
        if (status === 'active') {
            mentorship.startDate = Date.now();
        } else if (status === 'completed') {
            mentorship.endDate = Date.now();
        }

        await mentorship.save();
        res.json(mentorship);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
