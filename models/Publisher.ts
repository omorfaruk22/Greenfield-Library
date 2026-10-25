import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  email: { type: String, default: '', lowercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  address: { type: String, default: '', maxlength: 400 },
  website: { type: String, default: '' },
}, { timestamps: true });
schema.index({ name: 1 }, { unique: true });
export type PublisherDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.Publisher as mongoose.Model<PublisherDocument>) || mongoose.model<PublisherDocument>('Publisher', schema);
