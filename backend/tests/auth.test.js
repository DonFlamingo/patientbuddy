import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

describe('Authentication & Authorization', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    username: 'testuser'
  };

  const testAdmin = {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    username: 'admin',
    role: 'admin'
  };

  describe('Signup Flow', () => {
    it('should create a new user with role="user"', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('user');

      // Verify user in DB
      const user = await User.findOne({ email: testUser.email });
      expect(user.role).toBe('user');
    });

    it('should prevent duplicate email signup', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      // Attempt duplicate
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already exists.');
    });
  });

  describe('Login Flow', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/signup')
        .send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials.');
    });
  });

  describe('Admin Access', () => {
    let adminToken;
    let userToken;

    beforeEach(async () => {
      // Create an admin user directly (since signup won't create admins)
      const admin = new User(testAdmin);
      await admin.save();
      adminToken = jwt.sign(
        { userId: admin._id, role: admin.role },
        process.env.JWT_SECRET
      );

      // Create a regular user
      const user = await request(app)
        .post('/api/auth/signup')
        .send(testUser);
      userToken = user.body.token;
    });

    it('should allow admin to access /api/admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // admin + regular user
    });

    it('should prevent non-admin from accessing admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied. Admin role required.');
    });

    it('should reject invalid/expired tokens', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });

    it('should allow admin to update user roles', async () => {
      // Find the regular user's ID
      const users = await User.find({ role: 'user' });
      const userId = users[0]._id.toString();

      const res = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('admin');

      // Verify in DB
      const updatedUser = await User.findById(userId);
      expect(updatedUser.role).toBe('admin');
    });
  });
});