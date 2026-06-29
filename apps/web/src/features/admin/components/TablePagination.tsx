import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  page,
  totalPages,
  total,
  limit,
  disabled = false,
  onPageChange,
}: TablePaginationProps) {
  if (totalPages <= 1 && total <= limit) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
      <span>{total === 0 ? "No results" : `${from}–${to} of ${total}`}</span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>
          <span className="min-w-16 text-center tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
