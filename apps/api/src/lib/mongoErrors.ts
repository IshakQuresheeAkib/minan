import { AppError } from "./errors.js";

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

export function throwIfDuplicateKey(error: unknown, message: string): never {
  if (isDuplicateKeyError(error)) {
    throw new AppError(message, 409);
  }

  throw error;
}
