// src/_helpers/db.ts

import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import type { AppConfig } from '../types';
import type { User } from '../users/user.model';
import type { Department } from '../departments/department.model';
import type { Employee } from '../employees/employee.model';
import type { Request as EmployeeRequest } from '../requests/request.model';

// ─── Typed database container ─────────────────────────────────────────────────

export interface Database {
  sequelize:  Sequelize;
  User:       typeof User;
  Department: typeof Department;
  Employee:   typeof Employee;
  Request:    typeof EmployeeRequest;
}

export const db = {} as Database;

// ─── Initialize ───────────────────────────────────────────────────────────────

export async function initialize(): Promise<void> {
  const config: AppConfig = (await import('../../config.json')).default as AppConfig;
  const { host, port, user, password, database } = config.database;

  // 1. Create schema if missing
  const connection = await mysql.createConnection({ host, port, user, password });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // 2. Connect with Sequelize
  const sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'mysql',
    logging:  false,
  });

  // 3. Register models
  const { default: initUser }       = await import('../users/user.model');
  const { default: initDepartment } = await import('../departments/department.model');
  const { default: initEmployee }   = await import('../employees/employee.model');
  const { default: initRequest }    = await import('../requests/request.model');

  db.User       = initUser(sequelize);
  db.Department = initDepartment(sequelize);
  db.Employee   = initEmployee(sequelize);
  db.Request    = initRequest(sequelize);
  db.sequelize  = sequelize;

  // 4. Associations
  db.Employee.belongsTo(db.Department, { foreignKey: 'deptId', as: 'department' });
  db.Department.hasMany(db.Employee,   { foreignKey: 'deptId', as: 'employees' });

  // 5. Sync schema
  await sequelize.sync({ alter: true });

  // 6. Seed default data
  await seedDefaultData();

  console.log('✅ Database initialized and models synced');
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedDefaultData(): Promise<void> {
  // Default admin account
  const adminEmail = 'admin@example.com';
  const existing   = await db.User.findOne({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin@1234', 10);
    await db.User.create({
      title:        'Mr',
      firstName:    'Admin',
      lastName:     'User',
      email:        adminEmail,
      role:         'Admin' as any,
      verified:     true,          // pre-verified so login works immediately
      passwordHash,
    });
    console.log('🌱 Default admin account created:');
    console.log('   Email:    admin@example.com');
    console.log('   Password: Admin@1234');
  }

  // Default departments (only added if none exist)
  const deptCount = await db.Department.count();
  if (deptCount === 0) {
    await db.Department.bulkCreate([
      { name: 'Engineering', description: 'Software development team' },
      { name: 'HR',          description: 'Human Resources'           },
    ]);
    console.log('🌱 Default departments seeded: Engineering, HR');
  }
}