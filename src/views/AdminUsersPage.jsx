'use client';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

const STATUS_COLORS = {
  new: 'bg-amber-100 text-amber-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  ticket_issued: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
  completed: 'bg-slate-100 text-slate-600',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { user, mode: 'ban' | 'confirm' }
  const [banReason, setBanReason] = useState('');
  const [banExpires, setBanExpires] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Bookings drill-down
  const [bookingsPanel, setBookingsPanel] = useState(null); // user object
  const [userBookings, setUserBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const utils = trpc.useUtils();
  const adminAction = trpc.user.adminAction.useMutation();

  useEffect(() => { document.title = 'Users | Admin | BookingCart'; }, []);
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await utils.user.list.fetch();
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load');
    }
    setLoading(false);
  }

  async function patchUser(action, userId, extra = {}) {
    setSaving(true);
    try {
      await adminAction.mutateAsync({ action, userId, ...extra });
      await load();
      setModal(null);
      setBanReason('');
      setBanExpires('');
    } catch (err) {
      setError(err?.message ?? 'Action failed');
    }
    setSaving(false);
  }

  async function openBookingsPanel(user) {
    setBookingsPanel(user);
    setUserBookings([]);
    setBookingsLoading(true);
    try {
      const data = await utils.bookings.byUser.fetch({ userId: user.id });
      setUserBookings(data.bookings ?? []);
    } catch {
      setUserBookings([]);
    }
    setBookingsLoading(false);
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.email ?? '').toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} registered accounts</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
          <i className="ph ph-arrows-clockwise" /> Refresh
        </button>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      <div className="relative mb-5 max-w-sm">
        <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
      </div>

      <div className="flex gap-5">
        {/* Users table */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400"><i className="ph ph-circle-notch animate-spin text-2xl block mb-2" />Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400"><i className="ph ph-users text-4xl mb-2 block" /><p>No users found.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['User', 'Role', 'Verified', 'Joined', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id}
                      onClick={() => openBookingsPanel(u)}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${bookingsPanel?.id === u.id ? 'bg-slate-50' : i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                            {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{u.name ?? '—'}</p>
                            <p className="text-slate-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{u.role ?? 'user'}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{u.emailVerified ? <span className="text-green-600 font-semibold">Yes</span> : 'No'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3">
                        {u.banned ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">Banned</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => openBookingsPanel(u)}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 transition-colors">
                            Bookings
                          </button>
                          {u.banned ? (
                            <button onClick={() => patchUser('unban', u.id)}
                              className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 transition-colors">
                              Unban
                            </button>
                          ) : (
                            <button onClick={() => { setModal({ user: u, mode: 'ban' }); setBanReason(''); setBanExpires(''); }}
                              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors">
                              Ban
                            </button>
                          )}
                          {u.role === 'admin' ? (
                            <button onClick={() => setModal({ user: u, mode: 'demote' })}
                              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors">
                              Demote
                            </button>
                          ) : (
                            <button onClick={() => setModal({ user: u, mode: 'promote' })}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors">
                              Promote
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bookings drill-down panel */}
        {bookingsPanel && (
          <div className="w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-10rem)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{bookingsPanel.name ?? bookingsPanel.email}</p>
                <p className="text-xs text-slate-400 truncate">{bookingsPanel.email}</p>
              </div>
              <button onClick={() => { setBookingsPanel(null); setUserBookings([]); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-3 shrink-0">×</button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bookings</span>
              {!bookingsLoading && (
                <span className="text-xs text-slate-400">{userBookings.length} total</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {bookingsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(n => <div key={n} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : userBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <i className="ph ph-airplane-tilt text-3xl mb-2 block" />
                  <p className="text-sm">No bookings yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {userBookings.map(b => (
                    <a
                      key={b.id}
                      href={`/admin/bookings`}
                      className="flex flex-col gap-1 px-5 py-3 hover:bg-slate-50 transition-colors block"
                      title="View in Bookings page"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs tracking-widest">{b.ref}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-600'}`}>{b.status}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 text-xs truncate">{b.route ?? (b.bookingType === 'stay' ? 'Hotel Stay' : '—')}</span>
                        <span className="text-xs font-bold text-slate-700 shrink-0">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: b.currency ?? 'USD' }).format(Number(b.total ?? 0) / 100)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ban / Promote / Demote Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {modal.mode === 'ban' && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Ban User</h2>
                <p className="text-sm text-slate-500 mb-4">Banning <span className="font-semibold text-slate-800">{modal.user.email}</span> will prevent them from signing in.</p>
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Reason</label>
                    <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Why are you banning this user?"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Ban expires (optional)</label>
                    <input type="date" value={banExpires} onChange={e => setBanExpires(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
                  <button disabled={saving} onClick={() => patchUser('ban', modal.user.id, { reason: banReason, banExpires: banExpires || undefined })}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    {saving ? 'Banning…' : 'Confirm Ban'}
                  </button>
                </div>
              </>
            )}
            {(modal.mode === 'promote' || modal.mode === 'demote') && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1">{modal.mode === 'promote' ? 'Promote to Admin' : 'Demote to User'}</h2>
                <p className="text-sm text-slate-500 mb-5">
                  {modal.mode === 'promote' ? <>Give <span className="font-semibold text-slate-800">{modal.user.email}</span> full admin access?</> : <>Remove admin access from <span className="font-semibold text-slate-800">{modal.user.email}</span>?</>}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
                  <button disabled={saving} onClick={() => patchUser('setRole', modal.user.id, { role: modal.mode === 'promote' ? 'admin' : 'user' })}
                    className={`flex-1 ${modal.mode === 'promote' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'} disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors`}>
                    {saving ? 'Saving…' : 'Confirm'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
