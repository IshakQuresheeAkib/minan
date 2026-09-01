"use client";

import Link from "next/link";
import {
  ChevronRight,
  CircleUserRound,
  LogIn,
  PackageSearch,
  Store,
  UserRoundPlus,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Popover, Tooltip } from "radix-ui";

import { publicRoutes } from "@/constants/routes";

const PROFILE_MENU_CLOSE_DELAY_MS = 120;
const subscribeToClient = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const iconButtonClassName =
  "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/45 text-background transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-primary/60 focus-visible:outline-none";
const menuItemClassName =
  "group flex min-h-12 cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-200 hover:bg-primary/20 focus-visible:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary/60";

function ProfileMenuContent({
  forceMount,
  onCloseAutoFocus,
  onNavigate,
  onOpenAutoFocus,
  onPointerEnter,
  onPointerLeave,
}: {
  forceMount: boolean;
  onCloseAutoFocus: (event: Event) => void;
  onNavigate: () => void;
  onOpenAutoFocus: (event: Event) => void;
  onPointerEnter: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Popover.Content
      forceMount={forceMount ? true : undefined}
      aria-label="Profile menu"
      align="end"
      sideOffset={8}
      collisionPadding={12}
      style={{ zIndex: "var(--z-dropdown, 200)" }}
      onCloseAutoFocus={onCloseAutoFocus}
      onOpenAutoFocus={onOpenAutoFocus}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="w-[min(17rem,calc(100vw-2rem))] rounded-xl border border-primary/45 bg-background p-2 text-foreground shadow-xl shadow-foreground/20 outline-none data-[state=closed]:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
    >
      <div className="px-3 pt-2 pb-2.5">
        <span className="block text-[0.68rem] font-bold tracking-[0.16em] text-foreground/55 uppercase">
          Your MINAN
        </span>
        <span className="mt-1 block text-sm font-semibold text-foreground">
          Account and order access
        </span>
      </div>

      <div className="mx-1 mb-1 h-px bg-secondary" aria-hidden="true" />

      <Link
        href={publicRoutes.customerLogin}
        onClick={onNavigate}
        className={menuItemClassName}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <LogIn className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Login</span>
          <span className="block text-xs text-foreground/60">
            Open your MINAN account
          </span>
        </span>
        <ChevronRight
          className="size-4 text-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>

      <div
        role="link"
        aria-label="Create account — coming soon"
        aria-disabled="true"
        className="flex min-h-12 cursor-not-allowed select-none items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-55 outline-none"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-secondary bg-secondary/25">
          <UserRoundPlus className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Create account</span>
          <span className="block text-xs text-foreground/65">Coming soon</span>
        </span>
      </div>

      <div className="mx-1 my-1 h-px bg-secondary" aria-hidden="true" />

      <Link
        href={publicRoutes.orderTracking}
        onClick={onNavigate}
        className={menuItemClassName}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-foreground">
          <PackageSearch className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Track orders</span>
          <span className="block text-xs text-foreground/60">
            Guest and account orders
          </span>
        </span>
        <ChevronRight
          className="size-4 text-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </Popover.Content>
  );
}

export function NavbarActions() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const openedByHoverRef = useRef(false);
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );

  const clearScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearScheduledClose, [clearScheduledClose]);

  function openForMouse(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    clearScheduledClose();
    openedByHoverRef.current = true;
    setProfileMenuOpen(true);
  }

  function scheduleCloseForMouse(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    clearScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      setProfileMenuOpen(false);
      closeTimerRef.current = null;
    }, PROFILE_MENU_CLOSE_DELAY_MS);
  }

  const profileMenuContent = (
    <ProfileMenuContent
      forceMount={!isClient}
      onCloseAutoFocus={(event) => {
        if (openedByHoverRef.current) event.preventDefault();
        openedByHoverRef.current = false;
      }}
      onNavigate={() => setProfileMenuOpen(false)}
      onOpenAutoFocus={(event) => {
        if (openedByHoverRef.current) event.preventDefault();
      }}
      onPointerEnter={openForMouse}
      onPointerLeave={scheduleCloseForMouse}
    />
  );

  return (
    <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-end gap-2 lg:col-auto lg:row-auto">
      <Tooltip.Provider delayDuration={300}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="inline-flex cursor-not-allowed">
              <button
                type="button"
                disabled
                aria-label="Stores — coming soon"
                className={`${iconButtonClassName} pointer-events-none cursor-not-allowed text-background/55`}
              >
                <Store className="size-5" aria-hidden="true" />
                <span
                  className="absolute top-1.5 right-1.5 size-2 rounded-full border border-foreground bg-primary"
                  aria-hidden="true"
                />
              </button>
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              sideOffset={8}
              className="z-[var(--z-popover)] rounded-md bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-lg"
            >
              Stores coming soon
              <Tooltip.Arrow className="fill-background" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>

      <Popover.Root
        modal={false}
        open={profileMenuOpen}
        onOpenChange={(open) => {
          clearScheduledClose();
          setProfileMenuOpen(open);
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label="Open profile menu"
            onClick={(event) => {
              if (openedByHoverRef.current && event.detail > 0) {
                event.preventDefault();
              }
            }}
            onPointerEnter={openForMouse}
            onPointerLeave={scheduleCloseForMouse}
            className={`${iconButtonClassName} cursor-pointer hover:bg-primary hover:text-foreground data-[state=open]:bg-primary data-[state=open]:text-foreground`}
          >
            <CircleUserRound className="size-5" aria-hidden="true" />
          </button>
        </Popover.Trigger>

        {isClient ? (
          <Popover.Portal>{profileMenuContent}</Popover.Portal>
        ) : (
          profileMenuContent
        )}
      </Popover.Root>
    </div>
  );
}
