import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import prisma from './db';

let io: SocketIOServer | null = null;

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

/**
 * Initializes the Socket.io server with CORS and Authentication middleware.
 * Binds the socket server to the existing HTTP server instance.
 */
export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"]
    }
  });

  /**
   * Socket Authentication Middleware
   * Validates JWT token passed via auth object or headers.
   */
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (!token) return next(new Error('Authentication error'));

    try {
      const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = jwt.verify(actualToken, JWT_SECRET) as any;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  /**
   * Main Connection Handler
   * Manages private rooms and project-specific broadcasting rooms.
   */
  io.on('connection', async (socket) => {
    const userId = (socket as any).user.user_id;
    console.log(`User connected: ${userId}`);

    // Join private room
    socket.join(`user_${userId}`);

    // Automatically join all project rooms the user is a member of
    try {
      const memberships = await prisma.projectMember.findMany({
        where: { user_id: userId },
        select: { project_id: true }
      });
      memberships.forEach(m => {
        socket.join(`project_${m.project_id}`);
      });
    } catch (e) { console.error('Socket join project error', e); }

    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`User ${userId} joined project ${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};
