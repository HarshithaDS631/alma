const axios = require('axios');
const StudentData = require('../models/StudentData');

const SAP_CONFIG = {
    baseURL: process.env.SAP_SLCM_URL || '',
    username: process.env.SAP_SLCM_USER || '',
    password: process.env.SAP_SLCM_PASSWORD || '',
    timeout: parseInt(process.env.SAP_TIMEOUT_MS || '6000', 10)
};

/**
 * Check if SAP SLcM credentials and endpoint are fully configured in environment
 */
const isConfigured = () => {
    return Boolean(SAP_CONFIG.baseURL && SAP_CONFIG.username && SAP_CONFIG.password);
};

/**
 * Creates configured Axios client for SAP NetWeaver Gateway
 */
const getClient = () => {
    if (!isConfigured()) return null;

    return axios.create({
        baseURL: SAP_CONFIG.baseURL.replace(/\/+$/, ''),
        auth: {
            username: SAP_CONFIG.username,
            password: SAP_CONFIG.password
        },
        timeout: SAP_CONFIG.timeout,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'RVCE-AlumniNetwork-API/1.0 (+https://alumni.rvce.edu.in)'
        }
    });
};

/**
 * Real-time lookup of an alumnus by USN in SAP SLcM
 * @param {string} usn - University Seat Number (e.g. 1RV19CS042)
 * @returns {Promise<Object|null>} Normalized alumnus record or null
 */
const lookupAlumnusByUSN = async (usn) => {
    if (!usn || typeof usn !== 'string') return null;
    const cleanUSN = usn.trim().toUpperCase();

    // 1. If SAP is configured, query SAP Gateway OData Service
    const client = getClient();
    if (client) {
        try {
            const url = `/AlumniSet('${encodeURIComponent(cleanUSN)}')?$format=json`;
            const response = await client.get(url);
            const data = response.data?.d || response.data;

            if (data && (data.GraduationStatus === 'COMPLETED' || data.GraduationStatus === 'GRADUATED')) {
                // Upsert to local MongoDB master cache
                await StudentData.findOneAndUpdate(
                    { usn: cleanUSN },
                    {
                        usn: cleanUSN,
                        sapStudentId: data.StudentId || '',
                        name: data.FullName || '',
                        email: (data.CollegeEmail || '').toLowerCase(),
                        personalEmail: (data.PersonalEmail || '').toLowerCase(),
                        mobilePhone: data.MobilePhone || '',
                        institution: data.Institution || 'RV College of Engineering',
                        department: data.Department || '',
                        degree: data.Degree || '',
                        leavingYear: String(data.GraduationYear || ''),
                        graduationStatus: data.GraduationStatus,
                        lastSyncedAt: new Date()
                    },
                    { upsert: true, new: true }
                );

                return {
                    usn: cleanUSN,
                    name: data.FullName,
                    email: data.CollegeEmail,
                    personalEmail: data.PersonalEmail,
                    department: data.Department,
                    degree: data.Degree,
                    graduationYear: String(data.GraduationYear),
                    graduationStatus: data.GraduationStatus,
                    institution: data.Institution || 'RV College of Engineering',
                    source: 'SAP_LIVE'
                };
            }
        } catch (error) {
            console.warn(`[SAP SLcM Lookup Notice] USN: ${cleanUSN} - ${error.message}. Checking local master cache...`);
        }
    }

    // 2. Fallback to local MongoDB cache if SAP is offline or unconfigured
    try {
        const cached = await StudentData.findOne({ usn: cleanUSN });
        if (cached && (cached.graduationStatus === 'COMPLETED' || cached.graduationStatus === 'GRADUATED')) {
            return {
                usn: cached.usn,
                name: cached.name,
                email: cached.email,
                personalEmail: cached.personalEmail,
                department: cached.department,
                degree: cached.degree,
                graduationYear: cached.leavingYear,
                graduationStatus: cached.graduationStatus,
                institution: cached.institution,
                source: 'LOCAL_CACHE'
            };
        }
    } catch (dbErr) {
        console.error('[SAP Service] Local cache query error:', dbErr.message);
    }

    return null;
};

/**
 * Nightly Delta Batch Sync from SAP SLcM for a specific graduation batch
 * @param {string} gradYear - e.g. '2024'
 * @returns {Promise<{success: boolean, count: number}>}
 */
const syncGraduatedBatchFromSAP = async (gradYear) => {
    const client = getClient();
    if (!client) {
        return { success: false, count: 0, message: 'SAP credentials not configured' };
    }

    try {
        const filterClause = gradYear 
            ? `GraduationYear eq '${gradYear}' and GraduationStatus eq 'COMPLETED'`
            : `GraduationStatus eq 'COMPLETED'`;
            
        const url = `/AlumniSet?$filter=${encodeURIComponent(filterClause)}&$top=500&$format=json`;
        const response = await client.get(url);
        const results = response.data?.d?.results || response.data?.value || [];

        let syncCount = 0;
        for (const item of results) {
            if (item.USN) {
                await StudentData.findOneAndUpdate(
                    { usn: item.USN.toUpperCase() },
                    {
                        usn: item.USN.toUpperCase(),
                        sapStudentId: item.StudentId || '',
                        name: item.FullName || '',
                        email: (item.CollegeEmail || '').toLowerCase(),
                        personalEmail: (item.PersonalEmail || '').toLowerCase(),
                        mobilePhone: item.MobilePhone || '',
                        institution: item.Institution || 'RV College of Engineering',
                        department: item.Department || '',
                        degree: item.Degree || '',
                        leavingYear: String(item.GraduationYear || ''),
                        graduationStatus: item.GraduationStatus || 'COMPLETED',
                        lastSyncedAt: new Date()
                    },
                    { upsert: true }
                );
                syncCount++;
            }
        }

        return { success: true, count: syncCount };
    } catch (error) {
        console.error('[SAP Batch Sync Error]:', error.message);
        throw error;
    }
};

module.exports = {
    isConfigured,
    lookupAlumnusByUSN,
    syncGraduatedBatchFromSAP
};
