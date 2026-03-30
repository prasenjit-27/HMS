import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: String, required: true },
  problemCategory: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed', 'closed'], default: 'pending' },
  rejectionReason: { type: String },
  scheduledDate: { type: Date },
  chatEnabled: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  ratingComment: { type: String },
  isRated: { type: Boolean, default: false },
  closedAt: { type: Date }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
