const Message = require('../models/Message');
const Consultation = require('../models/Consultation');
exports.getMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user._id;

    const consultation = await Consultation.findById(consultationId)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found.' });
    }

    const isParticipant =
      consultation.patientId._id.toString() === userId.toString() ||
      consultation.doctorId._id.toString() === userId.toString();
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const messages = await Message.find({ consultationId })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      data: {
        messages,
        consultation: {
          id: consultation._id,
          status: consultation.status,
          patientId: consultation.patientId,
          doctorId: consultation.doctorId,
        },
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
};
exports.uploadFile = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user._id;
    const consultation = await Consultation.findById(consultationId);
    if (!consultation || consultation.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Cannot send files to this consultation.' });
    }
    const isParticipant =
      consultation.patientId.toString() === userId.toString() ||
      consultation.doctorId.toString() === userId.toString();
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const message = await Message.create({
      consultationId,
      senderId: userId,
      senderRole: req.user.role,
      content: '',
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
    });
    const populated = await Message.findById(message._id).populate('senderId', 'name role');
    const io = req.app.get('io');
    if (io) {
      io.to(`consultation_${consultationId}`).emit('receive_message', populated);
    }
    res.status(201).json({
      success: true,
      message: 'File uploaded.',
      data: populated,
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file.' });
  }
};
