import { AdminOrderDetail } from "@/features/admin/components/AdminOrderDetail";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminOrderDetail id={id} />;
}
