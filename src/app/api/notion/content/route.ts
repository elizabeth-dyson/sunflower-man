import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notion = getNotionClient();
    const dbId = process.env.NOTION_CONTENT_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_CONTENT_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [],
      page_size: 50,
    });

    const conts = res.results.map((p: any) => {
      const contentNameProp = p.properties['Content Name'];
      const pageNameProp = p.properties['Page Name'];
      const goalDateProp = p.properties['Goal Date'];
      const statusProp = p.properties['Status'];
      const notesProp = p.properties['Notes'];
      const pageUrlProp = p.properties['Page URL'];
      const includedTasksProp = p.properties['Included Tasks'];

      return {
        id: p.id as string,
        contentName:
          contentNameProp?.title?.[0]?.plain_text?.trim() ||
          '(Untitled)',
        pageName: pageNameProp?.select?.name ?? undefined,
        goalDate: goalDateProp?.date?.start ?? null,
        status: statusProp?.status?.name ?? statusProp?.select?.name ?? undefined,
        notes: notesProp?.rich_text?.map((t: any) => t.plain_text).join(' ') || null,
        pageUrl: pageUrlProp.url,
        includedTasks: includedTasksProp?.select?.name ?? undefined,
      };
    });

    return NextResponse.json({ conts });
  } catch (err: any) {
    return NextResponse.json({ conts: [], error: err?.message ?? 'Notion Content Tracker error' }, { status: 500 });
  }
}