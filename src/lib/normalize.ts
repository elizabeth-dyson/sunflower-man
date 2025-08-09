// lib/normalize.ts
export const toTrimmedString = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();

export const uniqSortedStrings = (vals: unknown[] | null | undefined): string[] => {
  const set = new Set<string>();
  for (const v of vals ?? []) {
    const s = toTrimmedString(v);
    if (s) set.add(s);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};