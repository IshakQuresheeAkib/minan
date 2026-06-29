export type AdminRole = "general" | "premium";

export type AdminJwtPayload = {
  id: string;
  email: string;
  role: AdminRole;
};

export type AuthenticatedAdmin = AdminJwtPayload;
