import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getAllUsers, getMyTasks, getInboxLogs, getInboxCount,
  getMyProfile, updateProfile, changePassword,
  adminGetUsers, adminUpdateRole, adminDeleteUser,
} from '../controllers/userController';

const router = Router();
router.use(authenticateToken);

router.get('/', getAllUsers);
router.get('/me', getMyProfile);
router.put('/me', updateProfile);
router.post('/me/change-password', changePassword);
router.get('/me/tasks', getMyTasks);
router.get('/me/inbox', getInboxLogs);
router.get('/me/inbox/count', getInboxCount);
router.get('/admin/all', adminGetUsers);
router.put('/admin/:userId/role', adminUpdateRole);
router.delete('/admin/:userId', adminDeleteUser);

export default router;
