const mongoose = require('mongoose');
const doctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true,
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative'],
  },
  qualifications: {
    type: String,
    trim: true,
    default: '',
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  consultationFee: {
    type: Number,
    default: 0,
    min: [0, 'Fee cannot be negative'],
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: String,
    endTime: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});
doctorProfileSchema.index({ specialization: 1, status: 1 });
module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
