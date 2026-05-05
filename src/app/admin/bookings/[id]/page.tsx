import { requireAdmin } from '@/lib/session';
import AdminBookingDetailClient from './AdminBookingDetailClient';

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  return <AdminBookingDetailClient id={id} />;
}
