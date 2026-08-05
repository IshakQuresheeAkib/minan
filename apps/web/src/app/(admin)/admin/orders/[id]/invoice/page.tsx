import { OrderPrintView } from "@/features/admin/components/OrderPrintView";
type Props = { params: Promise<{ id: string }> };
export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  return <OrderPrintView id={id} kind="invoice" />;
}
