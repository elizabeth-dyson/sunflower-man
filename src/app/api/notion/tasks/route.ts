import { NextResponse } from 'next/server';
import {
  getNotion,
  getTitle,
  getRollupTitles,
  getStatusName,
  getDateStart,
  getRichText,
  NotionPage,
  getSelectName,
} from '@/lib/notionSafe';

export const dynamic = 'force-dynamic';

type OutTask = {
  id: string;
  task: string;
  contentName: string | null;
  goalDate: string | null;
  status: string | undefined;
  notes: string | null;
  priority: string | undefined;
  url: string;
};

export async function GET() {
  try {
    const notion = getNotion();
    const dbId = process.env.NOTION_TASK_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_TASK_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [{ property: 'Goal Date', direction: 'ascending' }, { property: 'Priority', direction: 'ascending' }],
      page_size: 100,
      filter: { property: 'Status', status: { does_not_equal: 'Done' } }, // change to select{} if needed
    });

    const tasks: OutTask[] = (res.results as NotionPage[]).map((p) => {
      const task = getTitle(p, 'Task') || '(Untitled)';
      const contentTitles = getRollupTitles(p, 'Content Name');
      return {
        id: p.id,
        task,
        contentName: contentTitles.length ? contentTitles.join(', ') : null,
        goalDate: getDateStart(p, 'Goal Date'),
        status: getStatusName(p, 'Status'),
        notes: getRichText(p, 'Notes'),
        priority: getSelectName(p, 'Priority'),
        url: p.url,
      };
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion Task Tracker error';
    return NextResponse.json({ tasks: [], error: msg }, { status: 500 });
  }
}