import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public routes (No token required)
router.post('/register', register); // User registration
router.post('/login', login);       // User login & JWT issuance

// Protected routes (Valid JWT required)
router.get('/me', authenticateToken, getMe); // Fetch current session user

export default router;
