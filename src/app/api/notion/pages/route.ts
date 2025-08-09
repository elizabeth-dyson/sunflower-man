import { NextResponse } from 'next/server';
import {
  getNotion,
  getTitle,
  getStatusName,
  getDateStart,
  getRichText,
  getUrlValue,
  getRollupTitles,
  NotionPage,
} from '@/lib/notionSafe';

export const dynamic = 'force-dynamic';

type OutPage = {
  id: string;
  pageName: string;
  user: string | undefined;     // select (Customer/Admin/etc.)
  status: string | undefined;   // status/select
  goalDate: string | null;
  notes: string | null;
  pageUrl: string | null;
  includedContent: string[];    // rollup of related content titles (optional)
  url: string;
};

export async function GET() {
  try {
    const notion = getNotion();
    const dbId = process.env.NOTION_PAGE_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_PAGE_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [{ property: 'Goal Date', direction: 'ascending' }],
      page_size: 100,
    });

    const pages: OutPage[] = (res.results as NotionPage[]).map((p) => ({
      id: p.id,
      pageName: getTitle(p, 'Page Name') || '(Untitled)',
      user: getStatusName(p, 'User') ?? undefined, // handle select/status uniformly
      status: getStatusName(p, 'Status'),
      goalDate: getDateStart(p, 'Goal Date'),
      notes: getRichText(p, 'Notes'),
      pageUrl: getUrlValue(p, 'Page URL'),
      includedContent: getRollupTitles(p, 'Included Content'),
      url: p.url,
    }));

    return NextResponse.json({ pages });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion Page Tracker error';
    return NextResponse.json({ pages: [], error: msg }, { status: 500 });
  }
}