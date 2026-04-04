// src/_middleware/validateRequest.ts

import type { Request, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Validates `req.body` against the provided Joi schema.
 * On success it replaces `req.body` with the sanitised value.
 * On failure it forwards a descriptive string error to the error handler.
 */
export function validateRequest(
  req: Request,
  next: NextFunction,
  schema: Joi.ObjectSchema,
): void {
  const options: Joi.ValidationOptions = {
    abortEarly:   false, // collect all errors
    allowUnknown: true,  // ignore extra fields
    stripUnknown: true,  // remove them from the output
  };

  const { error, value } = schema.validate(req.body, options);

  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    next(`Validation error: ${message}`);
  } else {
    req.body = value as unknown;
    next();
  }
}
