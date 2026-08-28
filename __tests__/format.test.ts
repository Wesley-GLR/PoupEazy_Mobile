import { ApiError } from '@/api/client';
import {
  daysUntil,
  formatCurrency,
  formatDate,
  getErrorMessage,
  isInDateRange,
  moneyToNumber,
  parseMoneyInput,
  todayDateOnly,
} from '@/utils/format';

describe('format utilities', () => {
  describe('money values', () => {
    test.each([
      [125.5, 125.5],
      ['125.50', 125.5],
      [null, 0],
      [undefined, 0],
      ['valor-invalido', 0],
    ])('moneyToNumber(%p) returns %p', (input, expected) => {
      expect(moneyToNumber(input)).toBe(expected);
    });

    test('formats values as Brazilian reais', () => {
      expect(formatCurrency(1234.56).replace(/\s/g, ' ')).toBe('R$ 1.234,56');
      expect(formatCurrency(undefined).replace(/\s/g, ' ')).toBe('R$ 0,00');
    });

    test.each([
      ['0,01', 0.01],
      ['0.01', 0.01],
      ['1.234,56', 1234.56],
      ['1,234.56', 1234.56],
      ['1.234', 1234],
      [' -15,90 ', -15.9],
    ])('parseMoneyInput(%p) returns %p', (input, expected) => {
      expect(parseMoneyInput(input)).toBe(expected);
    });

    test('returns NaN for an invalid money input', () => {
      expect(parseMoneyInput('sem valor')).toBeNaN();
    });
  });

  describe('dates', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 7, 26, 12));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('formats a date-only value without applying a timezone offset', () => {
      expect(formatDate('2026-08-05')).toBe('05/08/2026');
      expect(formatDate('data-invalida')).toBe('data-invalida');
    });

    test('returns today in the API date-only format', () => {
      expect(todayDateOnly()).toBe('2026-08-26');
    });

    test('checks inclusive date ranges using the date-only portion', () => {
      expect(isInDateRange('2026-08-01T23:59:00Z', '2026-08-01', '2026-08-31')).toBe(true);
      expect(isInDateRange('2026-09-01', '2026-08-01', '2026-08-31')).toBe(false);
    });

    test('calculates whole calendar days from today', () => {
      expect(daysUntil('2026-08-29')).toBe(3);
      expect(daysUntil('2026-08-25')).toBe(-1);
    });
  });

  describe('errors', () => {
    test('uses the API message when available', () => {
      expect(getErrorMessage(new ApiError(422, 'Valor inválido', 'VALIDATION_ERROR'))).toBe('Valor inválido');
    });

    test('falls back safely for unknown values', () => {
      expect(getErrorMessage(new Error('Falha local'))).toBe('Falha local');
      expect(getErrorMessage({ motivo: 'desconhecido' }, 'Tente novamente')).toBe('Tente novamente');
    });
  });
});
