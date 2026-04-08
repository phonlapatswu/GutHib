import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/projects', taskRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Shark Task API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
