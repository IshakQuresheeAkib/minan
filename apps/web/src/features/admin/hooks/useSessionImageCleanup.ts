"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { deleteUploadedImages } from "@/features/admin/actions/products.actions";
import type {
  AdminImageAsset,
  ManagedImageAsset,
} from "@/features/admin/types";

function getSessionPublicIds(assets: AdminImageAsset[]): string[] {
  return assets
    .map((asset) => asset.publicId)
    .filter((publicId): publicId is string => Boolean(publicId));
}

export function useSessionImageCleanup(accessToken: string) {
  const savedRef = useRef(false);
  const sessionPublicIdsRef = useRef<Set<string>>(new Set());

  const cleanupSessionPublicIds = useCallback(
    async (publicIds: string[], showToast = false) => {
      const publicIdsToDelete = Array.from(
        new Set(
          publicIds.filter((publicId) =>
            sessionPublicIdsRef.current.has(publicId),
          ),
        ),
      );

      if (publicIdsToDelete.length === 0) {
        return;
      }

      try {
        await deleteUploadedImages(accessToken, publicIdsToDelete);
        publicIdsToDelete.forEach((publicId) => {
          sessionPublicIdsRef.current.delete(publicId);
        });
      } catch (error) {
        console.error("Failed to clean up session Cloudinary uploads", error);

        if (showToast) {
          toast.error("Image removed here, but Cloudinary cleanup failed");
        }
      }
    },
    [accessToken],
  );

  const registerUploadedAssets = useCallback(
    (assets: ManagedImageAsset[]) => {
      assets.forEach((asset) => {
        sessionPublicIdsRef.current.add(asset.publicId);
      });
    },
    [],
  );

  const cleanupRemovedSessionAssets = useCallback(
    (previousAssets: AdminImageAsset[], nextAssets: AdminImageAsset[]) => {
      const nextPublicIds = new Set(getSessionPublicIds(nextAssets));
      const removedPublicIds = getSessionPublicIds(previousAssets).filter(
        (publicId) => !nextPublicIds.has(publicId),
      );

      void cleanupSessionPublicIds(removedPublicIds, true);
    },
    [cleanupSessionPublicIds],
  );

  const markAssetsSaved = useCallback(
    (assets: AdminImageAsset[]) => {
      savedRef.current = true;

      const savedPublicIds = new Set(getSessionPublicIds(assets));
      const stalePublicIds = Array.from(sessionPublicIdsRef.current).filter(
        (publicId) => !savedPublicIds.has(publicId),
      );

      savedPublicIds.forEach((publicId) => {
        sessionPublicIdsRef.current.delete(publicId);
      });

      void cleanupSessionPublicIds(stalePublicIds);
    },
    [cleanupSessionPublicIds],
  );

  useEffect(() => {
    const sessionPublicIds = sessionPublicIdsRef.current;

    return () => {
      if (savedRef.current || sessionPublicIds.size === 0) {
        return;
      }

      const publicIds = Array.from(sessionPublicIds);
      void deleteUploadedImages(accessToken, publicIds).catch((error) => {
        console.error("Failed to clean up abandoned Cloudinary uploads", error);
      });
    };
  }, [accessToken]);

  return {
    cleanupRemovedSessionAssets,
    markAssetsSaved,
    registerUploadedAssets,
  };
}
