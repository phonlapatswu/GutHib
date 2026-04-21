import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db';
import bcrypt from 'bcrypt';

// Tell Jest to use our manual mock
jest.mock('../src/db');

const mockPrisma = prisma as any;

/**
 * Integration Tests for Authentication API
 * Uses Supertest to simulate HTTP requests and Mocks Prisma for data isolation.
 */
describe('🔐 Auth API', () => {

  // ─────────────────── POST /api/auth/register ───────────────────
  /**
   * Test Suite: User Registration
   * Covers: Successful creation, conflict handling (409), and validation errors (400).
   */
  describe('POST /api/auth/register', () => {

    it('should register a new user and return a JWT token', async () => {
      // Reset mock state explicitly
      mockPrisma.user.findFirst.mockResolvedValueOnce(null); // No existing user
      mockPrisma.user.create.mockResolvedValueOnce({
        user_id: 99,
        username: 'testuser_new',
        email: 'newreg@example.com',
        role: 'Worker',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser_new', email: 'newreg@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('testuser_new');
    });

    it('should return 409 if email is already in use', async () => {
      mockPrisma.user.findFirst.mockResolvedValueOnce({
        user_id: 1,
        email: 'taken@example.com',
        username: 'someoneelse',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser_conflict', email: 'taken@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/email/i);
    });

    it('should return 400 if username is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'validuser', email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if password is too short (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'validuser', email: 'valid@example.com', password: '123' });

      expect(res.status).toBe(400);
    });
  });

  // ─────────────────── POST /api/auth/login ───────────────────
  /**
   * Test Suite: User Login
   * Covers: Valid credentials, non-existent users (401), and invalid passwords (401).
   */
  describe('POST /api/auth/login', () => {

    it('should login with correct credentials and return a JWT token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'Worker',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('testuser');
    });

    it('should return 401 if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('should return 401 if password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correctpass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        user_id: 1,
        username: 'testuser',
        password_hash: hashedPassword,
        role: 'Worker',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if username is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });
  });

  // ─────────────────── GET /api/health ───────────────────
  describe('GET /health', () => {
    it('should return API health status OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
