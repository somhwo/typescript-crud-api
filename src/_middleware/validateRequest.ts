// src/_middleware/validateRequest.ts

import type { Request, NextFunction } from 'express';
import Joi from 'joi';

export function validateRequest(
  req: Request,
  next: NextFunction,
  schema: Joi.ObjectSchema,
): void {
  const { error, value } = schema.validate(req.body, {
    abortEarly:   false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    next(`Validation error: ${error.details.map((d) => d.message).join(', ')}`);
  } else {
    req.body = value as unknown;
    next();
  }
}
