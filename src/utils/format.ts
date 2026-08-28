import { ApiError } from '@/api/client';
import type { MoneyValue } from '@/types/api';

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

export function moneyToNumber(value: MoneyValue | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: MoneyValue | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(moneyToNumber(value));
}

export function parseMoneyInput(value: string): number {
  const sanitized = value.trim().replace(/\s/g, '').replace(/[^\d,.-]/g, '');
  const sign = sanitized.startsWith('-') ? '-' : '';
  const numeric = sanitized.replace(/-/g, '');
  const lastComma = numeric.lastIndexOf(',');
  const lastDot = numeric.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);

  if (!numeric || !/[0-9]/.test(numeric)) return Number.NaN;

  let normalized: string;
  if (lastComma >= 0 && lastDot >= 0) {
    const integer = numeric.slice(0, decimalIndex).replace(/[.,]/g, '') || '0';
    const fraction = numeric.slice(decimalIndex + 1).replace(/[.,]/g, '');
    normalized = fraction ? `${integer}.${fraction}` : integer;
  } else if (decimalIndex >= 0) {
    const fraction = numeric.slice(decimalIndex + 1).replace(/[.,]/g, '');
    const hasDecimalFraction = fraction.length > 0 && fraction.length <= 2;

    if (hasDecimalFraction) {
      const integer = numeric.slice(0, decimalIndex).replace(/[.,]/g, '') || '0';
      normalized = `${integer}.${fraction}`;
    } else {
      normalized = numeric.replace(/[.,]/g, '');
    }
  } else {
    normalized = numeric;
  }

  const parsed = Number(`${sign}${normalized}`);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
}

export function todayDateOnly(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function getErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isInDateRange(value: string, start: string, end: string): boolean {
  const date = value.slice(0, 10);
  return date >= start && date <= end;
}

export function daysUntil(value: string): number {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}
