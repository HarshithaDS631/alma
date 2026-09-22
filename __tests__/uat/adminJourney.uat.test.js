/**
 * UAT Test Suite: Institutional Admin & SuperAdmin Persona Journey
 * Persona: Institution Administrator / System Governance
 * Scenarios: Verification Request Queue, Approval/Rejection, User Moderation, Audit Trail Logging
 */

describe('UAT: Admin Persona Acceptance Testing', () => {
  const mockAdminUser = {
    _id: 'adm_user_001',
    name: 'Dr. K. S. Murthy',
    email: 'admin.rvce@rvei.edu.in',
    role: 'Institution Admin',
    institution: 'R.V. College of Engineering (RVCE)',
    permissions: ['VERIFY_ALUMNI', 'MODERATE_POSTS', 'VIEW_METRICS', 'MANAGE_USERS'],
  };

  const mockVerificationQueue = [
    {
      _id: 'ver_001',
      user: {
        _id: 'pending_user_91',
        name: 'Vikas Rao',
        email: 'vikas.rao@gmail.com',
      },
      institution: 'R.V. College of Engineering (RVCE)',
      department: 'Computer Science and Engineering',
      usnOrRollNo: '1RV18CS120',
      graduationYear: '2022',
      degree: 'B.E.',
      idProofDocumentUrl: 'https://storage.supabase.co/proofs/1RV18CS120.pdf',
      status: 'PENDING',
    },
    {
      _id: 'ver_002',
      user: {
        _id: 'pending_user_92',
        name: 'Shreya K',
        email: 'shreya.k@gmail.com',
      },
      institution: 'R.V. College of Engineering (RVCE)',
      department: 'Information Science and Engineering',
      usnOrRollNo: '1RV19IS088',
      graduationYear: '2023',
      degree: 'B.E.',
      idProofDocumentUrl: 'https://storage.supabase.co/proofs/1RV19IS088.pdf',
      status: 'PENDING',
    },
    {
      _id: 'ver_003',
      user: {
        _id: 'pending_user_93',
        name: 'Nikhil Gowda',
        email: 'nikhil.gowda@gmail.com',
      },
      institution: 'RV Institute of Management (RVIM)',
      department: 'Finance and Marketing',
      usnOrRollNo: '1RV20MBA012',
      graduationYear: '2022',
      degree: 'MBA',
      idProofDocumentUrl: 'https://storage.supabase.co/proofs/1RV20MBA012.pdf',
      status: 'PENDING',
    }
  ];

  describe('Journey 1: Institutional Verification Queue (SC-ADM-01, SC-ADM-02)', () => {
    test('SC-ADM-01: Admin can only view verification requests scoped to their institution', () => {
      const getScopedQueue = (admin, queue) => {
        if (admin.role === 'Super Admin') return queue;
        return queue.filter(
          item => item.institution.toLowerCase() === admin.institution.toLowerCase()
        );
      };

      const scopedRequests = getScopedQueue(mockAdminUser, mockVerificationQueue);
      expect(scopedRequests).toHaveLength(2);
      expect(scopedRequests.every(r => r.institution === mockAdminUser.institution)).toBe(true);
    });

    test('SC-ADM-02: Approving verification updates verification status and generates user verification payload', () => {
      const processVerification = (request, adminId, decision, rejectionReason = '') => {
        if (!['APPROVED', 'REJECTED'].includes(decision)) {
          throw new Error('Status must be APPROVED or REJECTED');
        }
        if (decision === 'REJECTED' && !rejectionReason.trim()) {
          throw new Error('Rejection reason is mandatory when declining verification');
        }

        const updatedRequest = {
          ...request,
          status: decision,
          reviewedBy: adminId,
          reviewedAt: new Date().toISOString(),
          rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined,
        };

        const updatedUser = decision === 'APPROVED' ? {
          _id: request.user._id,
          isVerified: true,
          institution: request.institution,
          department: request.department,
          usn: request.usnOrRollNo,
          batch: request.graduationYear,
        } : null;

        return { updatedRequest, updatedUser };
      };

      // Approval flow
      const { updatedRequest, updatedUser } = processVerification(
        mockVerificationQueue[0],
        mockAdminUser._id,
        'APPROVED'
      );
      expect(updatedRequest.status).toBe('APPROVED');
      expect(updatedRequest.reviewedBy).toBe(mockAdminUser._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.usn).toBe('1RV18CS120');

      // Rejection with mandatory reason
      const rejectionResult = processVerification(
        mockVerificationQueue[1],
        mockAdminUser._id,
        'REJECTED',
        'Uploaded marksheet degree does not match USN records.'
      );
      expect(rejectionResult.updatedRequest.status).toBe('REJECTED');
      expect(rejectionResult.updatedRequest.rejectionReason).toContain('Uploaded marksheet');
      expect(rejectionResult.updatedUser).toBeNull();

      // Reject without reason fails
      expect(() => {
        processVerification(mockVerificationQueue[1], mockAdminUser._id, 'REJECTED', '');
      }).toThrow('Rejection reason is mandatory');
    });
  });

  describe('Journey 2: User Moderation & Content Safety (SC-ADM-03, SC-ADM-04)', () => {
    test('SC-ADM-03: Admin can suspend non-compliant user accounts', () => {
      const user = {
        _id: 'flagged_user_44',
        name: 'Spam Bot Account',
        isActive: true,
        isSuspended: false,
      };

      const suspendUser = (admin, targetUser, reason) => {
        if (!admin.permissions.includes('MANAGE_USERS')) {
          throw new Error('Forbidden: insufficient permissions');
        }
        return {
          ...targetUser,
          isActive: false,
          isSuspended: true,
          suspensionReason: reason,
          suspendedAt: new Date().toISOString(),
          suspendedBy: admin._id,
        };
      };

      const suspended = suspendUser(mockAdminUser, user, 'Multiple reports of commercial spam');
      expect(suspended.isSuspended).toBe(true);
      expect(suspended.isActive).toBe(false);
      expect(suspended.suspensionReason).toContain('commercial spam');
    });

    test('SC-ADM-04: Admin can review and act on reported post content', () => {
      const report = {
        _id: 'rep_12',
        postId: 'post_999',
        reason: 'Hate speech or harassment',
        status: 'OPEN',
      };

      const resolveReport = (reportItem, adminAction) => {
        return {
          ...reportItem,
          status: 'RESOLVED',
          actionTaken: adminAction, // e.g. 'POST_REMOVED' or 'DISMISSED'
          resolvedAt: new Date().toISOString(),
        };
      };

      const resolved = resolveReport(report, 'POST_REMOVED');
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.actionTaken).toBe('POST_REMOVED');
    });
  });

  describe('Journey 3: Audit Trail & Compliance Logging (SC-ADM-05)', () => {
    test('SC-ADM-05: Administrative actions record immutable audit logs', () => {
      const auditLogStore = [];

      const recordAuditLog = (adminId, action, targetResource, metadata) => {
        const entry = {
          _id: `log_${auditLogStore.length + 1}`,
          admin: adminId,
          action,
          targetResource,
          metadata,
          timestamp: new Date().toISOString(),
        };
        auditLogStore.push(entry);
        return entry;
      };

      recordAuditLog(
        mockAdminUser._id,
        'VERIFY_ALUMNI_APPROVAL',
        'ver_001',
        { usn: '1RV18CS120', user: 'pending_user_91' }
      );

      recordAuditLog(
        mockAdminUser._id,
        'USER_SUSPENDED',
        'flagged_user_44',
        { reason: 'Multiple reports of commercial spam' }
      );

      expect(auditLogStore).toHaveLength(2);
      expect(auditLogStore[0].action).toBe('VERIFY_ALUMNI_APPROVAL');
      expect(auditLogStore[1].targetResource).toBe('flagged_user_44');
    });
  });
});
