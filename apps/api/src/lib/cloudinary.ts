import { v2 as cloudinary } from "cloudinary";

import { AppError } from "./errors.js";

export type UploadSignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
};

type CloudinaryDestroyResult = {
  publicId: string;
  result: string;
};

function ensureCloudinaryConfig(): void {
  if (!process.env.CLOUDINARY_URL) {
    throw new AppError("Cloudinary is not configured", 503);
  }

  cloudinary.config({ secure: true });
}

export function getUploadSignature(folder: string): UploadSignature {
  ensureCloudinaryConfig();

  const config = cloudinary.config();
  const apiSecret = config.api_secret;
  const apiKey = config.api_key;
  const cloudName = config.cloud_name;

  if (!apiSecret || !apiKey || !cloudName) {
    throw new AppError("Cloudinary credentials are incomplete", 503);
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);

  return {
    timestamp,
    signature,
    apiKey,
    cloudName,
    folder,
  };
}

export function getUploadFolder(): string {
  return process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "minan/admin";
}

function normalizeFolder(folder: string): string {
  return folder
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join("/");
}

function getConfiguredCloudName(): string {
  ensureCloudinaryConfig();

  const cloudName = cloudinary.config().cloud_name;
  if (!cloudName) {
    throw new AppError("Cloudinary credentials are incomplete", 503);
  }

  return cloudName;
}

export function isManagedCloudinaryPublicId(publicId: string): boolean {
  const folder = normalizeFolder(getUploadFolder());
  return folder.length > 0 && publicId.startsWith(`${folder}/`);
}

export function getManagedPublicIdFromUrl(url: string): string | null {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (parsedUrl.hostname !== "res.cloudinary.com") {
    return null;
  }

  const cloudName = getConfiguredCloudName();
  const segments = parsedUrl.pathname
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => decodeURIComponent(segment));

  if (
    segments.length < 4 ||
    segments[0] !== cloudName ||
    segments[1] !== "image" ||
    segments[2] !== "upload"
  ) {
    return null;
  }

  const versionIndex = segments.findIndex(
    (segment, index) => index > 2 && /^v\d+$/.test(segment),
  );
  const publicIdSegments =
    versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments.slice(3);

  if (publicIdSegments.length === 0) {
    return null;
  }

  const lastSegment = publicIdSegments.at(-1);

  if (!lastSegment) {
    return null;
  }

  const extensionIndex = lastSegment.lastIndexOf(".");

  if (extensionIndex > 0) {
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.slice(
      0,
      extensionIndex,
    );
  }

  const publicId = publicIdSegments.join("/");
  return isManagedCloudinaryPublicId(publicId) ? publicId : null;
}

export async function destroyManagedImage(
  publicId: string,
): Promise<CloudinaryDestroyResult> {
  ensureCloudinaryConfig();

  if (!isManagedCloudinaryPublicId(publicId)) {
    throw new AppError("Image is outside the managed upload folder", 400);
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  return {
    publicId,
    result: typeof result.result === "string" ? result.result : "unknown",
  };
}
