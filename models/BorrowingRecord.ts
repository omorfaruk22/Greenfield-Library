import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  borrowedAt: { type: Date, default: Date.now, required: true },
  dueAt: { type: Date, required: true, index: true },
  returnedAt: { type: Date, default: null },
  status: { type: String, enum: ['Borrowed', 'Returned'], default: 'Borrowed', required: true, index: true },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  renewedCount: { type: Number, default: 0, min: 0 },
  renewalHistory: [{ oldDueAt: Date, newDueAt: Date, renewedBy: { type: Schema.Types.ObjectId, ref: 'User' }, renewedAt: Date }],
}, { timestamps: true });
schema.index({ memberId: 1, bookId: 1, status: 1 });
schema.index({ status: 1, dueAt: 1 });
export type BorrowingRecordDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.BorrowingRecord as mongoose.Model<BorrowingRecordDocument>) || mongoose.model<BorrowingRecordDocument>('BorrowingRecord', schema);
