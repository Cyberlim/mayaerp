import mongoose from 'mongoose';

const librarySettingsSchema = new mongoose.Schema({
    maxBooksStudent: { type: Number, default: 5 },
    maxBooksFaculty: { type: Number, default: 10 },
    issueDurationDays: { type: Number, default: 14 },
    fineRatePerDay: { type: Number, default: 5 },
    maxFineLimit: { type: Number, default: 500 },
    allowRenewals: { type: Boolean, default: false },
    strictFine: { type: Boolean, default: true },
    autoReminders: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

const LibrarySettings = mongoose.model('LibrarySettings', librarySettingsSchema);
export default LibrarySettings;
