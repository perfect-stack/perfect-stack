import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log the full exception, message, stack trace, and DB details to server logs
    this.logger.error(
      `Unhandled exception [${exception?.name || 'Error'}]: ${exception?.message || exception}`,
      exception?.stack,
    );
    if (exception?.original) {
      this.logger.error(`Original DB error: ${exception.original?.message || exception.original}`);
    }
    if (exception?.sql) {
      this.logger.error(`Failing SQL statement: ${exception.sql}`);
    }
    if (exception?.fields) {
      this.logger.error(`Failing fields: ${JSON.stringify(exception.fields)}`);
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = "Internal server error";

    if (exception instanceof HttpException || (exception && typeof exception.getStatus === "function")) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === "string" ? res : (res && res.message) || exception.message;
    } else if (exception && exception.status && typeof exception.status === "number") {
      status = exception.status;
      message = exception.message || "Error";
    } else if (exception && exception.message) {
      status = exception.statusCode || HttpStatus.BAD_REQUEST;
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: (exception && exception.name) || "Error",
    });
  }
}
