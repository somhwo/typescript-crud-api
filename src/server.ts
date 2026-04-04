// src/server.ts

import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './_middleware/errorHandler';
import { initialize } from './_helpers/db';
import usersController from './users/users.controller';

const app: Application = express();

// ─── Global middleware ────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/users', usersController);

// ─── Error handler (must be registered last) ─────────────────────────────────

app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 4000;

initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error('❌ Failed to initialize:', err);
    process.exit(1);
  });

export default app;
