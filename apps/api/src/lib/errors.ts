export class AppError extends Error {
  readonly statusCode: number;
  readonly expose: boolean;

  constructor(message: string, statusCode: number, expose = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.expose = expose;
  }
}
