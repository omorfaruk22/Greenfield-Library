import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

export type SessionDocument = InferSchemaType<typeof sessionSchema>;
export default (mongoose.models.Session as mongoose.Model<SessionDocument>) || mongoose.model<SessionDocument>('Session', sessionSchema);
