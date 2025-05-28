import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  weather: {
    condition: String,
    temperature: Number,
    precipitation: Number,
    lastUpdated: { type: Date, default: Date.now },
  },
});

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);