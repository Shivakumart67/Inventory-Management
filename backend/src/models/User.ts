import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  passwordHash: string;
  mobile?: string;
  email?: string;
  address?: string;
  role: 'ADMIN' | 'MANAGER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    mobile: { type: String },
    email: { type: String },
    address: { type: String },
    role: { type: String, enum: ['ADMIN', 'MANAGER'], default: 'MANAGER', required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
