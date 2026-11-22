const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const Registration = require('../models/Registration');
const Event = require('../models/Event');
const registrationsRouter = require('./registrations');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/registrations', registrationsRouter);
  return app;
}

describe('Registration routes (/api/registrations)', () => {
  let originalFind;
  let originalFindOne;
  let originalFindOneAndDelete;
  let originalSave;
  let originalFindById;
  let originalVerify;
  let originalConsoleError;

  beforeEach(() => {
    originalFind = Registration.find;
    originalFindOne = Registration.findOne;
    originalFindOneAndDelete = Registration.findOneAndDelete;
    originalSave = Registration.prototype.save;
    originalFindById = Event.findById;
    originalVerify = jwt.verify;
    originalConsoleError = console.error;
    console.error = () => {};
  });

  afterEach(() => {
    Registration.find = originalFind;
    Registration.findOne = originalFindOne;
    Registration.findOneAndDelete = originalFindOneAndDelete;
    Registration.prototype.save = originalSave;
    Event.findById = originalFindById;
    jwt.verify = originalVerify;
    console.error = originalConsoleError;
  });

  describe('Token verification', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const app = createTestApp();
      const res = await request(app).get('/api/registrations/my-registrations');

      assert.equal(res.status, 401);
      assert.deepEqual(res.body, { error: 'No token provided' });
    });

    it('returns 401 when token is invalid or expired', async () => {
      jwt.verify = () => {
        throw new Error('jwt expired');
      };

      const app = createTestApp();
      const res = await request(app)
        .get('/api/registrations/my-registrations')
        .set('Authorization', 'Bearer expired-token');

      assert.equal(res.status, 401);
      assert.deepEqual(res.body, { error: 'Invalid or expired token' });
    });
  });

  describe('GET /api/registrations/my-registrations', () => {
    it('returns populated registrations for the authenticated user', async () => {
      const mockRegs = [
        {
          _id: 'reg-1',
          user: 'user-123',
          event: { _id: 'event-1', title: 'AI Meetup' },
        },
      ];

      jwt.verify = () => ({ userId: 'user-123' });
      Registration.find = (query) => {
        assert.deepEqual(query, { user: 'user-123' });
        return {
          populate: async (field) => {
            assert.equal(field, 'event');
            return mockRegs;
          },
        };
      };

      const app = createTestApp();
      const res = await request(app)
        .get('/api/registrations/my-registrations')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 200);
      assert.deepEqual(res.body, mockRegs);
    });

    it('returns 500 when fetching registrations throws an error', async () => {
      jwt.verify = () => ({ id: 'user-123' });
      Registration.find = () => ({
        populate: async () => {
          throw new Error('Failed to fetch registrations');
        },
      });

      const app = createTestApp();
      const res = await request(app)
        .get('/api/registrations/my-registrations')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Failed to fetch registrations' });
    });
  });

  describe('POST /api/registrations/:eventId', () => {
    it('returns 404 when the target event does not exist', async () => {
      jwt.verify = () => ({ userId: 'user-123' });
      Event.findById = async (eventId) => {
        assert.equal(eventId, 'event-999');
        return null;
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/registrations/event-999')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { error: 'Event not found' });
    });

    it('returns 400 when the user is already registered for the event', async () => {
      jwt.verify = () => ({ userId: 'user-123' });
      Event.findById = async () => ({ _id: 'event-1', title: 'AI Meetup' });
      Registration.findOne = async (query) => {
        assert.deepEqual(query, { user: 'user-123', event: 'event-1' });
        return { _id: 'existing-reg' };
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/registrations/event-1')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, {
        error: 'You are already registered for this event!',
      });
    });

  it('creates a registration and returns 201 when valid', async () => {
      let savedDoc = null;
      jwt.verify = () => ({ userId: 'user-123' });
      Event.findById = async () => ({ _id: 'event-1', title: 'AI Meetup' });
      Registration.findOne = async () => null;
      Registration.prototype.save = async function mockSave() {
        savedDoc = { ...this._doc };
        return this;
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/registrations/event-1')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 201);
      assert.deepEqual(res.body, { message: 'Successfully registered!' });
      assert.ok(savedDoc !== null);
    });

    it('returns 500 when saving registration fails', async () => {
      jwt.verify = () => ({ userId: 'user-123' });
      Event.findById = async () => ({ _id: 'event-1', title: 'AI Meetup' });
      Registration.findOne = async () => null;
      Registration.prototype.save = async () => {
        throw new Error('Save failed');
      };

      const app = createTestApp();
      const res = await request(app)
        .post('/api/registrations/event-1')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Save failed' });
    });
  });

  describe('DELETE /api/registrations/:eventId', () => {
    it('returns 404 when no matching registration is found to cancel', async () => {
      jwt.verify = () => ({ userId: 'user-123' });
      Registration.findOneAndDelete = async (query) => {
        assert.deepEqual(query, { user: 'user-123', event: 'event-1' });
        return null;
      };

      const app = createTestApp();
      const res = await request(app)
        .delete('/api/registrations/event-1')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { error: 'Registration not found' });
    });

    it('cancels registration and returns 200 when found', async () => {
      jwt.verify = () => ({ userId: 'user-123' });
      Registration.findOneAndDelete = async () => ({ _id: 'reg-1' });

      const app = createTestApp();
      const res = await request(app)
        .delete('/api/registrations/event-1')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 200);
      assert.deepEqual(res.body, {
        message: 'Successfully canceled registration',
      });
    });

    it('returns 500 when deleting registration fails', async () => {
      jwt.verify = () => ({ userId: 'user-123' });
      Registration.findOneAndDelete = async () => {
        throw new Error('Delete failed');
      };

      const app = createTestApp();
      const res = await request(app)
        .delete('/api/registrations/event-1')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Delete failed' });
    });
  });
});