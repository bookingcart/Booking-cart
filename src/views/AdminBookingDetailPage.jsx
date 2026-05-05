'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

const STATUS_COLORS = {
  new:           'bg-amber-100 text-amber-700',
  pending:       'bg-yellow-100 text-yellow-700',
  confirmed:     'bg-green-100 text-green-700',
  ticket_issued: 'bg-purple-100 text-purple-700',
  cancelled:     'bg-red-100 text-red-700',
  refunded:      'bg-orange-100 text-orange-700',
  completed:     'bg-slate-100 text-slate-600',
};

const STATUS_LABELS = {
  new:           'Pending',
  confirmed:     'Confirmed',
  ticket_issued: 'Ticket Issued',
  cancelled:     'Cancelled',
  refunded:      'Refunded',
  completed:     'Completed',
};

const STATUSES = ['new', 'pending', 'confirmed', 'ticket_issued', 'completed', 'cancelled', 'refunded'];

export default function AdminBookingDetailPage({ id }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data, isLoading: loading, error: queryError } = trpc.bookings.getById.useQuery({ id });
  const booking = data?.booking ?? null;

  const [status, setStatus] = useState('');
  const [ticketForm, setTicketForm] = useState({ url: '', number: '', airline: '' });
  const [ticketFile, setTicketFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateStatus = trpc.bookings.updateStatus.useMutation();
  const deleteBooking = trpc.bookings.delete.useMutation();

  useEffect(() => {
    if (booking) {
      document.title = `Booking ${booking.ref} | Admin | BookingCart`;
      setStatus(booking.status ?? 'new');
      setTicketForm({
        url: booking.ticketUrl ?? '',
        number: booking.ticketNumber ?? '',
        airline: booking.ticketAirline ?? '',
      });
    }
  }, [booking?.id]);

  async function handleStatusUpdate() {
    setError(''); setSuccess('');
    try {
      await updateStatus.mutateAsync({ id, status });
      await utils.bookings.getById.invalidate({ id });
      setSuccess('Status updated.');
    } catch (err) {
      setError(err?.message ?? 'Update failed');
    }
  }

  async function handleUploadTicket() {
    setSaving(true); setUploading(false); setError(''); setSuccess('');
    try {
      let ticketUrl = ticketForm.url;
      if (ticketFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('file', ticketFile);
        fd.append('bookingId', id);
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const upData = await upRes.json();
        setUploading(false);
        if (!upData.ok) { setError(upData.error ?? 'Upload failed'); setSaving(false); return; }
        ticketUrl = upData.url;
      }
      await updateStatus.mutateAsync({
        id,
        status: 'ticket_issued',
        ticketUrl,
        ticketNumber: ticketForm.number,
        ticketAirline: ticketForm.airline,
      });
      await utils.bookings.getById.invalidate({ id });
      setTicketFile(null);
      setSuccess('Ticket issued successfully.');
    } catch {
      setError('Upload error — check your connection');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this booking permanently? This cannot be undone.')) return;
    try {
      await deleteBooking.mutateAsync({ id });
      router.push('/admin/bookings');
    } catch (err) {
      setError(err?.message ?? 'Delete failed');
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <i className="ph ph-circle-notch animate-spin text-3xl block mb-2" />
        Loading booking…
      </div>
    );
  }

  if (queryError || !booking) {
    return (
      <div className="p-8 text-center">
        <i className="ph ph-warning text-3xl text-red-400 block mb-2" />
        <p className="text-red-600 font-medium">{queryError?.message ?? 'Booking not found.'}</p>
        <button onClick={() => router.push('/admin/bookings')} className="mt-4 text-sm text-green-600 hover:underline">
          ← Back to bookings
        </button>
      </div>
    );
  }

  const contact = booking.contact ?? {};
  const passengers = Array.isArray(booking.passengers) ? booking.passengers : [];
  const flight = booking.flight ?? null;
  const slices = flight?.slices ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/admin/bookings')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <i className="ph ph-arrow-left" /> Back to bookings
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-widest">{booking.ref}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[booking.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {STATUS_LABELS[booking.status] ?? booking.status}
        </span>
        <div className="ml-auto text-2xl font-extrabold text-green-600">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency ?? 'USD' }).format(Number(booking.total ?? 0) / 100)}
        </div>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}
      {success && <p className="text-green-700 bg-green-50 rounded-xl px-4 py-3 mb-4 text-sm">{success}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Booking overview */}
          <Card title="Booking Details">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Field label="Reference"><span className="font-mono font-bold tracking-widest">{booking.ref}</span></Field>
              <Field label="Type"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(booking.bookingType ?? 'flight') === 'stay' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{booking.bookingType ?? 'flight'}</span></Field>
              <Field label="Route">{booking.route ?? '—'}</Field>
              <Field label="Cabin">{booking.cabin ?? 'Economy'}</Field>
              <Field label="Departure">{booking.dates?.depart ? new Date(booking.dates.depart).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</Field>
              {booking.dates?.return && <Field label="Return">{new Date(booking.dates.return).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</Field>}
              <Field label="Booked">{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '—'}</Field>
              {booking.paymentIntentId && <Field label="Payment ID"><span className="font-mono text-xs break-all">{booking.paymentIntentId}</span></Field>}
              {booking.ticketNumber && <Field label="Ticket #"><span className="font-mono font-bold">{booking.ticketNumber}</span></Field>}
              {booking.ticketAirline && <Field label="Ticket Airline">{booking.ticketAirline}</Field>}
              {booking.ticketUrl && (
                <Field label="Ticket File">
                  <a href={booking.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-xs">
                    Download / View
                  </a>
                </Field>
              )}
            </div>
          </Card>

          {/* Contact */}
          <Card title="Contact Information">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {contact.name  && <Field label="Name">{contact.name}</Field>}
              {contact.email && <Field label="Email"><a href={`mailto:${contact.email}`} className="text-green-600 hover:underline">{contact.email}</a></Field>}
              {contact.phone && <Field label="Phone">{contact.phone}</Field>}
              {booking.userId && <Field label="Account ID"><span className="font-mono text-xs">{booking.userId}</span></Field>}
            </div>
          </Card>

          {/* Passengers */}
          {passengers.length > 0 && (
            <Card title={`Passengers (${passengers.length})`}>
              <div className="space-y-3">
                {passengers.map((p, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl px-4 py-3 grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                    <div className="col-span-2 font-semibold text-slate-900">
                      {p.firstName ?? p.first_name ?? ''} {p.lastName ?? p.last_name ?? ''}
                      {(p.type ?? p.passengerType) && (
                        <span className="ml-2 text-xs font-normal text-slate-400">({p.type ?? p.passengerType})</span>
                      )}
                    </div>
                    {(p.passport ?? p.passportNumber ?? p.documentNumber) && (
                      <Field label="Passport">{p.passport ?? p.passportNumber ?? p.documentNumber}</Field>
                    )}
                    {(p.nationality ?? p.country) && <Field label="Nationality">{p.nationality ?? p.country}</Field>}
                    {(p.dob ?? p.dateOfBirth ?? p.date_of_birth) && (
                      <Field label="Date of Birth">{p.dob ?? p.dateOfBirth ?? p.date_of_birth}</Field>
                    )}
                    {(p.passportExpiry ?? p.expiryDate ?? p.expiry) && (
                      <Field label="Passport Expiry">{p.passportExpiry ?? p.expiryDate ?? p.expiry}</Field>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Flight segments */}
          {slices.length > 0 && (
            <Card title="Flight Segments">
              <div className="space-y-4">
                {slices.map((slice, si) => {
                  const segments = slice?.segments ?? [];
                  return (
                    <div key={si}>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {si === 0 ? 'Outbound' : 'Return'} — {segments.length} segment{segments.length !== 1 ? 's' : ''}
                      </p>
                      {segments.map((seg, gi) => {
                        const from   = seg?.origin?.iata_code ?? seg?.departure?.iataCode ?? seg?.from ?? '—';
                        const to     = seg?.destination?.iata_code ?? seg?.arrival?.iataCode ?? seg?.to ?? '—';
                        const dep    = seg?.departing_at ?? seg?.departure?.at ?? '';
                        const arr    = seg?.arriving_at ?? seg?.arrival?.at ?? '';
                        const carrier = seg?.marketing_carrier?.name ?? seg?.carrierCode ?? '';
                        const flightNo = seg?.marketing_carrier_flight_number ?? seg?.number ?? '';
                        return (
                          <div key={gi} className="bg-slate-50 rounded-xl px-4 py-3 text-sm flex items-center gap-6">
                            <div className="text-center shrink-0">
                              <div className="text-xl font-bold text-slate-900">{dep ? dep.slice(11, 16) : '—'}</div>
                              <div className="text-xs font-bold text-slate-500">{from}</div>
                              {dep && <div className="text-xs text-slate-400">{new Date(dep).toLocaleDateString()}</div>}
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="text-xs font-medium text-slate-400">{carrier}{flightNo ? ` · ${flightNo}` : ''}</div>
                              <div className="w-full flex items-center gap-1">
                                <div className="h-px flex-1 bg-slate-300" />
                                <i className="ph ph-airplane-tilt text-slate-400 text-xs" />
                                <div className="h-px flex-1 bg-slate-300" />
                              </div>
                            </div>
                            <div className="text-center shrink-0">
                              <div className="text-xl font-bold text-slate-900">{arr ? arr.slice(11, 16) : '—'}</div>
                              <div className="text-xs font-bold text-slate-500">{to}</div>
                              {arr && <div className="text-xs text-slate-400">{new Date(arr).toLocaleDateString()}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right column — actions */}
        <div className="space-y-5">
          {/* Status */}
          <Card title="Update Status">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 focus:ring-2 focus:ring-green-500 focus:outline-none mb-3"
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] ?? s.replace('_', ' ')}</option>)}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={updateStatus.isPending}
              className="w-full bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              {updateStatus.isPending ? 'Saving…' : 'Save Status'}
            </button>
          </Card>

          {/* Ticket upload */}
          <Card title="Issue Ticket">
            <div className="space-y-2.5">
              <input
                value={ticketForm.airline}
                onChange={e => setTicketForm(p => ({ ...p, airline: e.target.value }))}
                placeholder="Airline name"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                value={ticketForm.number}
                onChange={e => setTicketForm(p => ({ ...p, number: e.target.value }))}
                placeholder="Ticket number"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <label className="flex items-center gap-2 w-full cursor-pointer border border-dashed border-slate-300 rounded-xl px-3 py-2.5 hover:border-purple-400 transition-colors">
                <i className="ph ph-paperclip text-slate-400" />
                <span className="text-slate-500 text-sm truncate">
                  {ticketFile ? ticketFile.name : (ticketForm.url ? 'Replace file…' : 'Choose ticket file (PDF/image)')}
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setTicketFile(f); }}
                />
              </label>
              {ticketForm.url && !ticketFile && (
                <a href={ticketForm.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline block truncate">
                  Current ticket: {ticketForm.url}
                </a>
              )}
              <button
                disabled={saving || uploading || (!ticketFile && !ticketForm.url)}
                onClick={handleUploadTicket}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Issue Ticket'}
              </button>
            </div>
          </Card>

          {/* Danger zone */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Danger Zone</p>
            <button
              onClick={handleDelete}
              disabled={deleteBooking.isPending}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              {deleteBooking.isPending ? 'Deleting…' : 'Delete Booking Permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-slate-800 text-sm leading-snug">{children}</div>
    </div>
  );
}
