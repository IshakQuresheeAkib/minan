import type { NextFunction, Request, Response } from "express";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  message?: string;
};

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(error);

  if (error && typeof error === "object") {
    const httpError = error as HttpError;
    const status = httpError.statusCode ?? httpError.status;

    if (typeof status === "number" && status >= 400 && status < 600) {
      res.status(status).json({
        error: httpError.expose
          ? (httpError.message ?? "Request failed")
          : "Bad request",
      });
      return;
    }
  }

  res.status(500).json({ error: "Internal server error" });
}
