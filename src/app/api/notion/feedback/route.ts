import { NextResponse } from 'next/server';
import {
  getNotion,
  getTitle,
  getStatusName,
  getDateStart,
  getRichText,
  getRollupTitles,
  NotionPage,
} from '@/lib/notionSafe';

export const dynamic = 'force-dynamic';

type OutFeedback = {
  id: string;
  topic: string;
  feedback: string | null;
  status: string | undefined;
  feedbackDate: string | null;
  pagesReferenced: string[]; // rollup of page titles
  url: string;
};

export async function GET() {
  try {
    const notion = getNotion();
    const dbId = process.env.NOTION_FEEDBACK_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_FEEDBACK_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [{ property: 'Feedback Date', direction: 'descending' }],
      page_size: 100,
    });

    const items: OutFeedback[] = (res.results as NotionPage[]).map((p) => ({
      id: p.id,
      topic: getTitle(p, 'Feedback Topic') || '(Untitled)',
      feedback: getRichText(p, 'Feedback'),
      status: getStatusName(p, 'Status'),
      feedbackDate: getDateStart(p, 'Feedback Date'),
      pagesReferenced: getRollupTitles(p, 'Pages Referenced'),
      url: p.url,
    }));

    return NextResponse.json({ feedback: items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion Feedback error';
    return NextResponse.json({ feedback: [], error: msg }, { status: 500 });
  }
}