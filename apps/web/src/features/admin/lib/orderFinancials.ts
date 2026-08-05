import type { AdminOrder, CodStatus } from "@/features/admin/types";

type CodFinancials = Pick<AdminOrder["financials"], "cod_due" | "cod_collected">;

export function getOutstandingCod(
  financials: CodFinancials,
  status: CodStatus,
): number {
  if (status === "waived") return 0;
  return Math.max(financials.cod_due - financials.cod_collected, 0);
}
