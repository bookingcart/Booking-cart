'use client';
import AdminBookingDetailPage from '@/views/AdminBookingDetailPage';

export default function AdminBookingDetailClient({ id }: { id: string }) {
  return <AdminBookingDetailPage id={id} />;
}
