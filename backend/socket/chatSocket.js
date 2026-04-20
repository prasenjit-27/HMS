const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-otp -otpExpiry');
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });
  io.on('connection', (socket) => {
    console.log(` User connected: ${socket.user.name} (${socket.user.role})`);
    socket.on('join_consultation', async (consultationId) => {
      try {
        const consultation = await Consultation.findById(consultationId);
        if (!consultation) {
          socket.emit('error_message', { message: 'Consultation not found' });
          return;
        }
        const userId = socket.user._id.toString();
        const isParticipant =
          consultation.patientId.toString() === userId ||
          consultation.doctorId.toString() === userId;
        if (!isParticipant) {
          socket.emit('error_message', { message: 'Access denied' });
          return;
        }
        const room = `consultation_${consultationId}`;
        socket.join(room);
        console.log(` ${socket.user.name} joined room: ${room}`);
        socket.emit('joined_consultation', {
          consultationId,
          status: consultation.status,
        });
      } catch (error) {
        console.error('Join consultation error:', error);
        socket.emit('error_message', { message: 'Failed to join consultation' });
      }
    });
    socket.on('send_message', async (data) => {
      try {
        const { consultationId, content } = data;
        const consultation = await Consultation.findById(consultationId);
        if (!consultation || consultation.status !== 'accepted') {
          socket.emit('error_message', { message: 'Consultation is not active' });
          return;
        }
        const message = await Message.create({
          consultationId,
          senderId: socket.user._id,
          senderRole: socket.user.role,
          content,
        });
        const populated = await Message.findById(message._id)
          .populate('senderId', 'name role');
        const room = `consultation_${consultationId}`;
        io.to(room).emit('receive_message', populated);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });
    socket.on('leave_consultation', (consultationId) => {
      const room = `consultation_${consultationId}`;
      socket.leave(room);
      console.log(` ${socket.user.name} left room: ${room}`);
    });
    socket.on('disconnect', () => {
      console.log(` User disconnected: ${socket.user.name}`);
    });
  });
};
