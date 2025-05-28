import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  emailVerified: { type: Date },
  image: { type: String },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);