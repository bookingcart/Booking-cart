import { requireAdmin } from '@/lib/session';
import AdminSettingsPage from '@/views/AdminSettingsPage';

export default async function Page() {
  await requireAdmin();
  return <AdminSettingsPage />;
}
