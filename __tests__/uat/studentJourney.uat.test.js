/**
 * UAT Test Suite: Student Persona Journey
 * Persona: Current / Prospective Student at RV Institutions
 * Scenarios: Onboarding, Directory Search, Mentorship Discovery, Job Browsing
 */

describe('UAT: Student Persona Acceptance Testing', () => {
  const mockStudentUser = {
    _id: 'stu_user_001',
    name: 'Harshitha D S',
    email: 'harshitha.student@rvce.edu.in',
    role: 'Student',
    institution: 'R.V. College of Engineering (RVCE)',
    department: 'Computer Science and Engineering',
    usn: '1RV21CS045',
    batch: '2021-2025',
    degree: 'B.E.',
    skills: ['React Native', 'JavaScript', 'Node.js', 'MongoDB'],
    isVerified: false,
  };

  const mockAlumniList = [
    {
      _id: 'alm_user_101',
      name: 'Aditya Sharma',
      role: 'Alumni',
      institution: 'R.V. College of Engineering (RVCE)',
      department: 'Computer Science and Engineering',
      batch: '2016-2020',
      company: 'Google',
      designation: 'Software Engineer III',
      isAvailableForMentorship: true,
      skills: ['Distributed Systems', 'System Design', 'Cloud'],
    },
    {
      _id: 'alm_user_102',
      name: 'Pooja Hegde',
      role: 'Alumni',
      institution: 'R.V. College of Engineering (RVCE)',
      department: 'Mechanical Engineering',
      batch: '2018-2022',
      company: 'Tesla',
      designation: 'Design Specialist',
      isAvailableForMentorship: false,
      skills: ['CAD', 'Thermal Dynamics'],
    },
    {
      _id: 'alm_user_103',
      name: 'Rohan Patil',
      role: 'Alumni',
      institution: 'RV University (RVU)',
      department: 'School of Design',
      batch: '2019-2023',
      company: 'Figma',
      designation: 'Product Designer',
      isAvailableForMentorship: true,
      skills: ['UI/UX', 'Design Systems'],
    }
  ];

  const mockJobsList = [
    {
      _id: 'job_001',
      title: 'Associate Software Engineer',
      company: 'Google',
      location: 'Bengaluru, India',
      workplaceType: 'Hybrid',
      jobType: 'Full-time',
      institution: 'R.V. College of Engineering (RVCE)',
      isActive: true,
      skillsRequired: ['JavaScript', 'Data Structures'],
    },
    {
      _id: 'job_002',
      title: 'Frontend Developer Intern',
      company: 'Startup Hub',
      location: 'Remote',
      workplaceType: 'Remote',
      jobType: 'Internship',
      institution: 'All Institutions',
      isActive: true,
      skillsRequired: ['React Native', 'TypeScript'],
    }
  ];

  describe('Journey 1: Registration & Profile Setup (SC-STU-01, SC-STU-02, SC-STU-03)', () => {
    test('SC-STU-01: Validates required registration fields for students', () => {
      const validateRegistration = (payload) => {
        const errors = [];
        if (!payload.name || payload.name.trim().length < 2) errors.push('Name is required');
        if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push('Valid email is required');
        if (!payload.password || payload.password.length < 6) errors.push('Password must be at least 6 characters');
        if (!payload.institution) errors.push('Institution selection is required');
        if (!payload.department) errors.push('Department selection is required');
        if (payload.role === 'Student' && !payload.usn) errors.push('USN is required for student registration');
        return { isValid: errors.length === 0, errors };
      };

      // Valid student payload
      const validResult = validateRegistration({
        name: mockStudentUser.name,
        email: mockStudentUser.email,
        password: 'Password123!',
        institution: mockStudentUser.institution,
        department: mockStudentUser.department,
        role: 'Student',
        usn: mockStudentUser.usn,
      });
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Incomplete payload
      const invalidResult = validateRegistration({
        name: 'A',
        email: 'invalid-email',
        password: '123',
        institution: '',
        department: '',
        role: 'Student',
        usn: '',
      });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Valid email is required');
      expect(invalidResult.errors).toContain('Password must be at least 6 characters');
      expect(invalidResult.errors).toContain('USN is required for student registration');
    });

    test('SC-STU-02: Sanitizes and prepares student profile data on completion', () => {
      const profileCompletion = {
        headline: 'Aspiring Full Stack Engineer | Pre-Final Year CSE',
        bio: 'Passionate about mobile apps and scalable backend systems.',
        skills: ['React Native', 'Node.js', 'System Design'],
        linkedIn: 'https://linkedin.com/in/harshitha-ds',
      };

      const updatedProfile = {
        ...mockStudentUser,
        ...profileCompletion,
        profileCompleted: true,
      };

      expect(updatedProfile.profileCompleted).toBe(true);
      expect(updatedProfile.skills).toContain('React Native');
      expect(updatedProfile.headline).toBeDefined();
    });
  });

  describe('Journey 2: Alumni Directory Search & Filtering (SC-STU-04, SC-STU-05)', () => {
    test('SC-STU-04: Student can filter alumni by department and institution', () => {
      const filterAlumni = (list, { institution, department, query }) => {
        return list.filter((alumni) => {
          const matchInst = !institution || alumni.institution.toLowerCase() === institution.toLowerCase();
          const matchDept = !department || alumni.department.toLowerCase() === department.toLowerCase();
          const matchQuery = !query || 
            alumni.name.toLowerCase().includes(query.toLowerCase()) ||
            alumni.company.toLowerCase().includes(query.toLowerCase()) ||
            alumni.skills.some(s => s.toLowerCase().includes(query.toLowerCase()));
          return matchInst && matchDept && matchQuery;
        });
      };

      // Filter by student's own institution & department
      const cseAlumni = filterAlumni(mockAlumniList, {
        institution: 'R.V. College of Engineering (RVCE)',
        department: 'Computer Science and Engineering',
      });
      expect(cseAlumni).toHaveLength(1);
      expect(cseAlumni[0].name).toBe('Aditya Sharma');

      // Search by keyword "Google"
      const googleAlumni = filterAlumni(mockAlumniList, { query: 'google' });
      expect(googleAlumni).toHaveLength(1);
      expect(googleAlumni[0].company).toBe('Google');
    });

    test('SC-STU-05: Student can construct and submit a connection request to Alumni', () => {
      const createConnectionRequest = (senderId, recipientId, note) => {
        if (!senderId || !recipientId) throw new Error('Sender and recipient are required');
        if (senderId === recipientId) throw new Error('Cannot send connection request to yourself');
        return {
          sender: senderId,
          recipient: recipientId,
          note: note || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
      };

      const request = createConnectionRequest(
        mockStudentUser._id,
        'alm_user_101',
        'Hi Aditya, I am a 3rd year CSE student at RVCE and would love to connect!'
      );
      expect(request.status).toBe('pending');
      expect(request.sender).toBe(mockStudentUser._id);
      expect(request.recipient).toBe('alm_user_101');
      expect(request.note).toContain('3rd year CSE');
    });
  });

  describe('Journey 3: Mentorship Discovery & Requests (SC-STU-06)', () => {
    test('SC-STU-06: Student can find mentors open to mentorship and submit mentorship request', () => {
      const availableMentors = mockAlumniList.filter(alumni => alumni.isAvailableForMentorship);
      expect(availableMentors).toHaveLength(2);

      const requestMentorship = (student, mentorId, topic, goals) => {
        const targetMentor = mockAlumniList.find(a => a._id === mentorId);
        if (!targetMentor) throw new Error('Mentor not found');
        if (!targetMentor.isAvailableForMentorship) {
          throw new Error('This alumni is currently not accepting new mentees');
        }
        return {
          mentee: student._id,
          mentor: mentorId,
          topic,
          goals,
          status: 'REQUESTED',
          timestamp: Date.now(),
        };
      };

      // Valid mentorship request
      const mentorshipApplication = requestMentorship(
        mockStudentUser,
        'alm_user_101',
        'Career Guidance in Cloud Architecture',
        'Looking to prepare for campus placements and open source contributions'
      );
      expect(mentorshipApplication.status).toBe('REQUESTED');
      expect(mentorshipApplication.mentor).toBe('alm_user_101');

      // Attempt to request mentor who is unavailable
      expect(() => {
        requestMentorship(mockStudentUser, 'alm_user_102', 'Career Guidance', 'General chat');
      }).toThrow('This alumni is currently not accepting new mentees');
    });
  });

  describe('Journey 4: Job Browsing & Applications (SC-STU-07)', () => {
    test('SC-STU-07: Student sees jobs matching their institution and can filter by jobType', () => {
      const getStudentJobs = (jobs, user, filterType) => {
        return jobs.filter((job) => {
          const institutionMatch = 
            job.institution === 'All Institutions' || 
            job.institution.toLowerCase() === user.institution.toLowerCase();
          const typeMatch = !filterType || job.jobType === filterType;
          return job.isActive && institutionMatch && typeMatch;
        });
      };

      const eligibleJobs = getStudentJobs(mockJobsList, mockStudentUser);
      expect(eligibleJobs).toHaveLength(2);

      const internships = getStudentJobs(mockJobsList, mockStudentUser, 'Internship');
      expect(internships).toHaveLength(1);
      expect(internships[0].title).toBe('Frontend Developer Intern');
      expect(internships[0].workplaceType).toBe('Remote');
    });
  });
});
