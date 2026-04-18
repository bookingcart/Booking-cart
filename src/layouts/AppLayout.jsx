import { Outlet } from 'react-router-dom';

/** Shell for nested routes (shared providers / future chrome). */
export default function AppLayout() {
  return <Outlet />;
}
