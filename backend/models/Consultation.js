const mongoose = require('mongoose');
const consultationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms description is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'closed'],
    default: 'pending',
  },
  closedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});
consultationSchema.index({ patientId: 1, status: 1 });
consultationSchema.index({ doctorId: 1, status: 1 });
module.exports = mongoose.model('Consultation', consultationSchema);
