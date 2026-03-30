import express from 'express';
import { protect, restrictTo, requireVerified } from '../middleware/auth.js';
import {
  updatePatientProfile, getPatientProfile,
  sendConsultationRequest, getPatientAppointments,
  rateDoctor, markNotificationsRead
} from '../controllers/patientController.js';

const router = express.Router();

router.use(protect, requireVerified);

router.get('/profile', restrictTo('patient'), getPatientProfile);
router.put('/profile', restrictTo('patient'), updatePatientProfile);
router.post('/request', restrictTo('patient'), sendConsultationRequest);
router.get('/appointments', restrictTo('patient'), getPatientAppointments);
router.post('/rate', restrictTo('patient'), rateDoctor);
router.post('/notifications/read', markNotificationsRead);

export default router;
