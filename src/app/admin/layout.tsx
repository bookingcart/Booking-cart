import { requireAdmin } from '@/lib/session';
import AdminShell from '@/layouts/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
