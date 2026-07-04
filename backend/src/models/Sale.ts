import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
  salesDate: Date;
  invoiceNumber: string;
  buyerName: string;
  buyerMobile?: string;
  quantity: number;
  unitSellingRate: number;
  totalSaleAmount: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema: Schema = new Schema(
  {
    salesDate: { type: Date, required: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    buyerName: { type: String, required: true },
    buyerMobile: { type: String },
    quantity: { type: Number, required: true, min: 0.01 },
    unitSellingRate: { type: Number, required: true, min: 0 },
    totalSaleAmount: { type: Number, required: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

SaleSchema.index({ salesDate: -1, createdAt: -1 });
SaleSchema.index({ createdBy: 1, salesDate: -1 });

export default mongoose.model<ISale>('Sale', SaleSchema);
