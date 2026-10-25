import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  key: { type: String, default: 'default', unique: true, required: true },
  libraryName: { type: String, default: 'Greenfield Library', maxlength: 150 },
  logoUrl: { type: String, default: '' },
  address: { type: String, default: '', maxlength: 400 },
  contactEmail: { type: String, default: '' },
  phone: { type: String, default: '' },
  timezone: { type: String, default: process.env.LIBRARY_TIMEZONE || 'Asia/Dhaka' },
  currency: { type: String, default: process.env.LIBRARY_CURRENCY || 'BDT' },
  defaultLoanDays: { type: Number, default: 14, min: 1, max: 365 },
  defaultBorrowingLimit: { type: Number, default: 5, min: 1, max: 100 },
  maxRenewals: { type: Number, default: 2, min: 0, max: 10 },
  renewalExtensionDays: { type: Number, default: 7, min: 1, max: 365 },
  pickupDays: { type: Number, default: 3, min: 1, max: 30 },
  dailyFineRate: { type: Number, default: 10, min: 0 },
  graceDays: { type: Number, default: 0, min: 0, max: 30 },
  maximumFine: { type: Number, default: 500, min: 0 },
  blockBorrowingWithUnpaidFines: { type: Boolean, default: false },
  publicMemberRegistration: { type: Boolean, default: true },
  defaultPageSize: { type: Number, default: 10, min: 5, max: 100 },
}, { timestamps: true });
export type LibrarySettingsDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.LibrarySettings as mongoose.Model<LibrarySettingsDocument>) || mongoose.model<LibrarySettingsDocument>('LibrarySettings', schema);
