export const FRESH_GREEN = "#3f8f5c";
export const FRESH_AMBER = "#d99a2b";
export const FRESH_RED = "#c1452e";

export function freshColor(freshness: number): string {
  if (freshness >= 60) return FRESH_GREEN;
  if (freshness >= 30) return FRESH_AMBER;
  return FRESH_RED;
}

export function daysLabel(days: number): string {
  return days <= 1 ? "Today" : `${days}d left`;
}
