import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../lib/errors.js";
import { parseBody } from "../../lib/parseBody.js";
import {
  adminCreateSchema,
  adminUpdateSchema,
} from "../../schemas/admin.schemas.js";
import {
  createAdminUser,
  deactivateAdminUser,
  listAdminUsers,
  updateAdminUser,
} from "../../services/adminAdmins.service.js";

function getIdParam(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

function getActorId(req: Request): string {
  const actorId = req.admin?.id;
  if (!actorId) {
    throw new AppError("Unauthorized", 401);
  }

  return actorId;
}

export async function listAdminUsersHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listAdminUsers();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(adminCreateSchema, req.body);
    const admin = await createAdminUser(input);
    res.status(201).json({ data: admin });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(adminUpdateSchema, req.body);
    const admin = await updateAdminUser(
      getActorId(req),
      getIdParam(req),
      input,
    );
    res.json({ data: admin });
  } catch (error) {
    next(error);
  }
}

export async function deactivateAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = await deactivateAdminUser(getActorId(req), getIdParam(req));
    res.json({ data: admin });
  } catch (error) {
    next(error);
  }
}
