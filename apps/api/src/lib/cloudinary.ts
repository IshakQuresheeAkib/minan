import { v2 as cloudinary } from "cloudinary";

import { AppError } from "./errors.js";

export type UploadSignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
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
