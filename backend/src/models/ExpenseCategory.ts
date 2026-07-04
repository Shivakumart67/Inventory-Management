import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseCategory extends Document {
  name: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);
