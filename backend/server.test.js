const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('./server');

describe('Campus Club server entry point', () => {
  it('GET / returns health status message', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.match(res.text, /Campus Club Event API is running/i);
  });

  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');
    assert.equal(res.status, 404);
  });
});