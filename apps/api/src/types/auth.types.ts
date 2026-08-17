export type AdminJwtPayload = {
  id: string;
  email: string;
  session_version: number;
};

export type AuthenticatedAdmin = AdminJwtPayload;
