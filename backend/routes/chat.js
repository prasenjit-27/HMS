const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
router.use(auth);
router.get('/:consultationId/messages', chatController.getMessages);
router.post('/:consultationId/upload', upload.single('file'), chatController.uploadFile);
module.exports = router;
