import { calendarDay, reportRequestSchema } from '@/features/reports/report-form';

const request = { data_inicio: '2024-01-01', data_fim: '2024-12-31', secoes: ['resumo'], formatos: ['pdf'] };

describe('Período e módulos do relatório', () => {
  test.each(['1999-12-31', '2101-01-01', '2026-02-30', '2026-13-01', '2026-00-10', '2026-11-00', '2026-2-01'])('rejeita a data inválida %s', (value) => {
    expect(calendarDay(value)).toBeNull();
  });

  test('aceita dia único, ano bissexto e 366 dias inclusivos', () => {
    expect(calendarDay('2024-02-29')).not.toBeNull();
    expect(reportRequestSchema.safeParse(request).success).toBe(true);
    expect(reportRequestSchema.safeParse({ ...request, data_inicio: '2100-12-31', data_fim: '2100-12-31' }).success).toBe(true);
  });

  test('rejeita intervalo invertido, 367 dias e dia bissexto inexistente', () => {
    expect(reportRequestSchema.safeParse({ ...request, data_fim: '2025-01-01' }).success).toBe(false);
    expect(reportRequestSchema.safeParse({ ...request, data_inicio: '2025-01-01' }).success).toBe(false);
    expect(calendarDay('2100-02-29')).toBeNull();
  });

  test.each([
    { secoes: [] }, { formatos: [] }, { secoes: ['resumo', 'resumo'] },
    { formatos: ['pdf', 'pdf'] }, { secoes: ['outro'] }, { formatos: ['xlsx'] }, { destinatario: 'outra@example.com' },
  ])('rejeita escolhas inválidas ou chaves extras %j', (changes) => {
    expect(reportRequestSchema.safeParse({ ...request, ...changes }).success).toBe(false);
  });
});
