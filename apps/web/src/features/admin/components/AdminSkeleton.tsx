import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type AdminSkeletonProps = {
  className?: string;
};

export function AdminSidebarSkeleton({ className }: AdminSkeletonProps) {
  return (
    <aside
      aria-label="Sidebar loading"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-28 flex-col items-center justify-between border-r border-[#E8E1D5]/70 bg-[#F6F1EB] py-6 lg:flex",
        className,
      )}
    >
      {/* Top: Brand Logo Skeleton */}
      <div className="flex flex-col items-center px-3">
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>

      {/* Center: Main Navigation Item Skeletons */}
      <div className="my-auto flex flex-col items-center gap-3 w-full px-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col items-center justify-center w-full py-2.5 px-2 rounded-2xl gap-1.5 transition-all",
              i === 0
                ? "border border-[#E4DBD0]/80 bg-white/80 shadow-[0_4px_16px_-2px_rgba(40,30,20,0.04)]"
                : "opacity-70",
            )}
          >
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="h-2.5 w-10 rounded" />
          </div>
        ))}
      </div>

      {/* Bottom: Settings, Help & Storefront Skeletons */}
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="size-9 rounded-full" />
      </div>
    </aside>
  );
}

export function AdminTopBarSkeleton({ className }: AdminSkeletonProps) {
  return (
    <header
      aria-label="Top navigation loading"
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#EBE3D7]/80 bg-[#F6F1EB]/90 px-4 py-3.5 backdrop-blur-md transition-all sm:px-6 lg:px-8",
        className,
      )}
    >
      {/* Mobile Menu Button Skeleton & Title */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-xl lg:hidden" />
        <Skeleton className="h-7 w-32 sm:h-8 sm:w-44 rounded-lg" />
      </div>

      {/* Central Search Bar Skeleton */}
      <div className="hidden flex-1 max-w-md md:block">
        <Skeleton className="h-9 w-full rounded-full" />
      </div>

      {/* Right Section: Time Pill, Bell & Avatar Skeletons */}
      <div className="flex items-center gap-3">
        <Skeleton className="hidden sm:block h-8 w-24 rounded-full" />
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="size-9 rounded-full" />
      </div>
    </header>
  );
}

export function AdminDashboardSkeleton({ className }: AdminSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded-lg sm:h-8 sm:w-72" />
          <Skeleton className="h-4 w-40 rounded-md sm:w-80" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* 4 Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      {/* Chart + Recent Orders Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-2xl lg:col-span-8" />
        <Skeleton className="h-80 rounded-2xl lg:col-span-4" />
      </div>

      {/* Best Selling Skeleton */}
      <Skeleton className="h-72 rounded-2xl" />

      {/* Bottom Insights Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-72 rounded-2xl lg:col-span-6" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-6" />
      </div>
    </div>
  );
}

export type AdminShellSkeletonProps = {
  children?: ReactNode;
  className?: string;
};

export function AdminShellSkeleton({ children, className }: AdminShellSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading admin portal"
      className={cn(
        "min-h-screen bg-[#F6F1EB] text-[#1C1917] antialiased selection:bg-[#EBDDC8]",
        className,
      )}
    >
      <AdminSidebarSkeleton />
      <div className="lg:pl-28 flex flex-col min-h-screen">
        <AdminTopBarSkeleton />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children ?? <AdminDashboardSkeleton />}
        </main>
      </div>
    </div>
  );
}

export const AdminSkeleton = AdminShellSkeleton;
