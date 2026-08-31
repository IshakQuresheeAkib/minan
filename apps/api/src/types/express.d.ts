import type {
  AuthenticatedAdmin,
  AuthenticatedCustomer,
  AuthenticatedGuestOrder,
} from "./auth.types.js";

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
      customer?: AuthenticatedCustomer;
      guestOrder?: AuthenticatedGuestOrder;
    }
  }
}

export {};
