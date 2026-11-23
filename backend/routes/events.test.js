const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const Event = require('../models/Event');
const eventsRouter = require('./events');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/events', eventsRouter);
  return app;
}

describe('Event routes (/api/events)', () => {
  let originalFind;
  let originalSave;
  let originalVerify;
  let originalConsoleError;

  beforeEach(() => {
    originalFind = Event.find;
    originalSave = Event.prototype.save;
    originalVerify = jwt.verify;
    originalConsoleError = console.error;
    console.error = () => {};
  });

  afterEach(() => {
    Event.find = originalFind;
    Event.prototype.save = originalSave;
    jwt.verify = originalVerify;
    console.error = originalConsoleError;
  });

  describe('GET /api/events', () => {
    it('returns sorted events with status 200', async () => {
      const sampleEvents = [
        { _id: '1', title: 'Coding Workshop', clubName: 'Tech Club', capacity: 30, registeredCount: 5 },
        { _id: '2', title: 'Debate Night', clubName: 'Debate Society', capacity: 50, registeredCount: 12 },
      ];

      Event.find = () => ({
        sort: async (sortArg) => {
          assert.deepEqual(sortArg, { date: 1 });
          return sampleEvents;
        },
      });

      const app = createTestApp();
      const res = await request(app).get('/api/events');

      assert.equal(res.status, 200);
      assert.deepEqual(res.body, sampleEvents);
    });

    it('returns 500 when fetching events fails', async () => {
      Event.find = () => ({
        sort: async () => {
          throw new Error('Database read error');
        },
      });

      const app = createTestApp();
      const res = await request(app).get('/api/events');

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Server error fetching events' });
    });
  });

  describe('POST /api/events', () => {
    const validPayload = {
      title: 'Hackathon Kickoff',
      clubName: 'Computer Science Society',
      date: '2026-12-10T18:00:00.000Z',
      location: 'Main Hall',
      capacity: 50,
      description: 'Annual campus hackathon briefing and team formation.',
    };

    it('returns 401 when Authorization header is missing', async () => {
      const app = createTestApp();
      const res = await request(app).post('/api/events').send(validPayload);

      assert.equal(res.status, 401);
      assert.deepEqual(res.body, { error: 'No token provided' });
    });

    it('returns 400 when token is invalid', async () => {
      jwt.verify = () => {
        throw new Error('Invalid signature');
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer bad-token')
        .send(validPayload);

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, { error: 'Invalid token' });
    });

    it('returns 403 when authenticated user is not an admin', async () => {
      jwt.verify = () => ({ userId: 'user-123', name: 'Alex', role: 'student' });

      const app = createTestApp();
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer student-token')
        .send(validPayload);

      assert.equal(res.status, 403);
      assert.deepEqual(res.body, { error: 'Forbidden: admin access required' });
    });

    it('returns 400 when required fields are missing for an admin user', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });

      const app = createTestApp();
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Incomplete Event' });

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, {
        error: 'All fields (including a valid capacity of at least 1) are required',
      });
    });

    it('returns 400 when capacity is less than 1 or invalid for an admin user', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });

      const app = createTestApp();
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...validPayload, capacity: 0 });

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, {
        error: 'All fields (including a valid capacity of at least 1) are required',
      });
    });

    it('creates an event with capacity and registeredCount 0 and returns 201 for an admin user', async () => {
      let savedDoc = null;
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.prototype.save = async function mockSave() {
        savedDoc = {
          title: this.title,
          clubName: this.clubName,
          date: this.date,
          location: this.location,
          capacity: this.capacity,
          registeredCount: this.registeredCount,
          description: this.description,
        };
        return this;
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      assert.equal(res.status, 201);
      assert.equal(res.body.message, 'Event created successfully!');
      assert.deepEqual(savedDoc, {
        title: validPayload.title,
        clubName: validPayload.clubName,
        date: new Date(validPayload.date),
        location: validPayload.location,
        capacity: 50,
        registeredCount: 0,
        description: validPayload.description,
      });
    });

    it('returns 500 when saving the event fails for an admin user', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.prototype.save = async () => {
        throw new Error('DB write error');
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Server error while creating event' });
    });
  });
});