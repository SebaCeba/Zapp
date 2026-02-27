import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const STORAGE_KEY = 'zapps:yearMonth';
const DEFAULT_YEAR = new Date().getFullYear();
const DEFAULT_MONTH = new Date().getMonth() + 1;

interface YearMonthState {
  year: number;
  month: number;
}

export function useYearMonth() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state
  const [state, setState] = useState<YearMonthState>(() => {
    // 1. URL Query Params
    const queryYear = searchParams.get('year');
    const queryMonth = searchParams.get('month');
    
    if (queryYear && queryMonth) {
      const year = parseInt(queryYear);
      const month = parseInt(queryMonth);
      if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        return { year, month };
      }
    }

    // 2. Local Storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.year && parsed.month) {
          return { year: parsed.year, month: parsed.month };
        }
      }
    } catch (e) {
      console.error('Error reading yearMonth from localStorage', e);
    }

    // 3. Defaults
    return { year: DEFAULT_YEAR, month: DEFAULT_MONTH };
  });

  // Sync mechanisms
  useEffect(() => {
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Update URL without reload
    const newParams = new URLSearchParams(searchParams);
    newParams.set('year', state.year.toString());
    newParams.set('month', state.month.toString());
    setSearchParams(newParams, { replace: true });
  }, [state, setSearchParams]); // Don't include searchParams in deps usually to avoid loops, but here we set it.

  // Setters
  const setYear = useCallback((year: number) => {
    setState(prev => ({ ...prev, year }));
  }, []);

  const setMonth = useCallback((month: number) => {
    setState(prev => ({ ...prev, month }));
  }, []);

  const setYearMonth = useCallback((year: number, month: number) => {
    setState({ year, month });
  }, []);

  return {
    year: state.year,
    month: state.month,
    setYear,
    setMonth,
    setYearMonth
  };
}
