import mongoose, { Schema } from 'mongoose';

const JourneySchema = new Schema({
  userId: { type: String, required: true },
  startPoint: { type: String, required: true },
  endPoint: { type: String, required: true },
  waypoints: [{ type: String }],
  departureDate: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.models.Journey || mongoose.model('Journey', JourneySchema);