# Full-Stack TypeScript App

A full-stack web application with a **TypeScript/Express/Sequelize/MySQL** backend and a **vanilla JS SPA** frontend. The frontend communicates with the backend exclusively via `fetch()` API calls using JWT authentication — no `localStorage` data storage.

---

## Project Structure

```
typescript-crud-api/
├── src/
│   ├── server.ts                        # Entry point – serves API + frontend
│   ├── types/index.ts                   # All shared TypeScript interfaces
│   ├── _helpers/
│   │   ├── db.ts                        # Sequelize init, model registration
│   │   ├── jwt.ts                       # generateToken / verifyToken
│   │   └── role.ts                      # Role enum
│   ├── _middleware/
│   │   ├── authorize.ts                 # JWT auth + role enforcement
│   │   ├── errorHandler.ts              # Central error handler
│   │   └── validateRequest.ts           # Joi body validator
│   ├── users/
│   │   ├── user.model.ts
│   │   ├── user.service.ts
│   │   └── users.controller.ts
│   ├── departments/
│   │   ├── department.model.ts
│   │   ├── department.service.ts
│   │   └── departments.controller.ts
│   ├── employees/
│   │   ├── employee.model.ts
│   │   ├── employee.service.ts
│   │   └── employees.controller.ts
│   └── requests/
│       ├── request.model.ts
│       ├── request.service.ts
│       └── requests.controller.ts
├── frontend/
│   ├── index.html                       # SPA shell (unchanged)
│   ├── style.css                        # Styles (unchanged)
│   └── script.js                        # All localStorage → fetch() rewritten
├── config.json                          # DB credentials + JWT secret (gitignored)
├── package.json
└── tsconfig.json
```

---

## Prerequisites

- Node.js 18+
- MySQL 8.0+

---

## Installation

```bash
npm install
```

---

## Configuration

Edit `config.json`:

```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your_mysql_password",
    "database": "typescript_crud_api"
  },
  "jwtSecret": "change-this-to-a-long-random-secret"
}
```

The database is created automatically on first run.

---

## Running

```bash
# Development (auto-restart)
npm run start:dev

# Production
npm run build
npm start
```

Open **http://localhost:4000** — the backend serves the frontend directly.

---

## API Endpoints

### Users (public)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users` | Register |
| `POST` | `/users/authenticate` | Login – returns JWT |
| `POST` | `/users/verify-email` | Simulate email verification |

### Users (authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users` | Admin | List all accounts |
| `GET` | `/users/:id` | Self/Admin | Get account |
| `PUT` | `/users/:id` | Self/Admin | Update account |
| `DELETE` | `/users/:id` | Admin | Delete account |

### Departments (Admin only)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/departments` | List all |
| `POST` | `/departments` | Create |
| `PUT` | `/departments/:id` | Update |
| `DELETE` | `/departments/:id` | Delete (blocked if has employees) |

### Employees (Admin only)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | List all |
| `POST` | `/employees` | Create |
| `PUT` | `/employees/:id` | Update |
| `DELETE` | `/employees/:id` | Delete |

### Requests (authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/requests` | Admin=all, User=own | List requests |
| `POST` | `/requests` | Any | Submit request |
| `PUT` | `/requests/:id/status` | Admin | Approve/Reject |
| `DELETE` | `/requests/:id` | Admin | Delete |

---

## Default Admin Account

On first use, register an account then verify it. To make someone an Admin, use the Accounts page after logging in as any Admin, or set `role: "Admin"` in the registration body.

For quick testing, register with:
- **Email:** `admin@example.com`
- **Password:** `Password123!`
- Then click "Simulate Email Verification"
- The first registered+verified user can be promoted to Admin via the API or directly in MySQL.

---

## Key Changes from Original Frontend

| Before (localStorage) | After (fetch API) |
|---|---|
| `window.db.accounts.push(...)` | `POST /users` |
| `window.db.accounts.find(...)` | `GET /users` |
| `account.password === input` | JWT via `POST /users/authenticate` |
| `window.db.departments` | `GET/POST/PUT/DELETE /departments` |
| `window.db.employees` | `GET/POST/PUT/DELETE /employees` |
| `window.db.requests` | `GET/POST /requests` |
| Session in `localStorage.auth_token` (email) | JWT in `localStorage.auth_token` |
