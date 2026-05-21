const countFormatter = new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 });

/** Thousands + grouping identical on server and client (avoids hydration mismatches). */
export function formatCount(value: number): string {
  return countFormatter.format(value);
}
