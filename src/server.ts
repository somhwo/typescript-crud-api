// src/server.ts

import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './_middleware/errorHandler';
import { initialize } from './_helpers/db';
import usersController       from './users/users.controller';
import departmentsController from './departments/departments.controller';
import employeesController   from './employees/employees.controller';
import requestsController    from './requests/requests.controller';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serves index.html, script.js, style.css
// express.static automatically serves index.html for GET /
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/users',       usersController);
app.use('/departments', departmentsController);
app.use('/employees',   employeesController);
app.use('/requests',    requestsController);

app.use(errorHandler);

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