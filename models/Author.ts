import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  biography: { type: String, default: '', maxlength: 3000 },
  nationality: { type: String, default: '', maxlength: 80 },
  birthDate: { type: Date },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });
schema.index({ name: 1 }, { unique: true });
export type AuthorDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.Author as mongoose.Model<AuthorDocument>) || mongoose.model<AuthorDocument>('Author', schema);
