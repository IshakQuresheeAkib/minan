"use client";

import {
  ArrowDown,
  ArrowUp,
  Images,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  deleteAdminHomeBanner,
  fetchAdminHomeBanners,
  reorderAdminHomeBanners,
  syncAdminHomeBanners,
} from "@/features/admin/actions/home-banners.actions";
import { HomeBannerForm } from "@/features/admin/components/HomeBannerForm";
import type {
  AdminHomeBanner,
  AdminHomeBannerSet,
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
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

const MAX_BANNERS = 5;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function BannerImagePreview({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
        {label}
      </p>
      <div
        className={`relative overflow-hidden rounded-lg border bg-foreground/5 ${className}`}
      >
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 34vw, (min-width: 640px) 44vw, calc(100vw - 64px)"
        />
      </div>
    </div>
  );
}

export function AdminHomeBanners() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [bannerSet, setBannerSet] = useState<AdminHomeBannerSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [editingBanner, setEditingBanner] = useState<AdminHomeBanner | null>(
    null,
  );
  const [bannerToDelete, setBannerToDelete] =
    useState<AdminHomeBanner | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setError(null);
    const response = await fetchAdminHomeBanners(accessToken);
    setBannerSet(response.data);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;
    const token = accessToken;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminHomeBanners(token);
        if (!cancelled) {
          setBannerSet(response.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            getErrorMessage(loadError, "Failed to load home banners."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleConflict(errorValue: unknown, fallback: string) {
    const message = getErrorMessage(errorValue, fallback);
    toast.error(message);

    if (errorValue instanceof ApiError && errorValue.status === 409) {
      await reload().catch((reloadError: unknown) => {
        setError(getErrorMessage(reloadError, "Failed to refresh banners."));
      });
    }
  }

  function openCreateForm() {
    setEditingBanner(null);
    setFormSession((value) => value + 1);
    setFormOpen(true);
  }

  function openEditForm(banner: AdminHomeBanner) {
    setEditingBanner(banner);
    setFormSession((value) => value + 1);
    setFormOpen(true);
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!accessToken || !bannerSet || mutationPending) {
      return;
    }

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= bannerSet.banners.length) {
      return;
    }

    const orderedIds = bannerSet.banners.map((banner) => banner._id);
    [orderedIds[index], orderedIds[targetIndex]] = [
      orderedIds[targetIndex] ?? "",
      orderedIds[index] ?? "",
    ];

    setMutationPending(true);
    try {
      const response = await reorderAdminHomeBanners(accessToken, {
        ordered_ids: orderedIds,
        expected_revision: bannerSet.revision,
      });
      setBannerSet(response.data);
      toast.success("Banner order updated");
    } catch (moveError) {
      await handleConflict(moveError, "Failed to reorder banners");
    } finally {
      setMutationPending(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !bannerSet || !bannerToDelete || mutationPending) {
      return;
    }

    setMutationPending(true);
    try {
      const response = await deleteAdminHomeBanner(
        accessToken,
        bannerToDelete._id,
        bannerSet.revision,
      );
      setBannerSet(response.data);
      setBannerToDelete(null);
      toast.success("Home banner removed");
    } catch (deleteError) {
      await handleConflict(deleteError, "Failed to remove banner");
    } finally {
      setMutationPending(false);
    }
  }

  async function handleSync() {
    if (!accessToken || mutationPending) {
      return;
    }

    setMutationPending(true);
    try {
      const response = await syncAdminHomeBanners(accessToken);
      setBannerSet(response.data);
      if (
        response.data.storefront_sync_pending ||
        response.data.pending_cleanup_count > 0
      ) {
        toast.warning("Storefront sync still needs attention");
      } else {
        toast.success("Storefront banners synchronized");
      }
    } catch (syncError) {
      toast.error(getErrorMessage(syncError, "Failed to synchronize banners"));
    } finally {
      setMutationPending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="minan-skeleton h-10 w-64 rounded-md" />
        <div className="minan-skeleton h-72 rounded-xl border border-foreground/10" />
      </div>
    );
  }

  if (!bannerSet) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-xl font-semibold">Home Banners</h1>
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error ?? "Home banners are unavailable."}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => {
            void reload();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const needsSync =
    bannerSet.storefront_sync_pending ||
    bannerSet.pending_cleanup_count > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-foreground/60">
            <Images className="size-4" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              Storefront media
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Home Banners
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-foreground/65">
            Manage the ordered promotional images shown at the top of the
            homepage. Changes publish immediately.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border px-3 py-2 text-xs font-semibold text-foreground/70">
            {bannerSet.banners.length} / {MAX_BANNERS}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={
              mutationPending || bannerSet.banners.length >= MAX_BANNERS
            }
            leftIcon={<Plus className="size-4" aria-hidden="true" />}
            onClick={openCreateForm}
          >
            Add banner
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {needsSync ? (
        <div
          className="flex flex-col gap-4 rounded-xl border border-primary/40 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <div className="flex gap-3">
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0 text-foreground"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">Storefront sync pending</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                Your banner data is saved. Retry synchronization before removed
                Cloudinary images are cleaned up.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={mutationPending}
            loadingText="Retrying..."
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            onClick={() => {
              void handleSync();
            }}
          >
            Retry sync
          </Button>
        </div>
      ) : null}

      <div className="space-y-4">
        {bannerSet.banners.map((banner, index) => (
          <article
            key={banner._id}
            className="rounded-xl border bg-background p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs text-foreground/60">
                    Banner {index + 1} · Carousel position {index + 1}
                  </p>
                  <h2 className="font-semibold">{banner.alt_text}</h2>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  aria-label={`Move banner ${index + 1} up`}
                  disabled={mutationPending || index === 0}
                  leftIcon={<ArrowUp className="size-4" aria-hidden="true" />}
                  onClick={() => {
                    void handleMove(index, -1);
                  }}
                >
                  Move up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  aria-label={`Move banner ${index + 1} down`}
                  disabled={
                    mutationPending || index === bannerSet.banners.length - 1
                  }
                  leftIcon={
                    <ArrowDown className="size-4" aria-hidden="true" />
                  }
                  onClick={() => {
                    void handleMove(index, 1);
                  }}
                >
                  Move down
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={mutationPending}
                  leftIcon={<Pencil className="size-4" aria-hidden="true" />}
                  onClick={() => openEditForm(banner)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={
                    mutationPending || bannerSet.banners.length === 1
                  }
                  className="border-destructive text-destructive hover:bg-destructive hover:text-background"
                  leftIcon={<Trash2 className="size-4" aria-hidden="true" />}
                  onClick={() => setBannerToDelete(banner)}
                >
                  Remove
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.4fr)]">
              <BannerImagePreview
                src={banner.desktop_image_url}
                label="Desktop · 16:9"
                className="aspect-video"
              />
              <BannerImagePreview
                src={banner.mobile_image_url}
                label="Mobile · 4:5"
                className="aspect-[4/5] max-h-72 md:max-h-none"
              />
            </div>
          </article>
        ))}
      </div>

      {accessToken ? (
        <HomeBannerForm
          accessToken={accessToken}
          banner={editingBanner}
          open={formOpen}
          revision={bannerSet.revision}
          sessionKey={formSession}
          onOpenChange={setFormOpen}
          onSaved={setBannerSet}
          onConflict={async () => {
            await reload();
          }}
        />
      ) : null}

      <Dialog
        open={bannerToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !mutationPending) {
            setBannerToDelete(null);
          }
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader className="text-left">
            <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Remove this home banner?</DialogTitle>
            <DialogDescription className="leading-6">
              The banner disappears from the live carousel immediately. Its
              unshared Cloudinary images are removed after the storefront cache
              synchronizes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              autoFocus
              disabled={mutationPending}
              onClick={() => setBannerToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="border-destructive bg-destructive text-background shadow-destructive/20 hover:bg-destructive/90 hover:text-background"
              loading={mutationPending}
              loadingText="Removing..."
              onClick={() => {
                void handleDelete();
              }}
            >
              Remove banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
