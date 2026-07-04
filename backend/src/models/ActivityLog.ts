import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  timestamp: Date;
  user: mongoose.Types.ObjectId;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    timestamp: { type: Date, default: Date.now, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
