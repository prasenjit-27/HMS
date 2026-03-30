import express from 'express';
import { protect, restrictTo, requireVerified } from '../middleware/auth.js';
import { uploadProfile } from '../middleware/upload.js';
import {
  createDoctorProfile, updateDoctorProfile, getDoctorProfile,
  getAllApprovedDoctors, getDoctorById, getDoctorRequests,
  respondToRequest, closeConsultation
} from '../controllers/doctorController.js';

const router = express.Router();

router.get('/', getAllApprovedDoctors);
router.get('/:id', getDoctorById);

router.use(protect, requireVerified);

router.get('/profile/me', restrictTo('doctor'), getDoctorProfile);
router.post('/profile', restrictTo('doctor'), uploadProfile.single('profilePhoto'), createDoctorProfile);
router.put('/profile', restrictTo('doctor'), uploadProfile.single('profilePhoto'), updateDoctorProfile);
router.get('/requests/all', restrictTo('doctor'), getDoctorRequests);
router.post('/requests/respond', restrictTo('doctor'), respondToRequest);
router.post('/consultation/close', restrictTo('doctor'), closeConsultation);

export default router;
