import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db';
import jwt from 'jsonwebtoken';

jest.mock('../src/db');

const mockPrisma = prisma as any;

const JWT_SECRET = process.env.JWT_SECRET || 'supersharktasksecret123';

// Helper: create a valid bearer token for a mock user
function makeToken(userId: number, role = 'Worker') {
  return jwt.sign({ user_id: userId, username: 'testuser', role }, JWT_SECRET, { expiresIn: '1h' });
}

describe('📂 Projects API', () => {

  // ─────────────────── GET /api/projects ───────────────────
  describe('GET /api/projects', () => {
    it('should return a list of projects when authenticated', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { project_id: 1, title: 'Shark Task MVP', owner: { username: 'admin' }, created_at: new Date() },
      ]);

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${makeToken(1)}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────── POST /api/projects ───────────────────
  describe('POST /api/projects', () => {
    it('should create a new project when authenticated', async () => {
      mockPrisma.project.create.mockResolvedValue({
        project_id: 2,
        title: 'New Project',
        owner_id: 1,
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ title: 'New Project' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Project');
      expect(res.body).toHaveProperty('project_id');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ title: 'Secret Project' });

      expect(res.status).toBe(401);
    });
  });

  // ─────────────────── POST /api/projects/:id/tasks ───────────────────
  describe('POST /api/projects/:id/tasks', () => {
    it('should create a new task in a project', async () => {
      mockPrisma.task.create.mockResolvedValue({
        task_id: 10,
        project_id: 1,
        title: 'Design the shark logo',
        status: 'Open',
        assignee: null,
        project: { title: 'Shark Task MVP' },
      });

      const res = await request(app)
        .post('/api/projects/1/tasks')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ title: 'Design the shark logo' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Design the shark logo');
      expect(res.body).toHaveProperty('task_id');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/projects/1/tasks')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid project ID', async () => {
      const res = await request(app)
        .post('/api/projects/abc/tasks')
        .set('Authorization', `Bearer ${makeToken(1)}`)
        .send({ title: 'Test' });

      expect(res.status).toBe(400);
    });
  });
});
