import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import taskRoutes from './routes/tasks';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import messageRoutes from './routes/messages';

const app = express();

// --- Middleware Stack ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON payloads
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve static assets

// --- RESTful API Routes ---
app.use('/api/auth', authRoutes); // Authentication (Login/Register)
app.use('/api/users', userRoutes); // User Profiles & Settings
app.use('/api/projects', taskRoutes); // Project & Task Business Logic
app.use('/api/messages', messageRoutes); // Real-time Communication

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Shark Task API is running' });
});

export default app;
