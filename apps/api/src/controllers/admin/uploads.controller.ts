import type { NextFunction, Request, Response } from "express";

import { getUploadFolder, getUploadSignature } from "../../lib/cloudinary.js";

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
