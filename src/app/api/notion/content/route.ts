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

type OutContent = {
  id: string;
  contentName: string;
  pageNames: string[];          // rollup of related page titles
  goalDate: string | null;
  status: string | undefined;
  notes: string | null;
  pageUrl: string | null;
  includedTasks: string[];      // rollup of related tasks titles
  url: string;
};

export async function GET() {
  try {
    const notion = getNotion();
    const dbId = process.env.NOTION_CONTENT_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_CONTENT_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [{ property: 'Goal Date', direction: 'ascending' }],
      page_size: 100,
    });

    const items: OutContent[] = (res.results as NotionPage[]).map((p) => ({
      id: p.id,
      contentName: getTitle(p, 'Content Name') || '(Untitled)',
      pageNames: getRollupTitles(p, 'Page Name'), // rollup of related Page Tracker titles
      goalDate: getDateStart(p, 'Goal Date'),
      status: getStatusName(p, 'Status'),
      notes: getRichText(p, 'Notes'),
      pageUrl: getUrlValue(p, 'Page URL'),
      includedTasks: getRollupTitles(p, 'Included Tasks'),
      url: p.url,
    }));

    return NextResponse.json({ content: items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion Content Tracker error';
    return NextResponse.json({ content: [], error: msg }, { status: 500 });
  }
}