import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  expenseDate: Date;
  voucherNumber: string;
  category: string;
  subcategory?: string;
  amount: number;
  spentFor: string;
  description?: string;
  billNumber?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    expenseDate: { type: Date, required: true },
    voucherNumber: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    amount: { type: Number, required: true, min: 0.01 },
    spentFor: { type: String, required: true },
    description: { type: String },
    billNumber: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ExpenseSchema.index({ expenseDate: -1, createdAt: -1 });
ExpenseSchema.index({ createdBy: 1, expenseDate: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
