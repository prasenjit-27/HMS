import Chat from '../models/Chat.js';
import Appointment from '../models/Appointment.js';

export const getChatByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    const isParticipant = appointment.patientId.toString() === req.user._id.toString() || appointment.doctorId.toString() === req.user._id.toString();
    if (!isParticipant && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    let chat = await Chat.findOne({ appointmentId }).populate('messages.senderId', 'name role');
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.json({ success: true, chat, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadChatFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || !appointment.chatEnabled) {
      return res.status(403).json({ success: false, message: 'Chat is not available' });
    }
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const chat = await Chat.findOne({ appointmentId });
    if (!chat || !chat.isActive) return res.status(403).json({ success: false, message: 'Chat is closed' });
    const message = {
      senderId: req.user._id,
      text: req.file.originalname,
      file: { url: fileUrl, originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size },
      messageType: 'file',
      timestamp: new Date()
    };
    chat.messages.push(message);
    await chat.save();
    const savedMsg = chat.messages[chat.messages.length - 1];
    res.json({ success: true, message: savedMsg, fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
