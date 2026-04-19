import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db';
import jwt from 'jsonwebtoken';

jest.mock('../src/db');

const mockPrisma = prisma as any;

const JWT_SECRET = process.env.JWT_SECRET || 'supersharktasksecret123';

function makeToken(userId: number, role = 'Worker') {
  return jwt.sign({ user_id: userId, username: 'testuser', role }, JWT_SECRET, { expiresIn: '1h' });
}

describe('✅ Tasks API — Status Updates', () => {

  describe('PATCH /api/projects/:projectId/tasks/:taskId/status', () => {

    it('should update task status from Open to In_Progress', async () => {
      const existingTask = {
        task_id: 5,
        project_id: 1,
        title: 'Write tests',
        status: 'Open',
        started_at: null,
        completed_at: null,
      };
      mockPrisma.task.findFirst.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue({ ...existingTask, status: 'In_Progress', started_at: new Date() });

      const res = await request(app)
        .patch('/api/projects/1/tasks/5/status')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ status: 'In_Progress' });

      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('In_Progress');
    });

    it('should update task status to Closed and set completed_at', async () => {
      const existingTask = {
        task_id: 5,
        project_id: 1,
        status: 'In_Progress',
        started_at: new Date(),
        completed_at: null,
      };
      mockPrisma.task.findFirst.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue({ ...existingTask, status: 'Closed', completed_at: new Date() });

      const res = await request(app)
        .patch('/api/projects/1/tasks/5/status')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ status: 'Closed' });

      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('Closed');
    });

    it('should return 404 if task does not belong to the project', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/projects/99/tasks/5/status')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ status: 'Closed' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid status value', async () => {
      const res = await request(app)
        .patch('/api/projects/1/tasks/5/status')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ status: 'DONE_AND_DUSTED' }); // Invalid enum

      expect(res.status).toBe(400);
    });

    it('should return 400 for non-numeric task ID', async () => {
      const res = await request(app)
        .patch('/api/projects/1/tasks/notanumber/status')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ status: 'Closed' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app)
        .patch('/api/projects/1/tasks/5/status')
        .send({ status: 'Closed' });

      expect(res.status).toBe(401);
    });
  });
});

describe('💬 Messages API', () => {

  describe('GET /api/messages', () => {
    it('should return list of messages when authenticated', async () => {
      mockPrisma.message.findMany.mockResolvedValue([
        { message_id: 1, text: 'Hello team!', sender_id: 1, created_at: new Date(), sender: { username: 'testuser' } },
      ]);

      const res = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${makeToken(1)}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].text).toBe('Hello team!');
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/messages');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/messages', () => {
    it('should create a new message when authenticated', async () => {
      mockPrisma.message.create.mockResolvedValue({
        message_id: 2,
        text: 'New message!',
        sender_id: 1,
        created_at: new Date(),
        sender: { username: 'testuser' },
      });

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ text: 'New message!' });

      expect(res.status).toBe(201);
      expect(res.body.text).toBe('New message!');
    });

    it('should return 400 if text is empty', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ text: '   ' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if text is missing', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
