/**
 * UAT Test Suite: Alumni Persona Journey
 * Persona: Graduated Alumni of RV Institutions
 * Scenarios: Authentication, Profile Enrichment, Job Posting, Mentorship Management, Feed Posts
 */

describe('UAT: Alumni Persona Acceptance Testing', () => {
  const mockAlumniUser = {
    _id: 'alm_user_101',
    name: 'Aditya Sharma',
    email: 'aditya.sharma@alumni.rvce.edu.in',
    role: 'Alumni',
    institution: 'R.V. College of Engineering (RVCE)',
    department: 'Computer Science and Engineering',
    batch: '2016-2020',
    degree: 'B.E.',
    isVerified: true,
    company: 'Google',
    designation: 'Software Engineer III',
    isAvailableForMentorship: true,
    maxMentees: 3,
    activeMentees: 1,
  };

  describe('Journey 1: Profile & Career Enrichment (SC-ALM-01, SC-ALM-02)', () => {
    test('SC-ALM-01: Alumni updates experience, skills, and current employer details', () => {
      const updateAlumniProfile = (alumni, payload) => {
        const allowedUpdates = ['company', 'designation', 'location', 'skills', 'experience', 'linkedIn', 'github'];
        const updated = { ...alumni };
        for (const [key, value] of Object.entries(payload)) {
          if (allowedUpdates.includes(key)) {
            updated[key] = value;
          }
        }
        return updated;
      };

      const updated = updateAlumniProfile(mockAlumniUser, {
        company: 'Alphabet Inc.',
        designation: 'Senior Staff Engineer',
        location: 'Bengaluru, India',
        skills: ['Kubernetes', 'Go', 'Distributed Systems', 'GCP'],
        experience: [
          { company: 'Google', role: 'SWE III', from: '2020', to: 'Present' },
          { company: 'Microsoft', role: 'Software Intern', from: '2019', to: '2020' }
        ]
      });

      expect(updated.company).toBe('Alphabet Inc.');
      expect(updated.designation).toBe('Senior Staff Engineer');
      expect(updated.experience).toHaveLength(2);
      expect(updated.skills).toContain('Kubernetes');
    });

    test('SC-ALM-02: Alumni can toggle mentorship availability and update mentee capacity', () => {
      const setMentorshipCapacity = (alumni, isAvailable, maxMentees) => {
        if (maxMentees < 1) throw new Error('Maximum mentees must be at least 1');
        return {
          ...alumni,
          isAvailableForMentorship: isAvailable,
          maxMentees: maxMentees,
        };
      };

      const toggled = setMentorshipCapacity(mockAlumniUser, true, 5);
      expect(toggled.isAvailableForMentorship).toBe(true);
      expect(toggled.maxMentees).toBe(5);

      expect(() => {
        setMentorshipCapacity(mockAlumniUser, true, 0);
      }).toThrow('Maximum mentees must be at least 1');
    });
  });

  describe('Journey 2: Job Opportunity Posting (SC-ALM-03)', () => {
    test('SC-ALM-03: Alumni can publish a job posting scoped to their institution or all', () => {
      const createJobPosting = (user, jobData) => {
        if (!jobData.title || jobData.title.trim().length < 3) {
          throw new Error('Valid job title is required');
        }
        if (!jobData.company || jobData.company.trim().length < 2) {
          throw new Error('Company name is required');
        }
        if (!jobData.applyUrl && !jobData.contactEmail) {
          throw new Error('Either application URL or contact email must be provided');
        }

        return {
          _id: `job_${Date.now()}`,
          ...jobData,
          postedBy: user._id,
          institution: jobData.institution || user.institution,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      };

      const newJob = createJobPosting(mockAlumniUser, {
        title: 'Backend Engineer (Go / Distributed Systems)',
        company: 'Google Cloud',
        location: 'Bengaluru / Hyderabad',
        jobType: 'Full-time',
        workplaceType: 'Hybrid',
        applyUrl: 'https://careers.google.com/jobs/12345',
        description: 'Opportunity for RVCE alumni and students to join the GCP Storage team.',
      });

      expect(newJob._id).toBeDefined();
      expect(newJob.postedBy).toBe(mockAlumniUser._id);
      expect(newJob.institution).toBe(mockAlumniUser.institution);
      expect(newJob.isActive).toBe(true);
    });
  });

  describe('Journey 3: Connection Request Management (SC-ALM-04)', () => {
    test('SC-ALM-04: Alumni can accept student connection request and update network connections', () => {
      const incomingRequest = {
        _id: 'req_998',
        sender: 'stu_user_001',
        recipient: mockAlumniUser._id,
        status: 'pending',
      };

      const handleConnection = (req, action) => {
        if (req.recipient !== mockAlumniUser._id) {
          throw new Error('Not authorized to manage this request');
        }
        if (!['accepted', 'declined'].includes(action)) {
          throw new Error('Action must be accepted or declined');
        }
        return {
          ...req,
          status: action,
          resolvedAt: new Date().toISOString(),
        };
      };

      const accepted = handleConnection(incomingRequest, 'accepted');
      expect(accepted.status).toBe('accepted');
      expect(accepted.resolvedAt).toBeDefined();
    });
  });

  describe('Journey 4: Community Post Creation & Interaction (SC-ALM-05, SC-ALM-06)', () => {
    test('SC-ALM-05: Alumni creates a feed post and students/alumni can like and comment', () => {
      const createPost = (user, content, tags = []) => {
        if (!content || content.trim().length === 0) {
          throw new Error('Post content cannot be empty');
        }
        return {
          _id: 'post_777',
          user: user._id,
          userName: user.name,
          institution: user.institution,
          content,
          tags,
          likes: [],
          comments: [],
          createdAt: new Date().toISOString(),
        };
      };

      const post = createPost(
        mockAlumniUser,
        'Thrilled to announce that we are hiring 2025 graduates for our cloud infra team! Reach out for referrals.',
        ['Hiring', 'Cloud', 'RVCEAlumni']
      );

      expect(post.user).toBe(mockAlumniUser._id);
      expect(post.tags).toContain('Hiring');

      // Add Like
      const likePost = (p, userId) => {
        const alreadyLiked = p.likes.includes(userId);
        const updatedLikes = alreadyLiked 
          ? p.likes.filter(id => id !== userId) 
          : [...p.likes, userId];
        return { ...p, likes: updatedLikes };
      };

      const likedPost = likePost(post, 'stu_user_001');
      expect(likedPost.likes).toContain('stu_user_001');

      // Add Comment
      const commentPost = (p, userId, text) => {
        if (!text || text.trim().length === 0) throw new Error('Comment cannot be empty');
        return {
          ...p,
          comments: [...p.comments, { userId, text, timestamp: Date.now() }]
        };
      };

      const commentedPost = commentPost(likedPost, 'stu_user_001', 'Thank you for sharing, Sir! Just sent my resume.');
      expect(commentedPost.comments).toHaveLength(1);
      expect(commentedPost.comments[0].text).toContain('Just sent my resume');
    });

    test('SC-ALM-06: Alumni confirms RSVP for an institutional alumni reunion event', () => {
      const event = {
        _id: 'evt_2026',
        title: 'RV Institutions Global Alumni Meet 2026',
        date: '2026-11-15T10:00:00Z',
        venue: 'RVCE Campus Auditorium',
        attendees: ['alm_user_102'],
      };

      const rsvpEvent = (ev, userId) => {
        if (ev.attendees.includes(userId)) {
          return { ...ev, attendees: ev.attendees.filter(id => id !== userId), status: 'CANCELLED' };
        }
        return { ...ev, attendees: [...ev.attendees, userId], status: 'CONFIRMED' };
      };

      const updatedEvent = rsvpEvent(event, mockAlumniUser._id);
      expect(updatedEvent.attendees).toContain(mockAlumniUser._id);
      expect(updatedEvent.status).toBe('CONFIRMED');
    });
  });
});
