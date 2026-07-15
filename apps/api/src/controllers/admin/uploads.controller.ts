import type { NextFunction, Request, Response } from "express";

import {
  destroyManagedImage,
  getUploadFolder,
  getUploadSignature,
} from "../../lib/cloudinary.js";
import { parseBody } from "../../lib/parseBody.js";
import { uploadDeleteSchema } from "../../schemas/admin.schemas.js";

export async function getUploadSignatureHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const folder = getUploadFolder();
    const signature = getUploadSignature(folder);
    res.json(signature);
  } catch (error) {
    next(error);
  }
}

export async function deleteUploadsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(uploadDeleteSchema, req.body);
    const uniquePublicIds = Array.from(new Set(input.publicIds));
    const deleted = await Promise.all(
      uniquePublicIds.map((publicId) => destroyManagedImage(publicId)),
    );

    res.json({ data: deleted });
  } catch (error) {
    next(error);
  }
}
