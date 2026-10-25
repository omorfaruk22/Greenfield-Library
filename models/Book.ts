import mongoose, { Schema, type InferSchemaType } from 'mongoose';
const schema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 220, index: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  isbn: { type: String, trim: true, default: undefined },
  subtitle: { type: String, default: '', maxlength: 220 },
  authorIds: [{ type: Schema.Types.ObjectId, ref: 'Author', required: true }],
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  publisherId: { type: Schema.Types.ObjectId, ref: 'Publisher' },
  publicationYear: { type: Number, min: 1000, max: 2100 },
  edition: { type: String, default: '' },
  language: { type: String, default: 'English', trim: true },
  description: { type: String, default: '', maxlength: 5000 },
  coverImageUrl: { type: String, default: '' },
  totalCopies: { type: Number, required: true, min: 0, default: 1 },
  availableCopies: { type: Number, required: true, min: 0, default: 1 },
  shelfLocation: { type: String, default: '', trim: true, maxlength: 80 },
  archivedAt: { type: Date, default: null, index: true },
  borrowingCount: { type: Number, min: 0, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
schema.index({ isbn: 1 }, { unique: true, partialFilterExpression: { isbn: { $type: 'string' } } });
schema.index({ title: 'text', isbn: 'text', description: 'text' });
schema.index({ categoryId: 1, archivedAt: 1, title: 1 });
schema.pre('validate', function validateInventory() {
  if (this.availableCopies > this.totalCopies) this.invalidate('availableCopies', 'Available copies cannot exceed total copies.');
});
export type BookDocument = InferSchemaType<typeof schema>;
export default (mongoose.models.Book as mongoose.Model<BookDocument>) || mongoose.model<BookDocument>('Book', schema);
