'use client';
import AdminSidebar from '../components/AdminSidebar.jsx';

export default function AdminShell({ children }) {
  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
