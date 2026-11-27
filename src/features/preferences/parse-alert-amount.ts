// Separado do parser permissivo dos formulários antigos para não reinterpretar
// casas decimais extras como milhares (por exemplo, "1,234").
export function parseAlertAmount(value: string): number {
  const text = value.trim();
  const plainComma = /^\d+(?:,\d{1,2})?$/;
  const groupedBrazilian = /^[1-9]\d{0,2}(?:\.\d{3})+,\d{1,2}$/;
  const plainDot = /^\d+\.\d{1,2}$/;
  let normalized: string;
  if (plainComma.test(text)) normalized = text.replace(',', '.');
  else if (groupedBrazilian.test(text)) normalized = text.replace(/\./g, '').replace(',', '.');
  else if (plainDot.test(text)) normalized = text;
  else return Number.NaN;

  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 1 && cents <= 999_999_999_999
    ? cents / 100
    : Number.NaN;
}
