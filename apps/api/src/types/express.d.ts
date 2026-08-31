import type {
  AuthenticatedAdmin,
  AuthenticatedCustomer,
} from "./auth.types.js";

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
      customer?: AuthenticatedCustomer;
    }
  }
}

export {};
