import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  status: { type: String, enum: ['Pending', 'Available for pickup', 'Fulfilled', 'Cancelled', 'Expired'], default: 'Pending', index: true },
  reservedAt: { type: Date, default: Date.now },
  queuePosition: { type: Number, min: 1 },
  availableAt: { type: Date },
  pickupExpiresAt: { type: Date },
  fulfilledAt: { type: Date },
  cancelledAt: { type: Date },
}, { timestamps: true });
schema.index({ memberId: 1, bookId: 1, status: 1 });
schema.index({ bookId: 1, status: 1, reservedAt: 1 });
export type ReservationDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.Reservation as mongoose.Model<ReservationDocument>) || mongoose.model<ReservationDocument>('Reservation', schema);
