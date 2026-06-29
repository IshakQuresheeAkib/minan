"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { fetchUploadSignature } from "@/features/admin/actions/products.actions";
import { Button } from "@/components/ui/button";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";
import { ApiError } from "@/lib/api/client";

type ImageUploaderProps = {
  accessToken: string;
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
};

export function ImageUploader({
  accessToken,
  images,
  onChange,
  multiple = true,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = multiple
      ? Array.from(fileList)
      : fileList[0]
        ? [fileList[0]]
        : [];

    if (files.length === 0) {
      return;
    }

    setUploading(true);

    try {
      const signature = await fetchUploadSignature(accessToken);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const url = await uploadImageToCloudinary(file, signature);
        uploadedUrls.push(url);
      }

      onChange(multiple ? [...images, ...uploadedUrls] : uploadedUrls);
      toast.success(
        uploadedUrls.length === 1
          ? "Image uploaded"
          : `${uploadedUrls.length} images uploaded`,
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, imageIndex) => imageIndex !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative size-20 overflow-hidden rounded-md border"
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute top-1 right-1 h-6 px-2 text-xs"
              onClick={() => removeImage(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? "Uploading..."
            : multiple
              ? "Upload images"
              : "Upload image"}
        </Button>
      </div>
    </div>
  );
}
