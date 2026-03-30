import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const profileDir = path.join(uploadsDir, 'profiles');
const chatDir = path.join(uploadsDir, 'chat');
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });
if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `chat-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const chatFilter = (req, file, cb) => {
  const blocked = /exe|sh|bat|cmd|msi/;
  if (blocked.test(path.extname(file.originalname).toLowerCase())) {
    cb(new Error('File type not allowed'), false);
  } else {
    cb(null, true);
  }
};

export const uploadProfile = multer({ storage: profileStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadChatFile = multer({ storage: chatStorage, fileFilter: chatFilter, limits: { fileSize: 20 * 1024 * 1024 } });
