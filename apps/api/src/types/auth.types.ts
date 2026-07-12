export type AdminJwtPayload = {
  id: string;
  email: string;
};

export type AuthenticatedAdmin = AdminJwtPayload;
