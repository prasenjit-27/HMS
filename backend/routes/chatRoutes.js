import express from 'express';
import { protect, requireVerified } from '../middleware/auth.js';
import { uploadChatFile } from '../middleware/upload.js';
import { getChatByAppointment, uploadChatFile as uploadChatFileController } from '../controllers/chatController.js';

const router = express.Router();

router.use(protect, requireVerified);

router.get('/:appointmentId', getChatByAppointment);
router.post('/upload', uploadChatFile.single('file'), uploadChatFileController);

export default router;
