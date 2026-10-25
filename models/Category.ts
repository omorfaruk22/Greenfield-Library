import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
}, { timestamps: true });
export type CategoryDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.Category as mongoose.Model<CategoryDocument>) || mongoose.model<CategoryDocument>('Category', schema);
