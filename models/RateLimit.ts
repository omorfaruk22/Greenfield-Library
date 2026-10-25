import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  resetAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
export type RateLimitDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.RateLimit as mongoose.Model<RateLimitDocument>) || mongoose.model<RateLimitDocument>('RateLimit', schema);
