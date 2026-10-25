import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, maxlength: 100 },
  resourceType: { type: String, required: true, maxlength: 100 },
  resourceId: { type: String, default: '' },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  requestId: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
}, { timestamps: true });
schema.index({ createdAt: -1 });
export type AuditLogDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.AuditLog as mongoose.Model<AuditLogDocument>) || mongoose.model<AuditLogDocument>('AuditLog', schema);
