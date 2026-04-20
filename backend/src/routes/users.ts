import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllUsers, getMyTasks, getInboxLogs, getInboxCount,
  getMyProfile, updateProfile, changePassword, updateAvatar,
  adminGetUsers, adminUpdateRole, adminDeleteUser,
} from '../controllers/userController';

// Configure multer storage
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user.user_id;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const router = Router();
router.use(authenticateToken);

router.get('/', getAllUsers);
router.get('/me', getMyProfile);
router.put('/me', updateProfile);
router.post('/me/avatar', upload.single('avatar'), updateAvatar);
router.post('/me/change-password', changePassword);
router.get('/me/tasks', getMyTasks);
router.get('/me/inbox', getInboxLogs);
router.get('/me/inbox/count', getInboxCount);
router.get('/admin/all', adminGetUsers);
router.put('/admin/:userId/role', adminUpdateRole);
router.delete('/admin/:userId', adminDeleteUser);

export default router;
