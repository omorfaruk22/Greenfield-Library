import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['Borrowing', 'Due date', 'Overdue', 'Return', 'Reservation', 'Fine', 'Payment', 'Membership', 'Announcement', 'System'], default: 'System' },
  title: { type: String, required: true, maxlength: 180 },
  message: { type: String, required: true, maxlength: 1200 },
  targetUrl: { type: String, default: '' },
  readAt: { type: Date, default: null },
  deduplicationKey: { type: String, default: undefined },
}, { timestamps: true });
schema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
schema.index({ deduplicationKey: 1 }, { unique: true, sparse: true });
export type NotificationDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.Notification as mongoose.Model<NotificationDocument>) || mongoose.model<NotificationDocument>('Notification', schema);
