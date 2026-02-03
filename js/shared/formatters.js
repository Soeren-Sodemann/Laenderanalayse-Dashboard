// Zahlen-Formatierer
export function formatNumber(n, locale) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}
// Prozent-Formatierer
export function formatPercent(n, locale) {
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(n);

  return `${formatted}%`;
}
