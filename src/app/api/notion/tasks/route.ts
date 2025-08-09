import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notion = getNotionClient();
    const dbId = process.env.NOTION_TASK_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_TASK_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [{ property: 'Goal Date', direction: 'ascending' }],
      page_size: 50,
      filter: {
      property: 'Status',
        status: {
          does_not_equal: 'Done',
        },
      },
    });

    const tasks = res.results.map((p: any) => {
      const taskProp = p.properties['Task'];
      const contentProp = p.properties['Content Name'];
      const goalProp = p.properties['Goal Date'];
      const statusProp = p.properties['Status'];
      const notesProp = p.properties['Notes'];

      return {
        id: p.id as string,
        task:
          taskProp?.title?.[0]?.plain_text?.trim() ||
          '(Untitled)',
        contentName: contentProp?.rollup?.array[0]?.title[0]?.plain_text ?? null,
        goalDate: goalProp?.date?.start ?? null,
        status: statusProp?.status?.name ?? statusProp?.select?.name ?? undefined,
        notes: notesProp?.rich_text?.map((t: any) => t.plain_text).join(' ') || null,
      };
    });

    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ tasks: [], error: err?.message ?? 'Notion Task Tracker error' }, { status: 500 });
  }
}