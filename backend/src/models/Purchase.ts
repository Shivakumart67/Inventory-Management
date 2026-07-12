import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchase extends Document {
  purchaseDate: Date;
  referenceNumber: string;
  supplierName?: string;
  supplierMobile?: string;
  quantity: number;
  unitType?: string;
  ratePerUnit: number;
  totalAmount: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema: Schema = new Schema(
  {
    purchaseDate: { type: Date, required: true },
    referenceNumber: { type: String, required: true, unique: true, index: true },
    supplierName: { type: String, default: 'Egg Collection', required: false },
    supplierMobile: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0.01 },
    unitType: { type: String, default: 'Units', required: false },
    ratePerUnit: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PurchaseSchema.index({ purchaseDate: -1, createdAt: -1 });
PurchaseSchema.index({ createdBy: 1, purchaseDate: -1 });

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);
