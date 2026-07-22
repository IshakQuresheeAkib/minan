import type { NextFunction, Request, Response } from "express";

import { parseBody } from "../../lib/parseBody.js";
import {
  homeBannerCreateSchema,
  homeBannerDeleteSchema,
  homeBannerReorderSchema,
  homeBannerUpdateSchema,
} from "../../schemas/admin.schemas.js";
import {
  createAdminHomeBanner,
  deleteAdminHomeBanner,
  getAdminHomeBannerSet,
  reorderAdminHomeBanners,
  syncAdminHomeBanners,
  updateAdminHomeBanner,
} from "../../services/adminHomeBanners.service.js";

function getIdParam(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

export async function getAdminHomeBannersHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json({ data: await getAdminHomeBannerSet() });
  } catch (error) {
    next(error);
  }
}

export async function createAdminHomeBannerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(homeBannerCreateSchema, req.body);
    res.status(201).json({ data: await createAdminHomeBanner(input) });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminHomeBannerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(homeBannerUpdateSchema, req.body);
    res.json({ data: await updateAdminHomeBanner(getIdParam(req), input) });
  } catch (error) {
    next(error);
  }
}

export async function reorderAdminHomeBannersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(homeBannerReorderSchema, req.body);
    res.json({ data: await reorderAdminHomeBanners(input) });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminHomeBannerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(homeBannerDeleteSchema, req.body);
    res.json({
      data: await deleteAdminHomeBanner(
        getIdParam(req),
        input.expected_revision,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function syncAdminHomeBannersHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json({ data: await syncAdminHomeBanners() });
  } catch (error) {
    next(error);
  }
}
