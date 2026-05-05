'use client';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';

const NAV = [
  { href: '/admin',           label: 'Overview',      icon: 'ph-squares-four' },
  { href: '/admin/bookings',  label: 'Bookings',      icon: 'ph-airplane-tilt' },
  { href: '/admin/users',     label: 'Users',         icon: 'ph-users' },
  { href: '/admin/analytics', label: 'Analytics',     icon: 'ph-chart-bar' },
  { href: '/admin/visa',      label: 'Visa Apps',     icon: 'ph-passport' },
  { href: '/admin/deals',     label: 'Flight Deals',  icon: 'ph-tag' },
  { href: '/admin/audit',     label: 'Audit Log',     icon: 'ph-clipboard-text' },
  { href: '/admin/settings',  label: 'Settings',      icon: 'ph-gear' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  async function handleSignOut() {
    await signOut();
    router.push('/sign-in');
  }

  return (
    <aside className="w-60 shrink-0 h-screen flex flex-col bg-slate-900 text-white sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/60 flex items-center gap-3">
        <a href="/" className="flex items-center gap-3 min-w-0">
          <img src="/images/logo.svg" alt="BookingCart" className="h-8 w-auto shrink-0" />
          <span className="font-bold text-sm text-white truncate">BookingCart</span>
        </a>
        <span className="ml-auto shrink-0 text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive(href)
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className={`ph ${icon} text-lg`} />
            {label}
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/60">
        <a
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <i className="ph ph-house text-lg" />
          Back to Site
        </a>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors mt-0.5"
        >
          <i className="ph ph-sign-out text-lg" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
