'use client';
import { useCallback, useEffect, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SearchParams {
  from: string;       // e.g. "London Heathrow (LHR)"
  to: string;         // e.g. "Dubai (DXB)"
  depart: string;     // YYYY-MM-DD
  return?: string;    // YYYY-MM-DD — only for round trips
  cabin: string;      // Economy | Premium | Business | First
  tripType: 'round' | 'oneway';
}

export interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

export interface BookingState {
  search: SearchParams | null;
  passengers: Passengers;
  selectedFlight: Record<string, unknown> | null;
  passengerDetails: Array<Record<string, unknown>>;
  contact: { name: string; email: string; phone: string };
  extras: Array<{ id: string; label: string; price: number; icon?: string; desc?: string }>;
  bookingRef: string | null;
  paymentIntentId: string | null;
}

const STORAGE_KEY = 'bookingcart_flights_v1';

const DEFAULT_STATE: BookingState = {
  search: null,
  passengers: { adults: 1, children: 0, infants: 0 },
  selectedFlight: null,
  passengerDetails: [],
  contact: { name: '', email: '', phone: '' },
  extras: [],
  bookingRef: null,
  paymentIntentId: null,
};

function readStorage(): BookingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function writeStorage(state: BookingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useBookingState() {
  const [state, setStateRaw] = useState<BookingState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    setStateRaw(readStorage());
    setHydrated(true);
  }, []);

  const setState = useCallback((patch: Partial<BookingState>) => {
    setStateRaw((prev) => {
      const next = { ...prev, ...patch };
      writeStorage(next);
      return next;
    });
  }, []);

  const resetBooking = useCallback(() => {
    setState({ selectedFlight: null, passengerDetails: [], extras: [], bookingRef: null, paymentIntentId: null });
  }, [setState]);

  return { state, setState, resetBooking, hydrated };
}

// ── Standalone helpers (usable without the hook) ─────────────────────────────

export function getBookingState(): BookingState {
  return readStorage();
}

export function setBookingState(patch: Partial<BookingState>) {
  const next = { ...readStorage(), ...patch };
  writeStorage(next);
  return next;
}

// ── Utility ──────────────────────────────────────────────────────────────────

/** Extract IATA code from a string like "London Heathrow (LHR)" → "LHR" */
export function extractIata(value: string): string {
  if (!value) return '';
  const m = value.toUpperCase().match(/\(([A-Z]{3})\)\s*$/);
  if (m) return m[1];
  const m2 = value.toUpperCase().match(/\b([A-Z]{3})\b/);
  return m2 ? m2[1] : '';
}

/** Parse an ISO 8601 duration string (e.g. "PT5H30M") or a plain number of minutes into total minutes */
export function parseDurationMinutes(value: string | number): number {
  if (typeof value === 'number') return value;
  const m = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0', 10) * 60) + parseInt(m[2] ?? '0', 10);
}

/** Format a Duffel duration value (ISO 8601 string or minutes number) to "2h 30m" */
export function formatDuration(value: string | number): string {
  const total = parseDurationMinutes(value);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Format money amount */
export function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
