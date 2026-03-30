import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { verifyToken } from './utils/jwt.js';
import User from './models/User.js';
import Chat from './models/Chat.js';
import Appointment from './models/Appointment.js';

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Too many requests, please try again later.' } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'MediConnect API running', timestamp: new Date() }));

const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password -otp');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.user._id.toString();
  onlineUsers.set(userId, socket.id);

  await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
  io.emit('user_status', { userId, isOnline: true });

  socket.on('join_room', async ({ appointmentId }) => {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return;
      const isParticipant = appointment.patientId.toString() === userId || appointment.doctorId.toString() === userId;
      if (!isParticipant && socket.user.role !== 'admin') return;
      socket.join(appointmentId);
      socket.emit('joined_room', { appointmentId });
    } catch (err) {}
  });

  socket.on('send_message', async ({ appointmentId, text, messageType = 'text' }) => {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || !appointment.chatEnabled) {
        return socket.emit('error', { message: 'Chat is not available for this appointment' });
      }
      const chat = await Chat.findOne({ appointmentId });
      if (!chat || !chat.isActive) {
        return socket.emit('error', { message: 'Chat has been closed' });
      }
      const isParticipant = appointment.patientId.toString() === userId || appointment.doctorId.toString() === userId;
      if (!isParticipant) return socket.emit('error', { message: 'Not authorized' });

      const message = {
        senderId: socket.user._id,
        text,
        messageType,
        timestamp: new Date(),
        readBy: [socket.user._id]
      };
      chat.messages.push(message);
      await chat.save();
      const savedMsg = chat.messages[chat.messages.length - 1];
      const populatedMsg = {
        ...savedMsg.toObject(),
        senderId: { _id: socket.user._id, name: socket.user.name, role: socket.user.role }
      };
      io.to(appointmentId).emit('new_message', { message: populatedMsg, appointmentId });

      const recipientId = appointment.patientId.toString() === userId ? appointment.doctorId.toString() : appointment.patientId.toString();
      const recipientSocketId = onlineUsers.get(recipientId);
      if (!recipientSocketId) {
        await User.findByIdAndUpdate(recipientId, {
          $push: { notifications: { message: `New message from ${socket.user.name}`, type: 'info' } }
        });
      }
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ appointmentId, isTyping }) => {
    socket.to(appointmentId).emit('typing', { userId, userName: socket.user.name, isTyping });
  });

  socket.on('mark_read', async ({ appointmentId }) => {
    try {
      await Chat.updateMany(
        { appointmentId, 'messages.readBy': { $ne: socket.user._id } },
        { $push: { 'messages.$[].readBy': socket.user._id } }
      );
    } catch (err) {}
  });

  socket.on('notification_read', async () => {
    await User.findByIdAndUpdate(userId, { $set: { 'notifications.$[].read': true } });
  });

  socket.on('disconnect', async () => {
    onlineUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
    io.emit('user_status', { userId, isOnline: false, lastSeen: new Date() });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`MediConnect server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
