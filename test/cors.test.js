'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { pickAllowOrigin, getCorsHeaders } = require('../lib/cors');

test('pickAllowOrigin reflects request in development', () => {
  const prev = process.env.NODE_ENV;
  delete process.env.ALLOWED_ORIGINS;
  process.env.NODE_ENV = 'development';
  assert.strictEqual(pickAllowOrigin('http://localhost:5173'), 'http://localhost:5173');
  process.env.NODE_ENV = prev;
});

test('getCorsHeaders includes ACAO when origin allowed in dev', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  delete process.env.ALLOWED_ORIGINS;
  const h = getCorsHeaders({ headers: { origin: 'http://localhost:3000' } });
  assert.ok(h['Access-Control-Allow-Origin']);
  process.env.NODE_ENV = prev;
});
