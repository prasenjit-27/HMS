const mongoose = require('mongoose');
const patientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age seems invalid'],
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    default: '',
  },
  medicalHistory: {
    type: String,
    trim: true,
    maxlength: [2000, 'Medical history cannot exceed 2000 characters'],
    default: '',
  },
}, {
  timestamps: true,
});
module.exports = mongoose.model('PatientProfile', patientProfileSchema);
