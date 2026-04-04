// src/_helpers/db.ts

import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import type { AppConfig } from '../types';
import type { User } from '../users/user.model';

// ─── Typed database container ────────────────────────────────────────────────

export interface Database {
  sequelize: Sequelize;
  User: typeof User;
}

// Using a typed proxy so every consumer gets proper intellisense without
// needing to cast. The object is populated during `initialize()`.
export const db = {} as Database;

// ─── Initialize ──────────────────────────────────────────────────────────────

export async function initialize(): Promise<void> {
  // Dynamic import keeps config out of module scope (avoids circular issues).
  const config: AppConfig = (await import('../../config.json')).default as AppConfig;
  const { host, port, user, password, database } = config.database;

  // 1. Create the database schema if it doesn't already exist.
  const connection = await mysql.createConnection({ host, port, user, password });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // 2. Connect with Sequelize.
  const sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'mysql',
    logging: false, // Set to console.log to debug SQL
  });

  // 3. Register models.
  const { default: initUserModel } = await import('../users/user.model');
  db.User      = initUserModel(sequelize);
  db.sequelize = sequelize;

  // 4. Sync schema (alter:true updates columns without dropping data).
  await sequelize.sync({ alter: true });

  console.log('✅ Database initialized and models synced');
}
