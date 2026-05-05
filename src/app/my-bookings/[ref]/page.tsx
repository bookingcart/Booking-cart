import BookingDetailPage from '@/views/BookingDetailPage';

export default async function Page({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return <BookingDetailPage bookingRef={ref} />;
}
