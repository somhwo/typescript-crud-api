// src/departments/department.service.ts

import { db } from '../_helpers/db';
import { Department } from './department.model';
import type { CreateDepartmentParams, SafeDepartment, UpdateDepartmentParams } from '../types';

export const departmentService = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll(): Promise<SafeDepartment[]> {
  return (await db.Department.findAll()).map(toSafe);
}

async function getById(id: number): Promise<SafeDepartment> {
  return toSafe(await getDept(id));
}

async function create(params: CreateDepartmentParams): Promise<SafeDepartment> {
  const existing = await db.Department.findOne({ where: { name: params.name } });
  if (existing) throw new Error(`Department "${params.name}" already exists`);

  const dept = await db.Department.create({
    name:        params.name,
    description: params.description ?? '',
  });
  return toSafe(dept);
}

async function update(id: number, params: UpdateDepartmentParams): Promise<SafeDepartment> {
  const dept = await getDept(id);
  await dept.update(params);
  return toSafe(dept);
}

async function _delete(id: number): Promise<void> {
  const dept = await getDept(id);

  // Guard: cannot delete if employees are assigned
  const count = await db.Employee.count({ where: { deptId: id } });
  if (count > 0) {
    throw new Error(`Cannot delete "${dept.name}" – it has ${count} employee(s) assigned`);
  }

  await dept.destroy();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getDept(id: number): Promise<Department> {
  const dept = await db.Department.findByPk(id);
  if (!dept) throw new Error('Department not found');
  return dept;
}

function toSafe(dept: Department): SafeDepartment {
  return { id: dept.id, name: dept.name, description: dept.description };
}
