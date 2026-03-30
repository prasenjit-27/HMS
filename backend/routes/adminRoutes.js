import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { getAllDoctors, approveDoctor, getAllUsers, getStats, deleteUser } from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/doctors', getAllDoctors);
router.post('/doctors/action', approveDoctor);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

export default router;
