#!/usr/bin/env node
'use strict';

// Lightweight integration tests — no test framework needed.
process.env.SESSION_SECRET = 'test-secret';
process.env.PORT = '3001';
process.env.ADMIN_TOKEN = 'test-admin-token';

const http = require('http');

// Start the server in the background
const server = require('./server');

let passed = 0;
let failed = 0;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(name, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  await wait(300); // give server time to bind

  console.log('\nComics API');
  {
    const r = await request('GET', '/api/comics/search?q=d');
    assert('single-char query returns empty array', Array.isArray(r.body) && r.body.length === 0);

    const r2 = await request('GET', '/api/comics/search?q=dylan');
    assert('search dylan returns results', Array.isArray(r2.body) && r2.body.length > 0);

    const r3 = await request('GET', '/api/comics/1/value?condition=mint');
    assert('valuation endpoint returns estimatedValue', typeof r3.body.estimatedValue === 'number');
    assert('mint condition keeps base value', r3.body.estimatedValue === r3.body.baseValue);

    const r4 = await request('GET', '/api/comics/99999/value');
    assert('unknown comic returns 404', r4.status === 404);
  }

  console.log('\nAuth API');
  const email = `test_${Date.now()}@example.com`;
  {
    const r = await request('POST', '/api/register', { email, password: 'pass123', name: 'Tester' });
    assert('register succeeds', r.status === 200 && r.body.email === email);

    const r2 = await request('POST', '/api/register', { email, password: 'pass123', name: 'Tester' });
    assert('duplicate email rejected', r2.status === 400);

    const r3 = await request('POST', '/api/register', { email: 'bad-email', password: 'pass123', name: 'X' });
    assert('invalid email rejected on register', r3.status === 400);

    const r4 = await request('POST', '/api/login', { email: 'nobody@example.com', password: 'wrong' });
    assert('wrong credentials rejected', r4.status === 401);
  }

  console.log('\nAdmin API');
  {
    const r = await request('GET', '/api/admin/stats');
    assert('admin stats without token returns 401', r.status === 401);

    const r2 = await request('GET', '/api/admin/stats?token=test-admin-token');
    assert('admin stats with correct token returns data', r2.status === 200 && typeof r2.body.comicsInDB === 'number');
  }

  console.log('\nWaitlist API');
  {
    const r = await request('POST', '/api/waitlist', { email: 'notanemail' });
    assert('invalid waitlist email rejected', r.status === 400);

    const r2 = await request('POST', '/api/waitlist', { email: 'valid@example.com' });
    assert('valid waitlist email accepted', r2.status === 200 && r2.body.ok === true);
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
