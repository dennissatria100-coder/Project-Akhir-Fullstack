import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

/** Format error konsisten: { statusCode, message, error, timestamp } */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = 500;
    let message: string | string[] = 'Terjadi kesalahan pada server';
    let error = STATUS_TEXT[500];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r: any = exception.getResponse();
      if (typeof r === 'string') {
        message = r;
        error = STATUS_TEXT[status] ?? 'Error';
      } else {
        message = r.message ?? exception.message;
        error = r.error ?? STATUS_TEXT[status] ?? 'Error';
      }
    } else if (exception instanceof QueryFailedError) {
      const code = (exception as any).code;
      if (code === '23505') {
        status = 409;
        message = 'Data sudah ada (duplikat)';
        error = STATUS_TEXT[409];
      } else if (code === '23503') {
        status = 409;
        message = 'Data tidak dapat dihapus/diubah karena masih terhubung dengan data lain';
        error = STATUS_TEXT[409];
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    } else {
      this.logger.error(
        (exception as Error)?.message,
        (exception as Error)?.stack,
      );
    }

    res.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
