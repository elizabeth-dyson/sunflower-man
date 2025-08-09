// lib/notionSafe.ts
import { Client } from '@notionhq/client';

/** Minimal Notion prop types that we actually use */
type Text = { plain_text: string };
type TitleProp = { type: 'title'; title: Text[] };
type RichTextProp = { type: 'rich_text'; rich_text: Text[] };
type DateProp = { type: 'date'; date: { start: string | null } | null };
type SelectLike = { name: string };
type SelectProp = { type: 'select'; select: SelectLike | null };
type StatusProp = { type: 'status'; status: SelectLike | null };
type NumberProp = { type: 'number'; number: number | null };
type UrlProp = { type: 'url'; url: string | null };

type RollupArrayItem =
  | { type: 'title'; title: Text[] }
  | { type: 'rich_text'; rich_text: Text[] }
  | { type: 'number'; number: number | null }
  | { type: 'url'; url: string | null };

type RollupProp =
  | { type: 'rollup'; rollup: { type: 'array'; array: RollupArrayItem[] } }
  | { type: 'rollup'; rollup: { type: 'number'; number: number | null } }
  | { type: 'rollup'; rollup: { type: 'date'; date: { start: string | null } | null } };

export type NotionPage = {
  id: string;
  url: string;
  properties: Record<string, unknown>;
};

/** Type guards */
function isTitle(p: unknown): p is TitleProp {
  return typeof p === 'object' && p !== null && (p as any).type === 'title';
}
function isRichText(p: unknown): p is RichTextProp {
  return typeof p === 'object' && p !== null && (p as any).type === 'rich_text';
}
function isDate(p: unknown): p is DateProp {
  return typeof p === 'object' && p !== null && (p as any).type === 'date';
}
function isSelect(p: unknown): p is SelectProp {
  return typeof p === 'object' && p !== null && (p as any).type === 'select';
}
function isStatus(p: unknown): p is StatusProp {
  return typeof p === 'object' && p !== null && (p as any).type === 'status';
}
function isNumber(p: unknown): p is NumberProp {
  return typeof p === 'object' && p !== null && (p as any).type === 'number';
}
function isUrl(p: unknown): p is UrlProp {
  return typeof p === 'object' && p !== null && (p as any).type === 'url';
}
function isRollup(p: unknown): p is RollupProp {
  return typeof p === 'object' && p !== null && (p as any).type === 'rollup';
}

/** Safe getters (never throw, return sensible defaults) */
export function getTitle(page: NotionPage, name: string): string {
  const prop = page.properties[name];
  if (isTitle(prop)) return (prop.title ?? []).map((t) => t.plain_text).join('').trim();
  return '';
}
export function getRichText(page: NotionPage, name: string): string | null {
  const prop = page.properties[name];
  if (isRichText(prop)) {
    const s = (prop.rich_text ?? []).map((t) => t.plain_text).join(' ').trim();
    return s || null;
  }
  return null;
}
export function getDateStart(page: NotionPage, name: string): string | null {
  const prop = page.properties[name];
  if (isDate(prop)) return prop.date?.start ?? null;
  return null;
}
export function getSelectName(page: NotionPage, name: string): string | undefined {
  const prop = page.properties[name];
  if (isSelect(prop)) return prop.select?.name ?? undefined;
  return undefined;
}
export function getStatusName(page: NotionPage, name: string): string | undefined {
  const prop = page.properties[name];
  if (isStatus(prop)) return prop.status?.name ?? undefined;
  if (isSelect(prop)) return prop.select?.name ?? undefined; // fallback if it's a select
  return undefined;
}
export function getNumberValue(page: NotionPage, name: string): number | null {
  const prop = page.properties[name];
  if (isNumber(prop)) return prop.number;
  return null;
}
export function getUrlValue(page: NotionPage, name: string): string | null {
  const prop = page.properties[name];
  if (isUrl(prop)) return prop.url || null;
  return null;
}
/** Rollup helpers (common cases) */
export function getRollupTitles(page: NotionPage, name: string): string[] {
  const prop = page.properties[name];
  if (isRollup(prop) && (prop.rollup as any).type === 'array') {
    const arr = (prop.rollup as any).array as RollupArrayItem[];
    return (arr ?? [])
      .map((it) => {
        if ('title' in it) return (it.title ?? []).map((t) => t.plain_text).join('').trim();
        if ('rich_text' in it) return (it.rich_text ?? []).map((t) => t.plain_text).join(' ').trim();
        return '';
      })
      .filter(Boolean);
  }
  return [];
}

export function getNotion(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN is not set');
  return new Client({ auth: token });
}
