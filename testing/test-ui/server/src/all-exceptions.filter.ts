import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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
