'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';

export interface AirportSuggestion {
  city: string;
  name: string;
  code: string;
  country: string;
  label: string; // e.g. "London Heathrow (LHR)"
}

export function useAirportSearch(initialValue = '') {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestKeyword = useRef('');
  const utils = trpc.useUtils();

  const search = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    latestKeyword.current = keyword;
    setIsLoading(true);
    try {
      const data = await utils.airports.duffel.fetch({ keyword });
      // Ignore stale results
      if (keyword !== latestKeyword.current) return;
      const raw = data.airports ?? [];
      const mapped: AirportSuggestion[] = raw.slice(0, 8).map((a) => ({
        city: a.city || a.name,
        name: a.name,
        code: a.code,
        country: a.country ?? '',
        label: `${a.city || a.name} (${a.code})`,
      }));
      setSuggestions(mapped);
      setIsOpen(mapped.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [utils]);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(value), 250);
    },
    [search],
  );

  const selectSuggestion = useCallback((s: AirportSuggestion) => {
    setQuery(s.label);
    setSuggestions([]);
    setIsOpen(false);
  }, []);

  const close = useCallback(() => {
    setSuggestions([]);
    setIsOpen(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { query, setQuery, handleChange, suggestions, isOpen, isLoading, selectSuggestion, close };
}
