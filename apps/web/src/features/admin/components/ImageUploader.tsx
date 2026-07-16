"use client";

import { ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  deleteUploadedImages,
  fetchUploadSignature,
} from "@/features/admin/actions/products.actions";
import { Button } from "@/components/ui/Button";
import type {
  AdminImageAsset,
  ManagedImageAsset,
} from "@/features/admin/types";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";
import { ApiError } from "@/lib/api/client";

type ImageUploaderProps = {
  accessToken: string;
  images: AdminImageAsset[];
  onChange: (images: AdminImageAsset[]) => void;
  onUploadStateChange?: (uploading: boolean) => void;
  onUploaded?: (assets: ManagedImageAsset[]) => void;
  multiple?: boolean;
  showProductRoles?: boolean;
};

export function ImageUploader({
  accessToken,
  images,
  onChange,
  onUploadStateChange,
  onUploaded,
  multiple = true,
  showProductRoles = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const [uploading, setUploading] = useState(false);
  const usesProductRoles = multiple && showProductRoles;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  function updateUploading(nextUploading: boolean) {
    setUploading(nextUploading);
    onUploadStateChange?.(nextUploading);
  }

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

    updateUploading(true);
    const uploadedAssets: ManagedImageAsset[] = [];

    try {
      const signature = await fetchUploadSignature(accessToken);

      if (!mountedRef.current) {
        return;
      }

      for (const file of files) {
        const asset = await uploadImageToCloudinary(file, signature);

        if (!mountedRef.current) {
          await deleteUploadedImages(accessToken, [asset.publicId]).catch(
            (error) => {
              console.error(
                "Failed to clean up upload completed after navigation",
                error,
              );
            },
          );
          return;
        }

        uploadedAssets.push(asset);
        onUploaded?.([asset]);
      }

      onChange(multiple ? [...images, ...uploadedAssets] : uploadedAssets);
      toast.success(
        uploadedAssets.length === 1
          ? "Image uploaded"
          : `${uploadedAssets.length} images uploaded`,
      );
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Upload failed";
      toast.error(message);

      if (uploadedAssets.length > 0) {
        onChange(multiple ? [...images, ...uploadedAssets] : uploadedAssets);
        toast.success(
          uploadedAssets.length === 1
            ? "1 image finished uploading"
            : `${uploadedAssets.length} images finished uploading`,
        );
      }
    } finally {
      if (mountedRef.current) {
        updateUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    }
  }

  function removeImage(index: number) {
    if (uploading) {
      return;
    }

    const nextImages = images.filter((_, imageIndex) => imageIndex !== index);
    onChange(nextImages);

    if (usesProductRoles && index === 0 && nextImages.length > 0) {
      toast.success("Main image removed. Next image is now main.");
    }
  }

  function setMainImage(index: number) {
    if (uploading) {
      return;
    }

    const selectedImage = images[index];

    if (!selectedImage || index === 0) {
      return;
    }

    onChange([
      selectedImage,
      ...images.filter((_, imageIndex) => imageIndex !== index),
    ]);
    toast.success("Main image updated");
  }

  const uploadButton = (
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
        variant="secondary"
        disabled={uploading}
        leftIcon={<ImagePlus className="size-4" aria-hidden="true" />}
        onClick={() => inputRef.current?.click()}
      >
        {uploading
          ? "Uploading..."
          : multiple
            ? "Upload images"
            : "Upload image"}
      </Button>
    </div>
  );

  if (usesProductRoles) {
    const mainImage = images[0];
    const galleryImages = images.slice(1);

    return (
      <div className="space-y-4">
        {mainImage ? (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Main image
                </p>
                <p className="text-xs leading-relaxed text-foreground/65">
                  Shown on product cards, catalog pages, and the first product
                  preview.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-2.5 py-1 text-xs font-semibold text-foreground">
                <Star className="size-3.5 fill-current" aria-hidden="true" />
                Main
              </span>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-primary/25 bg-foreground/5">
              <Image
                src={mainImage.url}
                alt="Main product image"
                fill
                className="object-cover"
                sizes="(min-width: 640px) 480px, calc(100vw - 48px)"
                unoptimized
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label="Remove main image"
                disabled={uploading}
                className="absolute top-3 right-3 size-9 border-destructive text-destructive shadow-destructive/20 hover:bg-destructive hover:text-background hover:shadow-destructive/40"
                onClick={() => removeImage(0)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-foreground/25 bg-foreground/5 p-5 text-sm text-foreground/70">
            Upload product images. The first image becomes the main storefront
            image.
          </div>
        )}

        {galleryImages.length > 0 ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Gallery images
              </p>
              <p className="text-xs leading-relaxed text-foreground/65">
                These appear after the main image on the product page.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {galleryImages.map((url, offset) => {
                const imageIndex = offset + 1;

                return (
                  <div
                    key={`${url.url}-${imageIndex}`}
                    className="overflow-hidden rounded-md border border-secondary bg-background"
                  >
                    <div className="relative aspect-square overflow-hidden bg-foreground/5">
                      <Image
                        src={url.url}
                        alt={`Gallery product image ${offset + 1}`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 150px, 45vw"
                        unoptimized
                      />
                      <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm">
                        Gallery {offset + 1}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        aria-label={`Remove gallery image ${offset + 1}`}
                        disabled={uploading}
                        className="absolute top-2 right-2 size-8 border-destructive text-destructive shadow-destructive/20 hover:bg-destructive hover:text-background hover:shadow-destructive/40"
                        onClick={() => removeImage(imageIndex)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="p-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={uploading}
                        className="w-full px-3 py-2 text-xs"
                        leftIcon={
                          <Star className="size-3.5" aria-hidden="true" />
                        }
                        onClick={() => setMainImage(imageIndex)}
                      >
                        Set as main
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {uploadButton}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="relative size-20 overflow-hidden rounded-md border"
          >
            <Image
              src={image.url}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploading}
              className="absolute top-1 right-1 h-6 border-destructive px-2 text-xs text-destructive shadow-destructive/20 hover:bg-destructive hover:text-background hover:shadow-destructive/40"
              onClick={() => removeImage(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      {uploadButton}
    </div>
  );
}
