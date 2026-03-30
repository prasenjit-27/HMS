import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  qualifications: { type: String },
  bio: { type: String },
  profilePhoto: { type: String, default: '' },
  consultationFee: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  availableDays: [{ type: String }],
  availableHours: { type: String }
}, { timestamps: true });

doctorSchema.virtual('averageRating').get(function() {
  return this.ratingCount > 0 ? (this.totalRatings / this.ratingCount).toFixed(1) : 0;
});

doctorSchema.set('toJSON', { virtuals: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
