// src/employees/employee.service.ts

import { db } from '../_helpers/db';
import { Employee } from './employee.model';
import type { CreateEmployeeParams, SafeEmployee, UpdateEmployeeParams } from '../types';

export const employeeService = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll(): Promise<SafeEmployee[]> {
  const employees = await db.Employee.findAll({
    include: [{ model: db.Department, as: 'department', attributes: ['name'] }],
  });
  return employees.map(toSafe);
}

async function getById(id: number): Promise<SafeEmployee> {
  return toSafe(await getEmp(id));
}

async function create(params: CreateEmployeeParams): Promise<SafeEmployee> {
  // Guard: employeeId must be unique
  const existing = await db.Employee.findOne({ where: { employeeId: params.employeeId } });
  if (existing) throw new Error(`Employee ID "${params.employeeId}" already exists`);

  // Guard: account must exist
  const account = await db.User.findOne({ where: { email: params.userEmail } });
  if (!account) {
    throw new Error(`No account found for email "${params.userEmail}". Create the account first.`);
  }

  // Guard: department must exist
  const dept = await db.Department.findByPk(params.deptId);
  if (!dept) throw new Error(`Department ID ${params.deptId} does not exist`);

  const emp = await db.Employee.create({
    employeeId: params.employeeId,
    userEmail:  params.userEmail,
    position:   params.position,
    deptId:     params.deptId,
    hireDate:   params.hireDate ?? '',
  });

  return toSafe(emp);
}

async function update(id: number, params: UpdateEmployeeParams): Promise<SafeEmployee> {
  const emp = await getEmp(id);

  if (params.userEmail && params.userEmail !== emp.userEmail) {
    const account = await db.User.findOne({ where: { email: params.userEmail } });
    if (!account) {
      throw new Error(`No account found for email "${params.userEmail}"`);
    }
  }

  if (params.deptId) {
    const dept = await db.Department.findByPk(params.deptId);
    if (!dept) throw new Error(`Department ID ${params.deptId} does not exist`);
  }

  await emp.update(params);
  return toSafe(emp);
}

async function _delete(id: number): Promise<void> {
  await (await getEmp(id)).destroy();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getEmp(id: number): Promise<Employee> {
  const emp = await db.Employee.findByPk(id);
  if (!emp) throw new Error('Employee not found');
  return emp;
}

function toSafe(emp: Employee & { department?: { name: string } }): SafeEmployee {
  return {
    id:         emp.id,
    employeeId: emp.employeeId,
    userEmail:  emp.userEmail,
    position:   emp.position,
    deptId:     emp.deptId,
    deptName:   emp.department?.name,
    hireDate:   emp.hireDate,
  };
}
