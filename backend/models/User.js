const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  profileImage: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: [true, 'Role is required'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: function () {
      return this.role !== 'doctor';
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});
userSchema.index({ role: 1, isApproved: 1 });
module.exports = mongoose.model('User', userSchema);
