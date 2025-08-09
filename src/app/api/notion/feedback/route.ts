import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notion = getNotionClient();
    const dbId = process.env.NOTION_FEEDBACK_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_FEEDBACK_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [{ property: 'Feedback Date', direction: 'descending' }],
      page_size: 50,
    });

    const feedbacks = res.results.map((p: any) => {
      const feedbackTopicProp = p.properties['Feedback Topic'];
      const feedbackProp = p.properties['Feedback'];
      const statusProp = p.properties['Status'];
      const feedbackDateProp = p.properties['Feedback Date'];
      const pagesReferencedProp = p.properties['Pages Referenced'];

      return {
        id: p.id as string,
        feedbackTopic:
          feedbackTopicProp?.title?.[0]?.plain_text?.trim() ||
          '(Untitled)',
        feedback: feedbackProp?.plain_text?.trim() ?? undefined,
        status: statusProp?.status?.name ?? statusProp?.select?.name ?? undefined,
        feedbackDate: feedbackDateProp?.date?.start ?? null,
        pagesReferenced: pagesReferencedProp?.select?.name ?? undefined,
      };
    });

    return NextResponse.json({ feedbacks });
  } catch (err: any) {
    return NextResponse.json({ feedbacks: [], error: err?.message ?? 'Notion Feedback Tracker error' }, { status: 500 });
  }
}