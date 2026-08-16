import type { AdminOrder } from "@/features/admin/types";

type CodFinancials = Pick<AdminOrder["financials"], "cod_due" | "cod_collected">;

export function getOutstandingCod(
  financials: CodFinancials,
): number {
  return Math.max(financials.cod_due - financials.cod_collected, 0);
}
