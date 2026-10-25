import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const memberSchema = new Schema({
  memberId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true, index: true },
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  phone: { type: String, default: '', trim: true, maxlength: 30 },
  address: { type: String, default: '', trim: true, maxlength: 300 },
  membershipType: { type: String, enum: ['Student', 'Teacher', 'Staff', 'General Member'], default: 'Student', required: true },
  status: { type: String, enum: ['Active', 'Suspended', 'Expired'], default: 'Active', index: true },
  registrationDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  borrowingLimit: { type: Number, min: 0, default: 5 },
}, { timestamps: true });
memberSchema.index({ fullName: 1, memberId: 1 });

export type MemberDocument = InferSchemaType<typeof memberSchema>;
export default (mongoose.models.Member as mongoose.Model<MemberDocument>) || mongoose.model<MemberDocument>('Member', memberSchema);
