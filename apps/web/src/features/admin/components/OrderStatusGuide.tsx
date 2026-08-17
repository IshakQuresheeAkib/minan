"use client";

import { CircleHelp, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  COD_STATUS_GUIDE,
  COD_STATUS_ORDER,
  FEE_STATUS_GUIDE,
  FEE_STATUS_ORDER,
  type OrderStatusGuideEntry,
  WORKFLOW_STATUS_GUIDE,
  WORKFLOW_STATUS_ORDER,
} from "@/features/admin/lib/orderStatusGuide";

function GuideSection<T extends string>({
  title,
  entries,
  order,
}: {
  title: string;
  entries: Record<T, OrderStatusGuideEntry>;
  order: readonly T[];
}) {
  return (
    <section aria-labelledby={`${title.toLowerCase()}-guide`} className="border-t pt-5 first:border-t-0 first:pt-0">
      <h3 id={`${title.toLowerCase()}-guide`} className="font-semibold">{title}</h3>
      <div className="mt-3 space-y-4">
        {order.map((status) => {
          const entry = entries[status];
          return (
            <div key={status} className="text-sm">
              <h4 className="font-semibold">{entry.label}</h4>
              <p className="mt-1 text-foreground/75"><span className="font-medium text-foreground">এর মানে:</span> {entry.meaning}</p>
              <p className="mt-1 text-foreground/75"><span className="font-medium text-foreground">Admin করণীয়:</span> {entry.action}</p>
              {entry.warning ? <p className="mt-2 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-foreground/85"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" /><span><span className="font-medium">সতর্কতা:</span> {entry.warning}</span></p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function OrderStatusGuide() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" leftIcon={<CircleHelp className="size-4" aria-hidden="true" />}>Status guide</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-xl p-0 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[30rem] md:max-w-[90vw] md:rounded-none md:border-t-0 md:border-l md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right">
        <SheetHeader className="shrink-0 border-b pr-12">
          <SheetTitle>Order status guide</SheetTitle>
          <SheetDescription>একটি Order-এর Workflow, Fee এবং COD status আলাদা। Decision নেওয়ার আগে তিনটি status দেখুন।</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          <p className="py-5 text-sm text-foreground/70"><span className="font-medium text-foreground">All workflows</span>, <span className="font-medium text-foreground">All fee states</span>, এবং <span className="font-medium text-foreground">All COD states</span> শুধু সেই filter সরিয়ে সব Order দেখায়; এগুলো কোনো Order status নয়।</p>
          <div className="space-y-5">
            <GuideSection title="Workflow" entries={WORKFLOW_STATUS_GUIDE} order={WORKFLOW_STATUS_ORDER} />
            <GuideSection title="Fee" entries={FEE_STATUS_GUIDE} order={FEE_STATUS_ORDER} />
            <GuideSection title="COD" entries={COD_STATUS_GUIDE} order={COD_STATUS_ORDER} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
