import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['Admin', 'Librarian', 'Member'], default: 'Member', required: true, index: true },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active', required: true, index: true },
  image: { type: String, default: '' },
  lastLoginAt: { type: Date },
}, { timestamps: true });

export type UserDocument = InferSchemaType<typeof userSchema>;
export default (mongoose.models.User as mongoose.Model<UserDocument>) || mongoose.model<UserDocument>('User', userSchema);
