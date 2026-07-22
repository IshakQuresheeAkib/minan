import type { NextFunction, Request, Response } from "express";

import {
  destroyManagedImage,
  getHomeBannerUploadPreset,
  getUploadFolder,
  getUploadSignature,
} from "../../lib/cloudinary.js";
import { parseBody } from "../../lib/parseBody.js";
import { uploadDeleteSchema } from "../../schemas/admin.schemas.js";
import {
  findReferencedManagedPublicIds,
} from "../../services/adminMediaCleanup.service.js";

const UPLOAD_DELETE_BATCH_SIZE = 5;

type UploadDeleteResult = {
  publicId: string;
  result: string;
};

export async function getUploadSignatureHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const purpose =
      typeof req.query.purpose === "string" ? req.query.purpose : undefined;
    const baseFolder = getUploadFolder();
    const isHomeBanner = purpose === "home-banner";
    const folder = isHomeBanner
      ? `${baseFolder}/home-banners`
      : baseFolder;
    const uploadPreset = isHomeBanner
      ? getHomeBannerUploadPreset()
      : undefined;
    const signature = getUploadSignature(folder, uploadPreset);
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
    const referencedPublicIds = await findReferencedManagedPublicIds(
      uniquePublicIds,
    );
    const deleted: UploadDeleteResult[] = [];

    for (
      let batchStart = 0;
      batchStart < uniquePublicIds.length;
      batchStart += UPLOAD_DELETE_BATCH_SIZE
    ) {
      const publicIdBatch = uniquePublicIds.slice(
        batchStart,
        batchStart + UPLOAD_DELETE_BATCH_SIZE,
      );
      const batchResults = await Promise.all(
        publicIdBatch.map(async (publicId) => {
          if (referencedPublicIds.has(publicId)) {
            return { publicId, result: "referenced" };
          }

          return destroyManagedImage(publicId);
        }),
      );
      deleted.push(...batchResults);
    }

    res.json({ data: deleted });
  } catch (error) {
    next(error);
  }
}
