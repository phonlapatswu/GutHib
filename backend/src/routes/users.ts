import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getAllUsers,
  getMyTasks,
  getInboxLogs,
  getMyProfile,
  updateProfile,
  changePassword,
  adminGetUsers,
  adminUpdateRole,
  adminDeleteUser,
} from '../controllers/userController';

const router = Router();
router.use(authenticateToken);

// GET /api/users
router.get('/', getAllUsers);

// My profile
router.get('/me', getMyProfile);
router.put('/me', updateProfile);
router.post('/me/change-password', changePassword);

// My tasks + inbox
router.get('/me/tasks', getMyTasks);
router.get('/me/inbox', getInboxLogs);

// Admin routes
router.get('/admin/all', adminGetUsers);
router.put('/admin/:userId/role', adminUpdateRole);
router.delete('/admin/:userId', adminDeleteUser);

export default router;
