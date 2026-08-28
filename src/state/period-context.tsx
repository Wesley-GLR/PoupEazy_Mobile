import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { MONTH_NAMES } from '@/utils/format';

type PeriodMode = 'month' | 'custom';

type PeriodContextValue = {
  mode: PeriodMode;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  label: string;
  previousMonth: () => void;
  nextMonth: () => void;
  goToCurrentMonth: () => void;
  setCustomPeriod: (startDate: string, endDate: string) => void;
};

const PeriodContext = createContext<PeriodContextValue | null>(null);

function dateOnly(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function PeriodProvider({ children }: PropsWithChildren) {
  const now = new Date();
  const [mode, setMode] = useState<PeriodMode>('month');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [custom, setCustom] = useState({ startDate: '', endDate: '' });

  const monthlyStart = dateOnly(year, month, 1);
  const monthlyEnd = dateOnly(year, month, new Date(year, month, 0).getDate());
  const startDate = mode === 'month' ? monthlyStart : custom.startDate;
  const endDate = mode === 'month' ? monthlyEnd : custom.endDate;

  const value: PeriodContextValue = {
    mode,
    month,
    year,
    startDate,
    endDate,
    label: mode === 'month' ? `${MONTH_NAMES[month - 1]} de ${year}` : `${custom.startDate} a ${custom.endDate}`,
    previousMonth() {
      setMode('month');
      if (month === 1) { setMonth(12); setYear((value) => value - 1); }
      else setMonth((value) => value - 1);
    },
    nextMonth() {
      setMode('month');
      if (month === 12) { setMonth(1); setYear((value) => value + 1); }
      else setMonth((value) => value + 1);
    },
    goToCurrentMonth() {
      const date = new Date();
      setMode('month');
      setMonth(date.getMonth() + 1);
      setYear(date.getFullYear());
    },
    setCustomPeriod(customStart, customEnd) {
      setCustom({ startDate: customStart, endDate: customEnd });
      setMode('custom');
    },
  };

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const value = useContext(PeriodContext);
  if (!value) throw new Error('usePeriod deve ser usado dentro de PeriodProvider.');
  return value;
}
