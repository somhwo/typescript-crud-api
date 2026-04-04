// tests/users.test.ts
//
// Integration tests for the Users API.
// Assumes the server is running on http://localhost:4000
// Run with: npm test

import http from 'node:http';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:4000';

const ADMIN_EMAIL    = `admin.test.${Date.now()}@example.com`;
const ADMIN_PASSWORD = 'Admin@1234';
const USER_EMAIL     = `user.test.${Date.now()}@example.com`;
const USER_PASSWORD  = 'User@1234';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TestResult {
  name:    string;
  passed:  boolean;
  message: string;
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const url     = new URL(path, BASE_URL);
    const payload = body ? JSON.stringify(body) : undefined;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload            ? { 'Content-Length': Buffer.byteLength(payload).toString() } : {}),
        ...(token              ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) as T });
        } catch {
          resolve({ status: res.statusCode ?? 0, data: raw as unknown as T });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Test runner ─────────────────────────────────────────────────────────────

const results: TestResult[] = [];

function test(name: string, fn: () => Promise<void>): Promise<void> {
  return fn()
    .then(() => {
      results.push({ name, passed: true, message: 'OK' });
      console.log(`  ✅  ${name}`);
    })
    .catch((err: Error) => {
      results.push({ name, passed: false, message: err.message });
      console.log(`  ❌  ${name}`);
      console.log(`       → ${err.message}`);
    });
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ─── Test state ───────────────────────────────────────────────────────────────

let adminToken = '';
let userToken  = '';
let createdAdminId = 0;
let createdUserId  = 0;

// ─── Test cases ───────────────────────────────────────────────────────────────

async function runTests(): Promise<void> {
  console.log('\n📋  Users API – Integration Tests');
  console.log(`    Target: ${BASE_URL}\n`);

  // ── Registration ─────────────────────────────────────────────────────────

  console.log('── Registration ──────────────────────────────────────────────');

  await test('POST /users – register admin user', async () => {
    const { status, data } = await request<{ message: string }>('POST', '/users', {
      title:           'Mr',
      firstName:       'Admin',
      lastName:        'User',
      email:           ADMIN_EMAIL,
      password:        ADMIN_PASSWORD,
      confirmPassword: ADMIN_PASSWORD,
      role:            'Admin',
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert((data as { message: string }).message === 'User created successfully', `Unexpected message: ${(data as { message: string }).message}`);
  });

  await test('POST /users – register regular user', async () => {
    const { status, data } = await request<{ message: string }>('POST', '/users', {
      title:           'Ms',
      firstName:       'Regular',
      lastName:        'User',
      email:           USER_EMAIL,
      password:        USER_PASSWORD,
      confirmPassword: USER_PASSWORD,
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
  });

  await test('POST /users – reject duplicate email', async () => {
    const { status } = await request('POST', '/users', {
      title:           'Mr',
      firstName:       'Dup',
      lastName:        'User',
      email:           ADMIN_EMAIL,
      password:        ADMIN_PASSWORD,
      confirmPassword: ADMIN_PASSWORD,
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /users – reject password mismatch', async () => {
    const { status } = await request('POST', '/users', {
      title:           'Dr',
      firstName:       'Bad',
      lastName:        'Pass',
      email:           'mismatch@example.com',
      password:        'Password1!',
      confirmPassword: 'Password2!',
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /users – reject missing required fields', async () => {
    const { status } = await request('POST', '/users', { email: 'incomplete@example.com' });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // ── Authentication ────────────────────────────────────────────────────────

  console.log('\n── Authentication ────────────────────────────────────────────');

  await test('POST /users/authenticate – admin login returns JWT', async () => {
    const { status, data } = await request<{
      id: number; token: string; role: string;
    }>('POST', '/users/authenticate', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(typeof data.token === 'string' && data.token.length > 0, 'No token returned');
    assert(data.role === 'Admin', `Expected role Admin, got ${data.role}`);
    adminToken     = data.token;
    createdAdminId = data.id;
  });

  await test('POST /users/authenticate – regular user login returns JWT', async () => {
    const { status, data } = await request<{ id: number; token: string; role: string }>(
      'POST', '/users/authenticate', { email: USER_EMAIL, password: USER_PASSWORD },
    );
    assert(status === 200, `Expected 200, got ${status}`);
    assert(typeof data.token === 'string' && data.token.length > 0, 'No token returned');
    userToken     = data.token;
    createdUserId = data.id;
  });

  await test('POST /users/authenticate – reject wrong password', async () => {
    const { status } = await request('POST', '/users/authenticate', {
      email:    ADMIN_EMAIL,
      password: 'wrong-password',
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /users/authenticate – reject unknown email', async () => {
    const { status } = await request('POST', '/users/authenticate', {
      email:    'nobody@example.com',
      password: 'whatever',
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // ── Authorization (protected routes) ─────────────────────────────────────

  console.log('\n── Authorization ─────────────────────────────────────────────');

  await test('GET /users – reject unauthenticated request', async () => {
    const { status } = await request('GET', '/users');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test('GET /users – reject non-admin token', async () => {
    const { status } = await request('GET', '/users', undefined, userToken);
    assert(status === 403, `Expected 403, got ${status}`);
  });

  await test('GET /users/:id – reject unauthenticated request', async () => {
    const { status } = await request('GET', `/users/${createdUserId}`);
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test('GET /users/:id – user cannot view another account', async () => {
    const { status } = await request('GET', `/users/${createdAdminId}`, undefined, userToken);
    assert(status === 403, `Expected 403, got ${status}`);
  });

  // ── CRUD (with auth) ──────────────────────────────────────────────────────

  console.log('\n── CRUD Operations ───────────────────────────────────────────');

  await test('GET /users – admin can list all users', async () => {
    const { status, data } = await request<unknown[]>('GET', '/users', undefined, adminToken);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(data), 'Expected an array');
    assert(data.length >= 2, `Expected at least 2 users, got ${data.length}`);
  });

  await test('GET /users/:id – user can view own account', async () => {
    const { status, data } = await request<{ id: number }>('GET', `/users/${createdUserId}`, undefined, userToken);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.id === createdUserId, `Expected id ${createdUserId}`);
  });

  await test('GET /users/:id – admin can view any account', async () => {
    const { status, data } = await request<{ id: number }>('GET', `/users/${createdUserId}`, undefined, adminToken);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.id === createdUserId, `Expected id ${createdUserId}`);
  });

  await test('GET /users/:id – 404 for non-existent user', async () => {
    const { status } = await request('GET', '/users/999999', undefined, adminToken);
    assert(status === 404, `Expected 404, got ${status}`);
  });

  await test('PUT /users/:id – user can update own account', async () => {
    const { status, data } = await request<{ message: string }>(
      'PUT', `/users/${createdUserId}`,
      { firstName: 'Updated' },
      userToken,
    );
    assert(status === 200, `Expected 200, got ${status}`);
    assert((data as { message: string }).message === 'User updated successfully', 'Unexpected message');
  });

  await test('PUT /users/:id – user cannot update another account', async () => {
    const { status } = await request('PUT', `/users/${createdAdminId}`, { firstName: 'Hacker' }, userToken);
    assert(status === 403, `Expected 403, got ${status}`);
  });

  await test('DELETE /users/:id – non-admin cannot delete', async () => {
    const { status } = await request('DELETE', `/users/${createdAdminId}`, undefined, userToken);
    assert(status === 403, `Expected 403, got ${status}`);
  });

  await test('DELETE /users/:id – admin can delete user', async () => {
    const { status, data } = await request<{ message: string }>(
      'DELETE', `/users/${createdUserId}`, undefined, adminToken,
    );
    assert(status === 200, `Expected 200, got ${status}`);
    assert((data as { message: string }).message === 'User deleted successfully', 'Unexpected message');
  });

  await test('DELETE /users/:id – admin can delete their own account', async () => {
    const { status } = await request('DELETE', `/users/${createdAdminId}`, undefined, adminToken);
    assert(status === 200, `Expected 200, got ${status}`);
  });

  // ─── Summary ─────────────────────────────────────────────────────────────

  const total  = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log(`📊  Results: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
  console.log('─────────────────────────────────────────────────────────────\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
