const numberFormatter = new Intl.NumberFormat("ar-SA", {
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("ar-SA", {
  style: "percent",
  maximumFractionDigits: 1,
});

const compactNumberFormatter = new Intl.NumberFormat("ar-SA", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatCurrency(minorUnits: number) {
  return currencyFormatter.format(minorUnits / 100);
}

export function formatPercent(decimal: number) {
  return percentFormatter.format(decimal);
}

export function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
