import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getMessages, createMessage, getConversations, getUnreadCount, markMessagesAsRead } from '../controllers/messageController';

const router = Router();

router.use(authenticateToken);

// GET /api/messages
router.get('/', getMessages);
router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);

// POST /api/messages
router.post('/', createMessage);
router.post('/read', markMessagesAsRead);

export default router;
