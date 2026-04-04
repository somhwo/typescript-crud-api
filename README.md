# TypeScript CRUD API

A fully-typed REST API built with **TypeScript**, **Express 5**, **Sequelize**, **MySQL**, and **JWT authentication**. Every file uses strict TypeScript with well-defined interfaces, types, and enums — zero `any` in application code.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Server](#running-the-server)
6. [Building for Production](#building-for-production)
7. [API Endpoints](#api-endpoints)
8. [Testing](#testing)
9. [Architecture Notes](#architecture-notes)

---

## Project Structure

```
typescript-crud-api/
├── src/
│   ├── server.ts                  # Entry point – Express setup & bootstrap
│   ├── types/
│   │   └── index.ts               # Shared interfaces, types, and augmentations
│   ├── _helpers/
│   │   ├── db.ts                  # Sequelize initialisation & typed db object
│   │   ├── jwt.ts                 # generateToken / verifyToken helpers
│   │   └── role.ts                # Role enum (Admin | User)
│   ├── _middleware/
│   │   ├── authorize.ts           # JWT auth + optional role enforcement
│   │   ├── errorHandler.ts        # Central Express error handler
│   │   └── validateRequest.ts     # Joi request body validator
│   └── users/
│       ├── user.model.ts          # Sequelize model with typed attributes
│       ├── user.service.ts        # Business logic (authenticate, CRUD)
│       └── users.controller.ts    # Express router, handlers, Joi schemas
├── tests/
│   └── users.test.ts              # Integration test suite (zero dependencies)
├── config.json                    # DB credentials + JWT secret (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 LTS or later |
| npm | 9+ |
| MySQL | 8.0+ |

---

## Installation

```bash
# 1. Clone / unzip the project
cd typescript-crud-api

# 2. Install dependencies
npm install
```

---

## Configuration

Edit **`config.json`** in the project root:

```jsonc
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your_mysql_password",   // ← change this
    "database": "typescript_crud_api"
  },
  "jwtSecret": "change-this-to-a-long-random-secret"  // ← change this
}
```

> **Important:** Never commit real credentials. Add `config.json` to `.gitignore`.

The server automatically creates the database on first start — you only need to supply a user with `CREATE DATABASE` privileges.

---

## Running the Server

### Development (auto-restart on file changes)

```bash
npm run start:dev
```

### Production

```bash
npm run build   # Compile TypeScript → dist/
npm start       # Run compiled output
```

The server starts on `http://localhost:4000` by default. Override the port with the `PORT` environment variable:

```bash
PORT=8080 npm run start:dev
```

---

## API Endpoints

Base URL: `http://localhost:4000`

### Authentication

| Method | Path | Auth required | Description |
|--------|------|--------------|-------------|
| `POST` | `/users/authenticate` | ❌ | Login – returns a JWT |
| `POST` | `/users` | ❌ | Register a new account |

### Users

| Method | Path | Auth required | Role | Description |
|--------|------|--------------|------|-------------|
| `GET` | `/users` | ✅ Bearer | Admin | List all users |
| `GET` | `/users/:id` | ✅ Bearer | Self or Admin | Get user by id |
| `PUT` | `/users/:id` | ✅ Bearer | Self or Admin | Update user |
| `DELETE` | `/users/:id` | ✅ Bearer | Admin | Delete user |

---

### Request & Response Examples

#### `POST /users/authenticate`

**Request body**
```json
{
  "email": "john@example.com",
  "password": "mypassword"
}
```

**Response `200`**
```json
{
  "id": 1,
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "User",
  "token": "<JWT>"
}
```

---

#### `POST /users` – Register

**Request body**
```json
{
  "title": "Mr",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "mypassword",
  "confirmPassword": "mypassword",
  "role": "User"
}
```

**Response `201`**
```json
{ "message": "User created successfully" }
```

**Validation rules**
- All fields required except `role` (defaults to `"User"`)
- `email` must be a valid email address
- `password` minimum 6 characters
- `confirmPassword` must match `password`

---

#### `GET /users` — Admin only

**Headers**
```
Authorization: Bearer <token>
```

**Response `200`**
```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "title": "Dr",
    "firstName": "Admin",
    "lastName": "User",
    "role": "Admin",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

> `passwordHash` is **never** returned in any list or get response.

---

#### `PUT /users/:id` — Update

**Request body** (all fields optional)
```json
{
  "firstName": "Jonathan",
  "password": "newpassword",
  "confirmPassword": "newpassword"
}
```

**Response `200`**
```json
{ "message": "User updated successfully" }
```

---

#### `DELETE /users/:id` — Admin only

**Response `200`**
```json
{ "message": "User deleted successfully" }
```

---

### Error Responses

| Status | When |
|--------|------|
| `400` | Validation failure or application error (e.g. duplicate email) |
| `401` | Missing or invalid JWT |
| `403` | JWT valid but insufficient role / trying to access another user's account |
| `404` | Resource not found |
| `500` | Unexpected server error |

**Error shape**
```json
{ "message": "Human-readable description" }
```

---

## Testing

The test suite is a self-contained integration runner that uses Node's built-in `http` module — **no extra dependencies required**.

```bash
# 1. Start the server (in a separate terminal)
npm run start:dev

# 2. Run tests (in another terminal)
npm test
```

The tests cover the complete user lifecycle: registration → authentication → CRUD operations → access control → deletion. They clean up after themselves automatically.

To run against a different host:

```bash
TEST_BASE_URL=http://staging.example.com:4000 npm test
```

**Sample output**
```
📋  Users API – Integration Tests
    Target: http://localhost:4000

── Registration ──────────────────────────────────────────────
  ✅  POST /users – register admin user
  ✅  POST /users – register regular user
  ✅  POST /users – reject duplicate email
  ✅  POST /users – reject password mismatch
  ✅  POST /users – reject missing required fields

── Authentication ────────────────────────────────────────────
  ✅  POST /users/authenticate – admin login returns JWT
  ✅  POST /users/authenticate – regular user login returns JWT
  ✅  POST /users/authenticate – reject wrong password
  ✅  POST /users/authenticate – reject unknown email

── Authorization ─────────────────────────────────────────────
  ✅  GET /users – reject unauthenticated request
  ✅  GET /users – reject non-admin token
  ✅  GET /users/:id – reject unauthenticated request
  ✅  GET /users/:id – user cannot view another account

── CRUD Operations ───────────────────────────────────────────
  ✅  GET /users – admin can list all users
  ✅  GET /users/:id – user can view own account
  ✅  GET /users/:id – admin can view any account
  ✅  GET /users/:id – 404 for non-existent user
  ✅  PUT /users/:id – user can update own account
  ✅  PUT /users/:id – user cannot update another account
  ✅  DELETE /users/:id – non-admin cannot delete
  ✅  DELETE /users/:id – admin can delete user
  ✅  DELETE /users/:id – admin can delete their own account

─────────────────────────────────────────────────────────────
📊  Results: 23/23 passed
─────────────────────────────────────────────────────────────
```

---

## Architecture Notes

### Why `typeof User` instead of `any` for `db.User`

The `db` object's `User` property is typed as `typeof User` — the static class itself, not an instance. This gives TypeScript full knowledge of all Sequelize static methods (`findAll`, `findOne`, `create`, `scope`, etc.) with proper return types.

### Password security

Passwords are hashed with `bcryptjs` (cost factor 10) before storage. The `passwordHash` column is excluded from all responses via Sequelize's `defaultScope`. It is included only internally via `.scope('withHash')` when needed (authentication, password update).

### JWT claims

Tokens carry two custom claims in addition to standard JWT fields:

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | `number` | User id |
| `role` | `"Admin" \| "User"` | User role |

Tokens expire after **7 days**.

### Role-based access control

The `authorize()` middleware accepts zero or more `Role` values:

```typescript
authorize()           // any valid token
authorize(Role.Admin) // Admin tokens only
```

Within handlers, `req` is cast to `AuthenticatedRequest` to access `req.user` (the decoded `JwtPayload`) without losing type safety.
