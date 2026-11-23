const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const User = require('../models/User');
const authRouter = require('./auth');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('Auth routes (/api/auth)', () => {
  let originalFindOne;
  let originalSave;
  let originalGenSalt;
  let originalHash;
  let originalCompare;
  let originalJwtSign;
  let originalConsoleError;

  beforeEach(() => {
    originalFindOne = User.findOne;
    originalSave = User.prototype.save;
    originalGenSalt = bcrypt.genSalt;
    originalHash = bcrypt.hash;
    originalCompare = bcrypt.compare;
    originalJwtSign = jwt.sign;
    originalConsoleError = console.error;

    console.error = () => {};
  });

  afterEach(() => {
    User.findOne = originalFindOne;
    User.prototype.save = originalSave;
    bcrypt.genSalt = originalGenSalt;
    bcrypt.hash = originalHash;
    bcrypt.compare = originalCompare;
    jwt.sign = originalJwtSign;
    console.error = originalConsoleError;
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user with default role student and returns 201', async () => {
      let savedUserDoc = null;

      User.findOne = async () => null;
      bcrypt.genSalt = async () => 'mock-salt';
      bcrypt.hash = async () => 'hashed-password-123';
      User.prototype.save = async function mockSave() {
        savedUserDoc = {
          name: this.name,
          email: this.email,
          password: this.password,
          role: this.role,
        };
        return this;
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alex Morgan',
          email: 'alex@example.com',
          password: 'Password123',
          role: 'admin',
        });

      assert.equal(res.status, 201);
      assert.deepEqual(res.body, { message: 'User registered successfully!' });
      assert.deepEqual(savedUserDoc, {
        name: 'Alex Morgan',
        email: 'alex@example.com',
        password: 'hashed-password-123',
        role: 'student',
      });
    });

    it('returns 400 if a user with the email already exists', async () => {
      User.findOne = async () => ({ _id: 'existing-id', email: 'alex@example.com' });

      const app = createTestApp();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alex Morgan',
          email: 'alex@example.com',
          password: 'Password123',
        });

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, { error: 'User with this email already exists' });
    });

    it('returns 500 when database lookup or save throws an error', async () => {
      User.findOne = async () => {
        throw new Error('DB connection failure');
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alex Morgan',
          email: 'alex@example.com',
          password: 'Password123',
        });

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Server error during registration' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200, a token with role, and user info including role for valid credentials', async () => {
      let signedPayload = null;

      User.findOne = async () => ({
        _id: 'user-123',
        name: 'Alex Morgan',
        email: 'alex@example.com',
        password: 'hashed-password-123',
        role: 'admin',
      });
      bcrypt.compare = async () => true;
      jwt.sign = (payload) => {
        signedPayload = payload;
        return 'mock-jwt-token';
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@example.com',
          password: 'Password123',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'Login successful');
      assert.equal(res.body.token, 'mock-jwt-token');
      assert.deepEqual(signedPayload, {
        userId: 'user-123',
        name: 'Alex Morgan',
        role: 'admin',
      });
      assert.deepEqual(res.body.user, {
        id: 'user-123',
        name: 'Alex Morgan',
        email: 'alex@example.com',
        role: 'admin',
      });
    });

    it('returns 400 when user email is not found', async () => {
      User.findOne = async () => null;

      const app = createTestApp();
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'missing@example.com',
          password: 'Password123',
        });

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, { error: 'Invalid email or password' });
    });

    it('returns 400 when password does not match', async () => {
      User.findOne = async () => ({
        _id: 'user-123',
        name: 'Alex Morgan',
        email: 'alex@example.com',
        password: 'hashed-password-123',
        role: 'student',
      });
      bcrypt.compare = async () => false;

      const app = createTestApp();
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@example.com',
          password: 'WrongPassword',
        });

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, { error: 'Invalid email or password' });
    });

    it('returns 500 when an unexpected error occurs during login', async () => {
      User.findOne = async () => {
        throw new Error('Unexpected login failure');
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@example.com',
          password: 'Password123',
        });

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Server error during login' });
    });
  });
});