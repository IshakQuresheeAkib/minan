import type { NextFunction, Request, Response } from "express";

import type { AdminRole } from "../types/auth.types.js";

export function requireRole(allowedRoles: readonly AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.admin?.role;
    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}
