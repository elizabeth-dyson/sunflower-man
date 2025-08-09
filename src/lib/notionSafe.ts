import { Client } from '@notionhq/client';

/** Minimal Notion prop types we use */
type Text = { plain_text: string };

type TitleProp = { type: 'title'; title: Text[] };
type RichTextProp = { type: 'rich_text'; rich_text: Text[] };
type DateProp = { type: 'date'; date: { start: string | null } | null };
type SelectLike = { name: string };
type SelectProp = { type: 'select'; select: SelectLike | null };
type StatusProp = { type: 'status'; status: SelectLike | null };
type NumberProp = { type: 'number'; number: number | null };
type UrlProp = { type: 'url'; url: string | null };

type RollupArrayItemTitle = { type: 'title'; title: Text[] };
type RollupArrayItemRich = { type: 'rich_text'; rich_text: Text[] };
type RollupArrayItemNumber = { type: 'number'; number: number | null };
type RollupArrayItemUrl = { type: 'url'; url: string | null };
type RollupArrayItem =
  | RollupArrayItemTitle
  | RollupArrayItemRich
  | RollupArrayItemNumber
  | RollupArrayItemUrl;

type RollupArray = { type: 'array'; array: RollupArrayItem[] };
type RollupNumber = { type: 'number'; number: number | null };
type RollupDate = { type: 'date'; date: { start: string | null } | null };
type RollupProp =
  | { type: 'rollup'; rollup: RollupArray }
  | { type: 'rollup'; rollup: RollupNumber }
  | { type: 'rollup'; rollup: RollupDate };

export type NotionPage = {
  id: string;
  url: string;
  properties: Record<string, unknown>;
};

/** Type guards without `any` */
function hasType<K extends string>(v: unknown, t: K): v is { type: K } {
  return typeof v === 'object' && v !== null && 'type' in (v as Record<string, unknown>) && (v as { type: string }).type === t;
}
function isTitleProp(p: unknown): p is TitleProp { return hasType(p, 'title'); }
function isRichTextProp(p: unknown): p is RichTextProp { return hasType(p, 'rich_text'); }
function isDateProp(p: unknown): p is DateProp { return hasType(p, 'date'); }
function isSelectProp(p: unknown): p is SelectProp { return hasType(p, 'select'); }
function isStatusProp(p: unknown): p is StatusProp { return hasType(p, 'status'); }
function isNumberProp(p: unknown): p is NumberProp { return hasType(p, 'number'); }
function isUrlProp(p: unknown): p is UrlProp { return hasType(p, 'url'); }
function isRollupProp(p: unknown): p is RollupProp { return hasType(p, 'rollup'); }

/** Safe getters */
export function getTitle(page: NotionPage, name: string): string {
  const prop = page.properties[name];
  if (isTitleProp(prop)) return (prop.title ?? []).map((t) => t.plain_text).join('').trim();
  return '';
}

export function getRichText(page: NotionPage, name: string): string | null {
  const prop = page.properties[name];
  if (isRichTextProp(prop)) {
    const s = (prop.rich_text ?? []).map((t) => t.plain_text).join(' ').trim();
    return s || null;
  }
  return null;
}

export function getDateStart(page: NotionPage, name: string): string | null {
  const prop = page.properties[name];
  if (isDateProp(prop)) return prop.date?.start ?? null;
  return null;
}

export function getSelectName(page: NotionPage, name: string): string | undefined {
  const prop = page.properties[name];
  if (isSelectProp(prop)) return prop.select?.name ?? undefined;
  return undefined;
}

export function getStatusName(page: NotionPage, name: string): string | undefined {
  const prop = page.properties[name];
  if (isStatusProp(prop)) return prop.status?.name ?? undefined;
  if (isSelectProp(prop)) return prop.select?.name ?? undefined;
  return undefined;
}

export function getNumberValue(page: NotionPage, name: string): number | null {
  const prop = page.properties[name];
  if (isNumberProp(prop)) return prop.number;
  return null;
}

export function getUrlValue(page: NotionPage, name: string): string | null {
  const prop = page.properties[name];
  if (isUrlProp(prop)) return prop.url || null;
  return null;
}

/** Rollup (array) → titles/strings */
export function getRollupTitles(page: NotionPage, name: string): string[] {
  const prop = page.properties[name];
  if (isRollupProp(prop) && prop.rollup.type === 'array') {
    const arr = prop.rollup.array ?? [];
    const titles = arr.map((it) => {
      if (it.type === 'title') return (it.title ?? []).map((t) => t.plain_text).join('').trim();
      if (it.type === 'rich_text') return (it.rich_text ?? []).map((t) => t.plain_text).join(' ').trim();
      return '';
    });
    return titles.filter((s) => s.length > 0);
  }
  return [];
}

export function getNotion(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN is not set');
  return new Client({ auth: token });
}