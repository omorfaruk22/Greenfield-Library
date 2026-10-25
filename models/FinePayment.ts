import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  fineId: { type: Schema.Types.ObjectId, ref: 'Fine', required: true, index: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentMethod: { type: String, enum: ['Cash', 'Mobile banking', 'Card', 'Bank transfer', 'Other'], default: 'Cash' },
  reference: { type: String, default: '', trim: true, maxlength: 160 },
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  paidAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.index({ paidAt: -1 });
export type FinePaymentDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.FinePayment as mongoose.Model<FinePaymentDocument>) || mongoose.model<FinePaymentDocument>('FinePayment', schema);
