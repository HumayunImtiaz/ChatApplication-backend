import { Response } from 'express';

interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  error?: any;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message?: string,
  data?: T
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data && { data }),
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  error?: any
): Response {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(error && { error }),
  };
  return res.status(statusCode).json(response);
}
