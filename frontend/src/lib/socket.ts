import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Socket.io Client Factory
 * Initializes a socket connection with JWT authentication provided in cookies.
 * Set to autoConnect: false to allow manual trigger in layouts.
 */
export const getSocket = () => {
  const token = Cookies.get('token');
  
  const socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    autoConnect: false // Explicitly connect when needed
  });

  return socket;
};
