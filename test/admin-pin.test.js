'use strict';

const test = require('node:test');
const assert = require('node:assert');

const bookingsHandler = require('../api/bookings');
const userHandler = require('../api/user');

function withAdminEnv(t) {
  const prev = {
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_PIN: process.env.ADMIN_PIN,
    MONGODB_URI: process.env.MONGODB_URI
  };

  process.env.NODE_ENV = 'test';
  process.env.ADMIN_PIN = '1234';
  delete process.env.MONGODB_URI;

  t.after(() => {
    process.env.NODE_ENV = prev.NODE_ENV;
    if (prev.ADMIN_PIN === undefined) delete process.env.ADMIN_PIN;
    else process.env.ADMIN_PIN = prev.ADMIN_PIN;
    if (prev.MONGODB_URI === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = prev.MONGODB_URI;
    delete global.__bookings;
    delete global.__users;
  });
}

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('admin bookings list accepts 1234 and rejects a bad PIN', async (t) => {
  withAdminEnv(t);
  global.__bookings = [{ ref: 'ABC123', status: 'new' }];

  const okRes = createRes();
  await bookingsHandler(
    { method: 'POST', headers: {}, body: { action: 'list', pin: '1234' } },
    okRes
  );
  assert.strictEqual(okRes.statusCode, 200);
  assert.strictEqual(okRes.body.ok, true);
  assert.strictEqual(okRes.body.bookings.length, 1);

  const badRes = createRes();
  await bookingsHandler(
    { method: 'POST', headers: {}, body: { action: 'list', pin: '0000' } },
    badRes
  );
  assert.strictEqual(badRes.statusCode, 401);
  assert.strictEqual(badRes.body.ok, false);
  assert.strictEqual(badRes.body.error, 'Invalid PIN');
});

test('admin user count accepts 1234 and rejects a bad PIN', async (t) => {
  withAdminEnv(t);
  global.__users = {
    'one@example.com': { name: 'One' },
    'two@example.com': { name: 'Two' }
  };

  const okRes = createRes();
  await userHandler(
    { method: 'GET', headers: {}, query: { action: 'count', pin: '1234' } },
    okRes
  );
  assert.strictEqual(okRes.statusCode, 200);
  assert.strictEqual(okRes.body.ok, true);
  assert.strictEqual(okRes.body.count, 2);

  const badRes = createRes();
  await userHandler(
    { method: 'GET', headers: {}, query: { action: 'count', pin: '0000' } },
    badRes
  );
  assert.strictEqual(badRes.statusCode, 401);
  assert.strictEqual(badRes.body.ok, false);
  assert.strictEqual(badRes.body.error, 'Invalid PIN');
});
