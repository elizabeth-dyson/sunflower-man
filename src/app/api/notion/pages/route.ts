import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notion = getNotionClient();
    const dbId = process.env.NOTION_PAGE_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_PAGE_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [],
      page_size: 50,
    });

    const pages = res.results.map((p: any) => {
      const pageNameProp = p.properties['Page Name'];
      const userProp = p.properties['User'];
      const goalDateProp = p.properties['Goal Date'];
      const statusProp = p.properties['Status'];
      const notesProp = p.properties['Notes'];
      const urlProp = p.properties['Page URL'];
      const feedbackProp = p.properties['Feedback'];
      const includedContentProp = p.properties['Included Content'];

      return {
        id: p.id as string,
        pageName:
          pageNameProp?.title?.[0]?.plain_text?.trim() ||
          '(Untitled)',
        user: userProp?.select?.name ?? undefined,
        goalDate: goalDateProp?.date?.start ?? null,
        status: statusProp?.status?.name ?? statusProp?.select?.name ?? undefined,
        notes: notesProp?.rich_text?.map((t: any) => t.plain_text).join(' ') || null,
        url: urlProp?.url,
        feedback: feedbackProp?.select?.name ?? undefined,
        includedContent: includedContentProp?.select?.name ?? undefined,
      };
    });

    return NextResponse.json({ pages });
  } catch (err: any) {
    return NextResponse.json({ pages: [], error: err?.message ?? 'Notion Page Tracker error' }, { status: 500 });
  }
}