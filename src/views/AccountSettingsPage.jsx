'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';
import { trpc } from '@/lib/trpc';
import { useAuth } from '../context/AuthContext.jsx';
import { authClient } from '@/lib/auth-client';

const ACCOUNT_SECTIONS = ['profile', 'security', 'payments', 'preferences', 'notifications', 'rewards'];
const SECTION_TITLE = { profile: 'Profile', security: 'Security', payments: 'Payments', preferences: 'Travel Preferences', notifications: 'Notifications', rewards: 'Rewards' };

function accountPath(slug) {
  return slug === 'profile' ? '/account-settings' : `/account-settings/${slug}`;
}

// ── Notification row
function NotifRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div><div className="text-sm font-semibold text-slate-800">{label}</div><div className="text-xs text-slate-400">{desc}</div></div>
      <label className="toggle-wrap flex-shrink-0 ml-4">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}

const AIRLINES = ['Emirates', 'Qatar Airways', 'British Airways', 'Lufthansa', 'Air France', 'KLM', 'Turkish Airlines', 'Singapore Airlines', 'Etihad', 'Kenya Airways', 'South African', 'Ethiopian'];

export default function AccountSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isPending } = useAuth();
  const sectionParam = params?.section ?? null;

  const activeSection = !sectionParam || sectionParam === 'profile' ? 'profile'
    : ACCOUNT_SECTIONS.includes(sectionParam) ? sectionParam : null;

  // ── User data
  const [user, setUser] = useState(null);

  // ── Profile form
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phoneCode: '+1', phone: '', dob: '', nationality: '', language: 'en' });
  const [avatarSrc, setAvatarSrc] = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // ── Security form
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false });
  const [tfa, setTfa] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  // ── Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Payment methods
  const [cards, setCards] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [cardMsg, setCardMsg] = useState({ type: '', text: '' });

  // ── Preferences
  const [prefs, setPrefs] = useState({ homeAirport: '', cabin: 'Economy', seat: 'window', meal: 'Standard' });
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [prefsMsg, setPrefsMsg] = useState({ type: '', text: '' });

  // ── Notifications
  const [emailNotifs, setEmailNotifs] = useState({ bookingConfirm: true, flightUpdates: true, deals: false, newsletter: false });
  const [smsNotifs, setSmsNotifs] = useState({ boardingAlert: true, flightDelay: true, promos: false });
  const [notifMsg, setNotifMsg] = useState({ type: '', text: '' });

  // ── tRPC mutations
  const updateUser = trpc.user.update.useMutation();
  const updatePrefs = trpc.user.updatePreferences.useMutation();
  const updateNotifs = trpc.user.updateNotifications.useMutation();
  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => router.push('/'),
    onError: (err) => toast(err.message ?? 'Delete failed', 'error', setProfileMsg),
  });
  const { data: meData } = trpc.user.me.useQuery(undefined, { enabled: !!authUser });

  // ── Toast helper
  function toast(msg, type, setter) { setter({ type, text: msg }); setTimeout(() => setter({ type: '', text: '' }), 4000); }

  // ── Load user from auth context
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      const parts = (authUser.name ?? '').split(' ');
      setProfile(p => ({ ...p, firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '', email: authUser.email ?? '' }));
      setAvatarSrc(authUser.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.name ?? 'User')}&background=dcfce7&color=15803d&size=200`);
    }
  }, [authUser]);

  // ── Seed preferences & notifications from DB
  useEffect(() => {
    if (!meData?.user) return;
    const p = meData.user.preferences;
    const n = meData.user.notifications;
    if (p) {
      setPrefs(prev => ({ ...prev, ...p }));
      if (p.airlines) setSelectedAirlines(p.airlines);
      if (p.phone !== undefined) setProfile(prev => ({ ...prev, phone: p.phone ?? '', phoneCode: p.phoneCode ?? '+1' }));
    }
    if (n) {
      if (n.email) setEmailNotifs(prev => ({ ...prev, ...n.email }));
      if (n.sms) setSmsNotifs(prev => ({ ...prev, ...n.sms }));
    }
  }, [meData]);

  useEffect(() => {
    if (activeSection) document.title = `${SECTION_TITLE[activeSection]} · Account | BookingCart`;
  }, [activeSection]);

  useEffect(() => {
    if (sectionParam === 'profile') router.replace('/account-settings');
    else if (activeSection === null) router.replace('/account-settings');
  }, [sectionParam, activeSection, router]);

  useEffect(() => { if (activeSection) window.scrollTo({ top: 0, behavior: 'smooth' }); }, [activeSection]);

  // ── Auth guard — redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isPending && !authUser) router.replace('/sign-in');
  }, [isPending, authUser, router]);

  // ── Loading / unauthenticated state
  if (isPending || (!authUser && !isPending)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading your account…</p>
        </div>
      </div>
    );
  }

  if (sectionParam === 'profile' || activeSection === null) return null;

  // ── Profile save
  async function handleSaveProfile(e) {
    e.preventDefault();
    const name = `${profile.firstName} ${profile.lastName}`.trim();
    updateUser.mutate(
      { name },
      {
        onSuccess: () => {
          updatePrefs.mutate({ phone: profile.phone, phoneCode: profile.phoneCode });
          toast('Profile saved.', 'success', setProfileMsg);
        },
        onError: (err) => toast(err.message ?? 'Save failed', 'error', setProfileMsg),
      },
    );
  }

  // ── Avatar preview
  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  }

  // ── Password change
  async function handleChangePassword(e) {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) { toast('Passwords do not match', 'error', setPwdMsg); return; }
    const result = await authClient.changePassword({
      currentPassword: pwdForm.current,
      newPassword: pwdForm.next,
      revokeOtherSessions: false,
    });
    if (result.error) toast(result.error.message ?? 'Failed to update password', 'error', setPwdMsg);
    else { toast('Password updated.', 'success', setPwdMsg); setPwdForm({ current: '', next: '', confirm: '' }); }
  }

  // ── Delete account
  async function handleDeleteAccount() {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    deleteUser.mutate();
    setDeleting(false);
  }

  // ── Add card (via Stripe setup intent)
  async function handleAddCard(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/stripe/add-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cardForm) });
      const data = await res.json();
      if (data.ok) { toast('Card added.', 'success', setCardMsg); setCards(prev => [...prev, data.card]); setShowAddCard(false); setCardForm({ number: '', expiry: '', cvc: '', name: '' }); }
      else toast(data.error ?? 'Failed to add card', 'error', setCardMsg);
    } catch { toast('Network error', 'error', setCardMsg); }
  }

  // ── Preferences save
  function handleSavePrefs() {
    updatePrefs.mutate(
      { ...prefs, airlines: selectedAirlines },
      {
        onSuccess: () => toast('Preferences saved.', 'success', setPrefsMsg),
        onError: (err) => toast(err.message ?? 'Failed', 'error', setPrefsMsg),
      },
    );
  }

  // ── Notifications save
  function handleSaveNotifs() {
    updateNotifs.mutate(
      { email: emailNotifs, sms: smsNotifs },
      {
        onSuccess: () => toast('Notification preferences saved.', 'success', setNotifMsg),
        onError: (err) => toast(err.message ?? 'Failed', 'error', setNotifMsg),
      },
    );
  }

  const sec = s => `settings-section${activeSection === s ? ' active' : ''}`;
  const navCls = s => `sidebar-link${activeSection === s ? ' active' : ''}`;

  return (
    <>
      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal-box">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><i className="ph ph-warning text-2xl text-red-600"></i></div>
              <div>
                <div className="font-800 text-lg font-extrabold text-slate-900">Delete Account?</div>
                <div className="text-sm text-slate-500">This action is permanent and cannot be undone.</div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">All your bookings, payment methods, preferences, and loyalty points will be permanently deleted. Please type <strong>DELETE</strong> to confirm.</p>
            <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)} className="field-input mb-4" placeholder="Type DELETE to confirm" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteText(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteText !== 'DELETE' || deleting} className="btn-danger flex-1">
                {deleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add card modal */}
      {showAddCard && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowAddCard(false)}>
          <div className="modal-box">
            <div className="font-extrabold text-lg text-slate-900 mb-1">Add New Card</div>
            <div className="text-sm text-slate-500 mb-5">Card data is tokenized and never stored.</div>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="field-label">Card Number</label>
                <input type="text" maxLength={19} value={cardForm.number} onChange={e => setCardForm(f => ({ ...f, number: e.target.value }))} className="field-input" placeholder="•••• •••• •••• ••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Expiry</label>
                  <input type="text" maxLength={5} value={cardForm.expiry} onChange={e => setCardForm(f => ({ ...f, expiry: e.target.value }))} className="field-input" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="field-label">CVC</label>
                  <input type="text" maxLength={4} value={cardForm.cvc} onChange={e => setCardForm(f => ({ ...f, cvc: e.target.value }))} className="field-input" placeholder="•••" />
                </div>
              </div>
              <div>
                <label className="field-label">Cardholder Name</label>
                <input type="text" value={cardForm.name} onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))} className="field-input" placeholder="Full name on card" />
              </div>
              {cardMsg.text && <p className={`text-sm ${cardMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{cardMsg.text}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowAddCard(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100 h-[64px] flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-9 w-auto" /></a>
          </div>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <a href="/" className="hover:text-green-600 transition-colors">Flights</a>
            <a href="/stays" className="hover:text-green-600 transition-colors">Stays</a>
            <a href="/my-bookings" className="hover:text-green-600 transition-colors">My Bookings</a>
          </nav>
          <HeaderAuthCluster className="shrink-0" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex gap-6 items-start">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 lg:sticky lg:top-[80px]">
          <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-slate-100">
              <img src={avatarSrc || `https://ui-avatars.com/api/?name=User&background=dcfce7&color=15803d&size=80`} className="w-10 h-10 rounded-full object-cover border-2 border-green-500" alt="avatar" />
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-slate-800 truncate">{user?.name ?? 'My Account'}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email ?? ''}</div>
              </div>
            </div>
            <nav className="space-y-1">
              {[['profile', 'ph-user-circle', 'Profile'], ['security', 'ph-shield-check', 'Security'], ['payments', 'ph-credit-card', 'Payments'], ['preferences', 'ph-airplane', 'Travel Preferences'], ['notifications', 'ph-bell', 'Notifications'], ['rewards', 'ph-star', 'Rewards']].map(([id, icon, label]) => (
                <a key={id} href={accountPath(id)} className={navCls(id)}><i className={`ph ${icon}`}></i> {label}</a>
              ))}
            </nav>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <a href="/" className="sidebar-link text-slate-400"><i className="ph ph-arrow-left"></i> Back to Home</a>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {/* ── PROFILE ── */}
          <section id="section-profile" className={sec('profile')}>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">Profile Information</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your personal details and preferences</p>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Profile Picture</div>
              <div className="settings-card-sub">Upload a photo to personalize your account</div>
              <div className="flex items-center gap-6 flex-wrap">
                <img src={avatarSrc || 'https://ui-avatars.com/api/?name=User&background=dcfce7&color=15803d&size=200'} alt="Your avatar" id="avatar-preview" />
                <div>
                  <label htmlFor="avatar-upload" className="btn-primary cursor-pointer inline-block"><i className="ph ph-upload-simple mr-1"></i> Upload Photo</label>
                  <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <p className="text-xs text-slate-400 mt-2">JPG, PNG or GIF · Max 5 MB</p>
                </div>
              </div>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Personal Details</div>
              <div className="settings-card-sub">Update your name, email, and contact information</div>
              {profileMsg.text && <p className={`text-sm mb-4 ${profileMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{profileMsg.text}</p>}
              <form onSubmit={handleSaveProfile} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="field-label" htmlFor="firstName">First Name</label>
                    <input id="firstName" type="text" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} className="field-input" placeholder="John" required />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="lastName">Last Name</label>
                    <input id="lastName" type="text" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} className="field-input" placeholder="Doe" required />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="email">Email Address</label>
                    <div className="relative">
                      <input id="email" type="email" value={profile.email} className="field-input pr-24 opacity-60 cursor-not-allowed" disabled />
                      {user?.emailVerified && (
                        <span className="verified-badge absolute right-3 top-1/2 -translate-y-1/2"><i className="ph ph-seal-check"></i> Verified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="phone">Phone Number</label>
                    <div className="flex gap-2">
                      <select value={profile.phoneCode} onChange={e => setProfile(p => ({ ...p, phoneCode: e.target.value }))} className="field-input w-28 flex-shrink-0">
                        {[['+1','🇺🇸'],['+44','🇬🇧'],['+91','🇮🇳'],['+971','🇦🇪'],['+966','🇸🇦'],['+234','🇳🇬'],['+254','🇰🇪'],['+27','🇿🇦'],['+20','🇪🇬'],['+49','🇩🇪'],['+33','🇫🇷'],['+86','🇨🇳'],['+81','🇯🇵'],['+55','🇧🇷']].map(([code, flag]) => <option key={code} value={code}>{flag} {code}</option>)}
                      </select>
                      <input id="phone" type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="field-input flex-1" placeholder="(555) 000-0000" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="dob">Date of Birth</label>
                    <input id="dob" type="date" value={profile.dob} onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))} className="field-input" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nationality">Nationality</label>
                    <select id="nationality" value={profile.nationality} onChange={e => setProfile(p => ({ ...p, nationality: e.target.value }))} className="field-input">
                      <option value="">Select country…</option>
                      {['American','British','Canadian','Chinese','French','German','Indian','Japanese','Nigerian','South African','Kenyan','Emirati','Saudi','Brazilian','Australian'].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="language">Preferred Language</label>
                    <select id="language" value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))} className="field-input">
                      <option value="en">English</option><option value="fr">Français</option><option value="de">Deutsch</option><option value="ar">العربية</option><option value="zh">中文</option><option value="es">Español</option><option value="pt">Português</option><option value="ja">日本語</option><option value="hi">हिन्दी</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <button type="submit" className="btn-primary flex items-center gap-2"><i className="ph ph-floppy-disk"></i> Save Changes</button>
                  <button type="button" onClick={() => setProfile(p => ({ ...p, firstName: '', lastName: '' }))} className="btn-secondary">Discard</button>
                </div>
              </form>
            </div>
          </section>

          {/* ── SECURITY ── */}
          <section id="section-security" className={sec('security')}>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">Security Settings</h1>
              <p className="text-slate-500 text-sm mt-1">Keep your account protected</p>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Change Password</div>
              <div className="settings-card-sub">Use a strong, unique password you don't use elsewhere</div>
              {pwdMsg.text && <p className={`text-sm mb-4 ${pwdMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{pwdMsg.text}</p>}
              <form onSubmit={handleChangePassword} noValidate>
                <div className="space-y-4 max-w-md">
                  {[['current', 'Current Password', 'Enter current password'], ['next', 'New Password', 'Min. 8 characters'], ['confirm', 'Confirm New Password', 'Repeat new password']].map(([key, label, ph]) => (
                    <div key={key}>
                      <label className="field-label">{label}</label>
                      <div className="relative">
                        <input type={showPwd[key] ? 'text' : 'password'} value={pwdForm[key] ?? ''} onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))} className="field-input pr-10" placeholder={ph} required />
                        {key !== 'confirm' && (
                          <button type="button" onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <i className={`ph ph-${showPwd[key] ? 'eye-slash' : 'eye'}`}></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn-primary mt-5 flex items-center gap-2"><i className="ph ph-lock-key"></i> Update Password</button>
              </form>
            </div>
            <div className="settings-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="settings-card-header">Two-Factor Authentication</div>
                  <div className="text-sm text-slate-500 mt-1">Add an extra layer of protection using your phone</div>
                  <div className="mt-2 text-xs font-semibold text-slate-400">Status: <span className={tfa ? 'text-green-500' : 'text-red-500'}>{tfa ? 'Enabled' : 'Disabled'}</span></div>
                </div>
                <label className="toggle-wrap mt-1 flex-shrink-0">
                  <input type="checkbox" checked={tfa} onChange={e => setTfa(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {tfa && <div className="mt-4 bg-green-50 rounded-xl p-4 text-sm text-green-800"><i className="ph ph-check-circle mr-1"></i> 2FA enabled via Authenticator App. Scan the QR code in your authenticator to confirm.</div>}
            </div>
            <div className="settings-card border-red-200 bg-red-50/30">
              <div className="settings-card-header text-red-700">Danger Zone</div>
              <div className="settings-card-sub">Irreversible actions — proceed with caution</div>
              <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-white border border-red-200 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800 text-sm">Delete My Account</div>
                  <div className="text-xs text-slate-500 mt-0.5">All data will be permanently removed</div>
                </div>
                <button onClick={() => setShowDeleteModal(true)} className="btn-danger flex items-center gap-2"><i className="ph ph-trash"></i> Delete Account</button>
              </div>
            </div>
          </section>

          {/* ── PAYMENTS ── */}
          <section id="section-payments" className={sec('payments')}>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">Payment Methods</h1>
              <p className="text-slate-500 text-sm mt-1">Manage saved cards. All data is PCI-compliant and tokenized.</p>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Saved Cards</div>
              <div className="settings-card-sub">Select a default card for faster checkout</div>
              {cards.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No cards saved yet.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {cards.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <i className="ph ph-credit-card text-xl text-slate-500"></i>
                        <div>
                          <div className="text-sm font-bold">{c.brand} •••• {c.last4}</div>
                          <div className="text-xs text-slate-400">Expires {c.expiry}</div>
                        </div>
                      </div>
                      <button onClick={() => setCards(prev => prev.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowAddCard(true)} className="btn-primary mt-2 flex items-center gap-2 w-full justify-center"><i className="ph ph-plus"></i> Add New Card</button>
            </div>
            <div className="settings-card">
              <div className="flex items-center gap-3 mb-3">
                <i className="ph ph-shield-check text-2xl text-green-600"></i>
                <div><div className="font-bold text-sm text-slate-800">PCI DSS Compliant</div><div className="text-xs text-slate-500">Your card details are tokenized and never stored on our servers</div></div>
              </div>
              <div className="flex items-center gap-3">
                <i className="ph ph-lock text-2xl text-blue-500"></i>
                <div><div className="font-bold text-sm text-slate-800">SSL Encrypted</div><div className="text-xs text-slate-500">All payment data is protected with 256-bit encryption</div></div>
              </div>
            </div>
          </section>

          {/* ── PREFERENCES ── */}
          <section id="section-preferences" className={sec('preferences')}>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">Travel Preferences</h1>
              <p className="text-slate-500 text-sm mt-1">Personalize your booking experience</p>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Flight Preferences</div>
              <div className="settings-card-sub">These preferences auto-fill during booking</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="field-label">Home Airport (IATA)</label>
                  <input type="text" maxLength={3} value={prefs.homeAirport} onChange={e => setPrefs(p => ({ ...p, homeAirport: e.target.value.toUpperCase() }))} className="field-input uppercase" placeholder="e.g. LHR" />
                </div>
                <div>
                  <label className="field-label">Cabin Class</label>
                  <select value={prefs.cabin} onChange={e => setPrefs(p => ({ ...p, cabin: e.target.value }))} className="field-input">
                    {['Economy', 'Premium Economy', 'Business Class', 'First Class'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Seat Preference</label>
                  <div className="flex gap-3">
                    {[['window', '🪟 Window'], ['aisle', '💺 Aisle'], ['middle', '🔲 Middle']].map(([v, label]) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="seat-pref" value={v} checked={prefs.seat === v} onChange={() => setPrefs(p => ({ ...p, seat: v }))} className="accent-green-600" />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="field-label">Meal Preference</label>
                  <select value={prefs.meal} onChange={e => setPrefs(p => ({ ...p, meal: e.target.value }))} className="field-input">
                    {['Standard', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'No Preference'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Preferred Airlines</div>
              <div className="settings-card-sub">Click to select your favourite airlines</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {AIRLINES.map(a => (
                  <button key={a} type="button"
                    onClick={() => setSelectedAirlines(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedAirlines.includes(a) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            {prefsMsg.text && <p className={`text-sm mb-2 ${prefsMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{prefsMsg.text}</p>}
            <button onClick={handleSavePrefs} className="btn-primary flex items-center gap-2 mt-2"><i className="ph ph-floppy-disk"></i> Save Preferences</button>
          </section>

          {/* ── NOTIFICATIONS ── */}
          <section id="section-notifications" className={sec('notifications')}>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">Notification Settings</h1>
              <p className="text-slate-500 text-sm mt-1">Choose what updates you'd like to receive</p>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Email Notifications</div>
              <div className="settings-card-sub">Manage emails sent to your registered email address</div>
              <div className="space-y-1 mt-4">
                <NotifRow label="Booking Confirmations" desc="Receive email for every booking" checked={emailNotifs.bookingConfirm} onChange={v => setEmailNotifs(n => ({ ...n, bookingConfirm: v }))} />
                <NotifRow label="Flight Updates" desc="Gate changes, delays, cancellations" checked={emailNotifs.flightUpdates} onChange={v => setEmailNotifs(n => ({ ...n, flightUpdates: v }))} />
                <NotifRow label="Deals & Promotions" desc="Personalized offers and price alerts" checked={emailNotifs.deals} onChange={v => setEmailNotifs(n => ({ ...n, deals: v }))} />
                <NotifRow label="Newsletter" desc="Weekly travel inspiration and tips" checked={emailNotifs.newsletter} onChange={v => setEmailNotifs(n => ({ ...n, newsletter: v }))} />
              </div>
            </div>
            <div className="settings-card mt-4">
              <div className="settings-card-header">SMS & Push Notifications</div>
              <div className="settings-card-sub">Manage mobile alerts and push notifications</div>
              <div className="space-y-1 mt-4">
                <NotifRow label="Boarding Alerts" desc="Reminder 24h before departure" checked={smsNotifs.boardingAlert} onChange={v => setSmsNotifs(n => ({ ...n, boardingAlert: v }))} />
                <NotifRow label="Flight Delay Alerts" desc="Real-time delay notifications" checked={smsNotifs.flightDelay} onChange={v => setSmsNotifs(n => ({ ...n, flightDelay: v }))} />
                <NotifRow label="Promotional SMS" desc="Special offers via text message" checked={smsNotifs.promos} onChange={v => setSmsNotifs(n => ({ ...n, promos: v }))} />
              </div>
            </div>
            {notifMsg.text && <p className={`text-sm mb-2 ${notifMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{notifMsg.text}</p>}
            <button onClick={handleSaveNotifs} className="btn-primary flex items-center gap-2 mt-2"><i className="ph ph-floppy-disk"></i> Save Preferences</button>
          </section>

          {/* ── REWARDS ── */}
          <section id="section-rewards" className={sec('rewards')}>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">Rewards & Loyalty</h1>
              <p className="text-slate-500 text-sm mt-1">Your TravelPoints membership overview</p>
            </div>
            <div className="rounded-2xl p-6 mb-5" style={{ background: 'linear-gradient(135deg, #14532d 0%, #16a34a 60%, #4ade80 100%)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-green-200 text-xs font-bold uppercase tracking-widest mb-1">TravelPoints</div>
                  <div className="text-white text-2xl font-extrabold">Gold Member</div>
                </div>
                <i className="ph ph-star text-5xl text-yellow-300 opacity-80"></i>
              </div>
              <div className="text-white/80 text-sm mb-1">Available Points</div>
              <div className="text-white text-4xl font-extrabold tracking-tight">12,450</div>
              <div className="text-white/60 text-xs mt-1">≈ $124.50 in travel credits</div>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Progress to Platinum</div>
              <div className="settings-card-sub">Earn <span className="font-bold text-green-600">7,550 more points</span> to reach Platinum status</div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Gold — 12,450 pts</span><span>Platinum — 20,000 pts</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '62.3%' }}></div></div>
              <div className="text-right text-xs text-slate-400 mt-1">62.3% complete</div>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">Your Gold Member Benefits</div>
              <div className="settings-card-sub">Exclusive perks included with your membership</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[['ph-briefcase','Priority Boarding','Skip the queue at the gate'],['ph-seat','Free Seat Selection','Choose your seat at no cost'],['ph-percent','10% Points Bonus','Earn extra on every trip'],['ph-headset','Priority Support','Dedicated customer service line']].map(([icon, title, desc]) => (
                  <div key={title} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <i className={`ph ${icon} text-2xl text-green-600`}></i>
                    <div><div className="font-bold text-sm">{title}</div><div className="text-xs text-slate-500">{desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer className="bg-white border-t border-slate-100 pt-10 pb-6 mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
          <div>&copy; 2026 BookingCart. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-slate-600">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  );
}
