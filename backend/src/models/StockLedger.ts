import mongoose, { Schema, Document } from 'mongoose';

export interface IStockLedger extends Document {
  date: Date;
  entryType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT';
  referenceNumber: string;
  inQuantity: number;
  outQuantity: number;
  closingStock: number;
  linkedEntryId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockLedgerSchema: Schema = new Schema(
  {
    date: { type: Date, required: true, index: true },
    entryType: { type: String, enum: ['PURCHASE', 'SALE', 'ADJUSTMENT'], required: true },
    referenceNumber: { type: String, required: true },
    inQuantity: { type: Number, default: 0, min: 0 },
    outQuantity: { type: Number, default: 0, min: 0 },
    closingStock: { type: Number, required: true },
    linkedEntryId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IStockLedger>('StockLedger', StockLedgerSchema);
