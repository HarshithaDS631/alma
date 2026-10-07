const StudentData = require('../models/StudentData');
const axios = require('axios');
const csv = require('csv-parser');

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1_55cfGQP3082nn29X2IJQIxwtqD6KTsHdw7Xwt5NESA/export?format=csv';

/**
 * Synchronize RVCE Student / Alumni Master records from Google Sheet into MongoDB
 */
exports.syncStudents = async (req, res) => {
    return new Promise(async (resolve) => {
        try {
            let inputUrl = (req.body && req.body.sheetUrl) ? req.body.sheetUrl.trim() : DEFAULT_SHEET_URL;

            // Automatically convert web edit URL to direct CSV export format if needed
            if (inputUrl.includes('/edit')) {
                inputUrl = inputUrl.split('/edit')[0] + '/export?format=csv';
            } else if (!inputUrl.includes('format=csv') && inputUrl.includes('docs.google.com/spreadsheets')) {
                inputUrl = inputUrl.replace(/\/+$/, '') + '/export?format=csv';
            }

            const response = await axios.get(inputUrl, { 
                responseType: 'stream',
                timeout: 10000 
            });

            const results = [];
            response.data.pipe(csv())
                .on('data', (row) => {
                    const keys = Object.keys(row);
                    const nameKey = keys.find(k => /name/i.test(k));
                    const joinKey = keys.find(k => /join/i.test(k));
                    const leaveKey = keys.find(k => /leav|pass|grad|batch/i.test(k));

                    const rawName = nameKey ? (row[nameKey] || '').trim() : '';
                    const rawJoin = joinKey ? (row[joinKey] || '').trim() : '';
                    const rawLeave = leaveKey ? (row[leaveKey] || '').trim() : '';

                    if (rawName && (rawJoin || rawLeave)) {
                        results.push({
                            name: rawName.toLowerCase(),
                            joiningYear: rawJoin,
                            leavingYear: rawLeave,
                            institution: 'RV College of Engineering',
                            graduationStatus: 'COMPLETED',
                            lastSyncedAt: new Date()
                        });
                    }
                })
                .on('end', async () => {
                    try {
                        await StudentData.deleteMany({ institution: 'RV College of Engineering' });
                        if (results.length > 0) {
                            await StudentData.insertMany(results);
                        }
                        console.log(`[SYNC CONTROLLER] Successfully synced ${results.length} RVCE student records from Google Sheet.`);
                        res.status(200).json({ 
                            success: true,
                            count: results.length,
                            message: `Successfully synced ${results.length} student records from RVCE record sheet.`,
                            sample: results.slice(0, 5)
                        });
                        resolve();
                    } catch (dbError) {
                        console.error('[SYNC CONTROLLER DB ERROR]:', dbError.message);
                        res.status(500).json({ success: false, message: 'Database error during sync', error: dbError.message });
                        resolve();
                    }
                })
                .on('error', (err) => {
                    console.error('[SYNC CONTROLLER CSV ERROR]:', err.message);
                    res.status(500).json({ success: false, message: 'Error parsing CSV data from sheet', error: err.message });
                    resolve();
                });
        } catch (error) {
            console.error('[SYNC CONTROLLER ERROR]:', error.message);
            res.status(500).json({ success: false, message: 'Failed to sync student data from sheet', error: error.message });
            resolve();
        }
    });
};
