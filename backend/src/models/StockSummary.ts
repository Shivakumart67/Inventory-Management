import mongoose, { Schema, Document } from 'mongoose';

export interface IStockSummary extends Document {
  currentStock: number;
  totalInwardQuantity: number;
  totalOutwardQuantity: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockSummarySchema: Schema = new Schema(
  {
    currentStock: { type: Number, required: true, default: 0 },
    totalInwardQuantity: { type: Number, required: true, default: 0 },
    totalOutwardQuantity: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IStockSummary>('StockSummary', StockSummarySchema);
