import { NextResponse } from 'next/server';
import {
  getNotion,
  getTitle,
  getSelectName,
  getNumberValue,
  NotionPage,
} from '@/lib/notionSafe';

export const dynamic = 'force-dynamic';

type OutResource = {
  id: string;
  resourceName: string;
  resourceType: string | undefined;
  price: number | null;
  priceFrequency: string | undefined;
  url: string;
};

export async function GET() {
  try {
    const notion = getNotion();
    const dbId = process.env.NOTION_RESOURCE_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_RESOURCE_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      page_size: 100,
    });

    const items: OutResource[] = (res.results as NotionPage[]).map((p) => ({
      id: p.id,
      resourceName: getTitle(p, 'Resource Name') || '(Untitled)',
      resourceType: getSelectName(p, 'Resource Type'),
      price: getNumberValue(p, 'Price'),
      priceFrequency: getSelectName(p, 'Price Frequency'),
      url: p.url,
    }));

    return NextResponse.json({ resources: items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion Resource error';
    return NextResponse.json({ resources: [], error: msg }, { status: 500 });
  }
}