// src/requests/request.service.ts

import { db } from '../_helpers/db';
import { Request as EmployeeRequest } from './request.model';
import type { CreateRequestParams, SafeRequest, RequestStatus } from '../types';

export const requestService = {
  getAll,
  getByEmail,
  create,
  updateStatus,
  delete: _delete,
};

// ─── Get all requests (Admin view) ───────────────────────────────────────────

async function getAll(): Promise<SafeRequest[]> {
  return (await db.Request.findAll()).map(toSafe);
}

// ─── Get requests for a specific employee email ───────────────────────────────

async function getByEmail(email: string): Promise<SafeRequest[]> {
  const requests = await db.Request.findAll({
    where: { employeeEmail: email },
    order: [['id', 'DESC']],
  });
  return requests.map(toSafe);
}

// ─── Create a new request ─────────────────────────────────────────────────────

async function create(email: string, params: CreateRequestParams): Promise<SafeRequest> {
  if (!params.items || params.items.length === 0) {
    throw new Error('Please add at least one item');
  }

  // Validate each item has a name
  const validItems = params.items.filter((i) => i.name && i.name.trim() !== '');
  if (validItems.length === 0) {
    throw new Error('Please add at least one item with a name');
  }

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  const request = await db.Request.create({
    employeeEmail: email,
    type:          params.type,
    items:         validItems,
    status:        'Pending',
    date:          today,
  });

  return toSafe(request);
}

// ─── Update status (Admin) ────────────────────────────────────────────────────

async function updateStatus(id: number, status: RequestStatus): Promise<SafeRequest> {
  const request = await getRequest(id);
  await request.update({ status });
  return toSafe(request);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function _delete(id: number): Promise<void> {
  await (await getRequest(id)).destroy();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getRequest(id: number): Promise<EmployeeRequest> {
  const request = await db.Request.findByPk(id);
  if (!request) throw new Error('Request not found');
  return request;
}

function toSafe(r: EmployeeRequest): SafeRequest {
  return {
    id:            r.id,
    employeeEmail: r.employeeEmail,
    type:          r.type,
    items:         r.items,
    status:        r.status,
    date:          r.date,
  };
}
