export type AdminJwtPayload = {
  id: string;
  email: string;
  session_version: number;
};

export type AuthenticatedAdmin = AdminJwtPayload;

export type CustomerJwtPayload = {
  id: string;
  email: string;
  session_version: number;
  session_id: string;
};

export type AuthenticatedCustomer = CustomerJwtPayload;
