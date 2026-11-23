const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const Event = require('../models/Event');
const Registration = require('../models/Registration');
const eventsRouter = require('./events');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/events', eventsRouter);
  return app;
}

describe('Event routes (/api/events)', () => {
  let originalFind;
  let originalFindById;
  let originalFindByIdAndDelete;
  let originalSave;
  let originalDeleteMany;
  let originalVerify;
  let originalConsoleError;

  beforeEach(() => {
    originalFind = Event.find;
    originalFindById = Event.findById;
    originalFindByIdAndDelete = Event.findByIdAndDelete;
    originalSave = Event.prototype.save;
    originalDeleteMany = Registration.deleteMany;
    originalVerify = jwt.verify;
    originalConsoleError = console.error;
    console.error = () => {};
  });

  afterEach(() => {
    Event.find = originalFind;
    Event.findById = originalFindById;
    Event.findByIdAndDelete = originalFindByIdAndDelete;
    Event.prototype.save = originalSave;
    Registration.deleteMany = originalDeleteMany;
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

  describe('PUT /api/events/:id', () => {
    const updatePayload = {
      title: 'Hackathon Kickoff Updated',
      clubName: 'Computer Science Society',
      date: '2026-12-12T18:00:00.000Z',
      location: 'Auditorium B',
      capacity: 75,
      description: 'Updated venue and expanded seat capacity.',
    };

    it('returns 403 when authenticated user is not an admin', async () => {
      jwt.verify = () => ({ userId: 'user-123', name: 'Alex', role: 'student' });

      const app = createTestApp();
      const res = await request(app)
        .put('/api/events/evt-1')
        .set('Authorization', 'Bearer student-token')
        .send(updatePayload);

      assert.equal(res.status, 403);
      assert.deepEqual(res.body, { error: 'Forbidden: admin access required' });
    });

    it('returns 400 when required fields or capacity are invalid', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });

      const app = createTestApp();
      const res = await request(app)
        .put('/api/events/evt-1')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...updatePayload, capacity: 0 });

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, {
        error: 'All fields (including a valid capacity of at least 1) are required',
      });
    });

    it('returns 404 when the event to update does not exist', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.findById = async () => null;

      const app = createTestApp();
      const res = await request(app)
        .put('/api/events/missing-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { error: 'Event not found' });
    });

    it('returns 400 when updated capacity is lower than current registeredCount', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.findById = async () => ({
        _id: 'evt-1',
        title: 'Hackathon Kickoff',
        clubName: 'Computer Science Society',
        date: new Date('2026-12-10T18:00:00.000Z'),
        location: 'Main Hall',
        capacity: 10,
        registeredCount: 8,
        description: 'Original description',
      });

      const app = createTestApp();
      const res = await request(app)
        .put('/api/events/evt-1')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...updatePayload, capacity: 5 });

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, {
        error: 'Capacity cannot be less than current registrations (8)',
      });
    });

    it('updates the event and returns 200 for an admin user', async () => {
      let saved = false;
      const mockEvent = {
        _id: 'evt-1',
        title: 'Hackathon Kickoff',
        clubName: 'Computer Science Society',
        date: new Date('2026-12-10T18:00:00.000Z'),
        location: 'Main Hall',
        capacity: 50,
        registeredCount: 5,
        description: 'Original description',
        save: async function mockSave() {
          saved = true;
          return this;
        },
      };

      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.findById = async (id) => {
        assert.equal(id, 'evt-1');
        return mockEvent;
      };

      const app = createTestApp();
      const res = await request(app)
        .put('/api/events/evt-1')
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      assert.equal(res.status, 200);
      assert.equal(saved, true);
      assert.equal(res.body.message, 'Event updated successfully!');
      assert.equal(res.body.event.title, updatePayload.title);
      assert.equal(res.body.event.location, updatePayload.location);
      assert.equal(res.body.event.capacity, 75);
      assert.equal(res.body.event.description, updatePayload.description);
    });

    it('returns 500 when updating the event throws an error', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.findById = async () => {
        throw new Error('DB update error');
      };

      const app = createTestApp();
      const res = await request(app)
        .put('/api/events/evt-1')
        .set('Authorization', 'Bearer valid-token')
        .send(updatePayload);

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Server error while updating event' });
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('returns 403 when authenticated user is not an admin', async () => {
      jwt.verify = () => ({ userId: 'user-123', name: 'Alex', role: 'student' });

      const app = createTestApp();
      const res = await request(app)
        .delete('/api/events/evt-1')
        .set('Authorization', 'Bearer student-token');

      assert.equal(res.status, 403);
      assert.deepEqual(res.body, { error: 'Forbidden: admin access required' });
    });

    it('returns 404 when the event to delete does not exist', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.findByIdAndDelete = async () => null;

      const app = createTestApp();
      const res = await request(app)
        .delete('/api/events/missing-id')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { error: 'Event not found' });
    });

    it('deletes the event and related registrations and returns 200 for an admin user', async () => {
      let deletedId = null;
      let cleanedQuery = null;

      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.findByIdAndDelete = async (id) => {
        deletedId = id;
        return { _id: id, title: 'Hackathon Kickoff' };
      };
      Registration.deleteMany = async (query) => {
        cleanedQuery = query;
        return { deletedCount: 3 };
      };

      const app = createTestApp();
      const res = await request(app)
        .delete('/api/events/evt-1')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 200);
      assert.equal(deletedId, 'evt-1');
      assert.deepEqual(cleanedQuery, { event: 'evt-1' });
      assert.deepEqual(res.body, { message: 'Event deleted successfully!' });
    });

    it('returns 500 when deleting the event fails', async () => {
      jwt.verify = () => ({ userId: 'admin-123', name: 'Alex', role: 'admin' });
      Event.findByIdAndDelete = async () => {
        throw new Error('DB delete error');
      };

      const app = createTestApp();
      const res = await request(app)
        .delete('/api/events/evt-1')
        .set('Authorization', 'Bearer valid-token');

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Server error while deleting event' });
    });
  });
});