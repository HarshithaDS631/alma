const mongoose = require('mongoose');

// History of CSV roster imports performed from the admin panel
const importBatchSchema = new mongoose.Schema({
    institution: { type: String, required: true, index: true },
    fileName: { type: String, default: 'pasted.csv' },
    totalRows: { type: Number, default: 0 },
    imported: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    errors: [{ row: Number, message: String }],
    status: { type: String, enum: ['Completed', 'Partial', 'Failed'], default: 'Completed' },
    initiatedBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ImportBatch', importBatchSchema);
