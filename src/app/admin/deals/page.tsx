import { requireAdmin } from '@/lib/session';
import AdminDealsPage from '@/views/AdminDealsPage';

export default async function Page() {
  await requireAdmin();
  return <AdminDealsPage />;
}
