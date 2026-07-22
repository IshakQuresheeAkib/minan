import type {
  ManagedImageAsset,
  UploadSignature,
} from "@/features/admin/types";

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  error?: { message?: string };
};

export async function uploadImageToCloudinary(
  file: File,
  signature: UploadSignature,
): Promise<ManagedImageAsset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);
  if (signature.uploadPreset) {
    formData.append("upload_preset", signature.uploadPreset);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(payload.error?.message ?? "Image upload failed");
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
  };
}
