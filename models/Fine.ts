import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  borrowingRecordId: { type: Schema.Types.ObjectId, ref: 'BorrowingRecord', required: true, unique: true },
  type: { type: String, enum: ['Overdue', 'Damage', 'Lost', 'Other'], default: 'Overdue' },
  assessedAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['Unpaid', 'Partially Paid', 'Paid', 'Waived'], default: 'Unpaid', index: true },
  assessedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '', maxlength: 1500 },
  assessedDailyRate: { type: Number, min: 0, default: 0 },
}, { timestamps: true });
schema.index({ memberId: 1, status: 1 });
export type FineDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.Fine as mongoose.Model<FineDocument>) || mongoose.model<FineDocument>('Fine', schema);
