import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getMessages, createMessage } from '../controllers/messageController';

const router = Router();

router.use(authenticateToken);

// GET /api/messages
router.get('/', getMessages);

// POST /api/messages
router.post('/', createMessage);

export default router;
