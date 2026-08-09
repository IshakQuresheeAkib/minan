"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createAdminHomeBanner,
  updateAdminHomeBanner,
} from "@/features/admin/actions/home-banners.actions";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import { useSessionImageCleanup } from "@/features/admin/hooks/useSessionImageCleanup";
import {
  adminHomeBannerFormSchema,
  type AdminHomeBannerFormInput,
} from "@/features/admin/schemas/admin.schemas";
import type {
  AdminHomeBanner,
  AdminHomeBannerSet,
  AdminImageAsset,
} from "@/features/admin/types";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";

const MAX_BANNER_FILE_SIZE = 5 * 1024 * 1024;
const BANNER_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type HomeBannerFormProps = {
  accessToken: string;
  banner: AdminHomeBanner | null;
  open: boolean;
  revision: number;
  sessionKey: number;
  onOpenChange: (open: boolean) => void;
  onSaved: (bannerSet: AdminHomeBannerSet) => void;
  onConflict: () => Promise<void>;
};

type HomeBannerFormFieldsProps = Omit<
  HomeBannerFormProps,
  "open" | "sessionKey" | "onOpenChange"
> & {
  onClose: () => void;
  onUploadStateChange: (uploading: boolean) => void;
};

function toAsset(url: string): AdminImageAsset[] {
  return url ? [{ url }] : [];
}

function BannerPreview({
  label,
  note,
  src,
  aspectClass,
}: {
  label: string;
  note: string;
  src: string;
  aspectClass: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs leading-relaxed text-foreground/65">{note}</p>
      </div>
      <div
        className={`relative overflow-hidden rounded-lg border bg-foreground/5 ${aspectClass}`}
      >
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 768px) 42vw, calc(100vw - 64px)"
          />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-sm text-foreground/60">
            Upload an image to preview its storefront crop.
          </div>
        )}
      </div>
    </div>
  );
}

function HomeBannerFormFields({
  accessToken,
  banner,
  revision,
  onClose,
  onSaved,
  onConflict,
  onUploadStateChange,
}: HomeBannerFormFieldsProps) {
  const [desktopAssets, setDesktopAssets] = useState<AdminImageAsset[]>(() =>
    toAsset(banner?.desktop_image_url ?? ""),
  );
  const [mobileAssets, setMobileAssets] = useState<AdminImageAsset[]>(() =>
    toAsset(banner?.mobile_image_url ?? ""),
  );
  const [uploading, setUploading] = useState({ desktop: false, mobile: false });
  const uploadingRef = useRef(uploading);
  const [saving, setSaving] = useState(false);
  const {
    cleanupRemovedSessionAssets,
    markAssetsSaved,
    registerUploadedAssets,
  } = useSessionImageCleanup(accessToken);
  const form = useForm<AdminHomeBannerFormInput>({
    resolver: zodResolver(adminHomeBannerFormSchema),
    defaultValues: {
      alt_text: banner?.alt_text ?? "",
      desktop_image_url: banner?.desktop_image_url ?? "",
      mobile_image_url: banner?.mobile_image_url ?? "",
    },
  });
  const isUploading = uploading.desktop || uploading.mobile;

  function setUploadState(kind: "desktop" | "mobile", value: boolean) {
    const nextUploading = { ...uploadingRef.current, [kind]: value };
    uploadingRef.current = nextUploading;
    setUploading(nextUploading);
    onUploadStateChange(nextUploading.desktop || nextUploading.mobile);
  }

  function handleDesktopChange(nextAssets: AdminImageAsset[]) {
    setDesktopAssets((current) => {
      cleanupRemovedSessionAssets(current, nextAssets);
      return nextAssets;
    });
    form.setValue("desktop_image_url", nextAssets[0]?.url ?? "", {
      shouldValidate: true,
    });
  }

  function handleMobileChange(nextAssets: AdminImageAsset[]) {
    setMobileAssets((current) => {
      cleanupRemovedSessionAssets(current, nextAssets);
      return nextAssets;
    });
    form.setValue("mobile_image_url", nextAssets[0]?.url ?? "", {
      shouldValidate: true,
    });
  }

  async function onSubmit(values: AdminHomeBannerFormInput) {
    if (isUploading) {
      toast.warning("Wait for both image uploads to finish");
      return;
    }

    setSaving(true);

    try {
      let response: { data: AdminHomeBannerSet };

      if (banner) {
        const changes = {
          ...(values.alt_text !== banner.alt_text
            ? { alt_text: values.alt_text }
            : {}),
          ...(values.desktop_image_url !== banner.desktop_image_url
            ? { desktop_image_url: values.desktop_image_url }
            : {}),
          ...(values.mobile_image_url !== banner.mobile_image_url
            ? { mobile_image_url: values.mobile_image_url }
            : {}),
        };

        if (Object.keys(changes).length === 0) {
          toast.info("No banner changes to save");
          onClose();
          return;
        }

        response = await updateAdminHomeBanner(
          accessToken,
          banner._id,
          { ...changes, expected_revision: revision },
        );
      } else {
        response = await createAdminHomeBanner(accessToken, {
          alt_text: values.alt_text,
          desktop_image_url: values.desktop_image_url,
          mobile_image_url: values.mobile_image_url,
          expected_revision: revision,
        });
      }

      markAssetsSaved([...desktopAssets, ...mobileAssets]);
      onSaved(response.data);
      toast.success(banner ? "Home banner updated" : "Home banner added");
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message);
        await onConflict();
        onClose();
        return;
      }

      toast.error(
        error instanceof ApiError ? error.message : "Failed to save banner",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
      >
        <div>
          <FormField
            control={form.control}
            name="alt_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image description</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    maxLength={160}
                    placeholder="Two models wearing maroon embroidered panjabi"
                  />
                </FormControl>
                <p className="text-xs leading-relaxed text-foreground/65">
                  Describe what is visible so screen-reader users receive the
                  same visual context.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)]">
          <div className="space-y-3">
            <BannerPreview
              label="Desktop banner"
              note="Recommended 16:9. Preview matches the full-width desktop crop."
              src={desktopAssets[0]?.url ?? ""}
              aspectClass="aspect-video"
            />
            <ImageUploader
              accessToken={accessToken}
              images={desktopAssets}
              multiple={false}
              acceptedFileTypes={BANNER_FILE_TYPES}
              maxFileSizeBytes={MAX_BANNER_FILE_SIZE}
              uploadPurpose="home-banner"
              onChange={handleDesktopChange}
              onUploadStateChange={(value) =>
                setUploadState("desktop", value)
              }
              onUploaded={registerUploadedAssets}
            />
            {form.formState.errors.desktop_image_url ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.desktop_image_url.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <BannerPreview
              label="Mobile banner"
              note="Recommended 4:5. The storefront fills its taller mobile hero."
              src={mobileAssets[0]?.url ?? ""}
              aspectClass="aspect-[4/5]"
            />
            <ImageUploader
              accessToken={accessToken}
              images={mobileAssets}
              multiple={false}
              acceptedFileTypes={BANNER_FILE_TYPES}
              maxFileSizeBytes={MAX_BANNER_FILE_SIZE}
              uploadPurpose="home-banner"
              onChange={handleMobileChange}
              onUploadStateChange={(value) => setUploadState("mobile", value)}
              onUploaded={registerUploadedAssets}
            />
            {form.formState.errors.mobile_image_url ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.mobile_image_url.message}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={saving || isUploading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={saving}
            loadingText="Saving..."
            disabled={isUploading}
          >
            {isUploading
              ? "Uploading images..."
              : banner
                ? "Save banner"
                : "Add banner"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function HomeBannerForm({
  accessToken,
  banner,
  open,
  revision,
  sessionKey,
  onOpenChange,
  onSaved,
  onConflict,
}: HomeBannerFormProps) {
  const [uploading, setUploading] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && uploading) {
      toast.warning("Wait for both image uploads to finish");
      return;
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit home banner" : "Add home banner"}</DialogTitle>
          <DialogDescription>
            Add an accessible image description and separate desktop and mobile
            crops. JPEG, PNG, or WebP only, up to 5 MB each.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <HomeBannerFormFields
            key={sessionKey}
            accessToken={accessToken}
            banner={banner}
            revision={revision}
            onUploadStateChange={setUploading}
            onSaved={onSaved}
            onConflict={onConflict}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
