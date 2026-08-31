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

export type GuestOrderJwtPayload = {
  order_id: string;
  order_number: string;
  normalized_email: string;
  guest_access_version: number;
  challenge_id: string;
};

export type AuthenticatedGuestOrder = GuestOrderJwtPayload;
