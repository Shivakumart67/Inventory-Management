import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteConfig extends Document {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  gstin?: string;
  currency: string;
  currencySymbol: string;
  createdAt: Date;
  updatedAt: Date;
}

const SiteConfigSchema: Schema = new Schema(
  {
    companyName: { type: String, required: true, default: 'Shiva Farms' },
    companyAddress: { type: String },
    companyPhone: { type: String },
    companyEmail: { type: String },
    gstin: { type: String },
    currency: { type: String, default: 'INR', required: true },
    currencySymbol: { type: String, default: '₹', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);
