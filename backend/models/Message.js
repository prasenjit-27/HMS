const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['patient', 'doctor'],
    required: true,
  },
  content: {
    type: String,
    trim: true,
    default: '',
  },
  fileUrl: {
    type: String,
    default: null,
  },
  fileType: {
    type: String,
    default: null,
  },
  fileName: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});
messageSchema.index({ consultationId: 1, createdAt: 1 });
module.exports = mongoose.model('Message', messageSchema);
