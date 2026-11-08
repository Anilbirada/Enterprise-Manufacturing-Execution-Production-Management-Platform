import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Handler]', err);

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists. Duplicate values are prohibited.`,
      field
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: messages
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
