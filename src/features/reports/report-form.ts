import { z } from 'zod';

export function calendarDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 2000 || year > 2100) return null;
  const timestamp = Date.UTC(year, month - 1, day);
  return new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
}

export const reportRequestSchema = z.object({
  data_inicio: z.string().refine((value) => calendarDay(value) !== null, 'Escolha uma data válida entre 2000 e 2100.'),
  data_fim: z.string().refine((value) => calendarDay(value) !== null, 'Escolha uma data válida entre 2000 e 2100.'),
  secoes: z.array(z.enum(['resumo', 'transacoes', 'categorias', 'orcamentos', 'metas']))
    .min(1, 'Selecione pelo menos uma seção.').refine((items) => new Set(items).size === items.length, 'Não repita seções.'),
  formatos: z.array(z.enum(['pdf', 'csv']))
    .min(1, 'Selecione pelo menos um formato.').refine((items) => new Set(items).size === items.length, 'Não repita formatos.'),
}).strict().superRefine((values, context) => {
  const start = calendarDay(values.data_inicio);
  const end = calendarDay(values.data_fim);
  if (start === null || end === null) return;
  if (end < start) context.addIssue({ code: 'custom', path: ['data_fim'], message: 'A data final deve ser igual ou posterior à inicial.' });
  else if ((end - start) / 86_400_000 + 1 > 366) context.addIssue({ code: 'custom', path: ['data_fim'], message: 'Selecione um período de até 366 dias, incluindo início e fim.' });
});
