import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersharktasksecret123';

/**
 * Middleware: Validates JWT token from Authorization header (Bearer token)
 * If valid, attaches user payload to req.user and proceeds.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid token.' });
      return;
    }
    (req as any).user = user;
    next();
  });
};

/**
 * Middleware factory: allows access only to roles in the allowedRoles list.
 * Admin always has access regardless.
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role;

    if (!userRole) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Admin always passes
    if (userRole === 'Admin' || allowedRoles.includes(userRole)) {
      next();
      return;
    }

    res.status(403).json({
      error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}.`,
    });
  };
};
