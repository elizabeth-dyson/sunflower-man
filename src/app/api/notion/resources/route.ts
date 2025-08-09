import { NextResponse } from 'next/server';
import { getNotionClient } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notion = getNotionClient();
    const dbId = process.env.NOTION_RESOURCE_TRACKER_ID;
    if (!dbId) throw new Error('NOTION_RESOURCE_TRACKER_ID is not set');

    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [],
      page_size: 50,
    });

    const resources = res.results.map((p: any) => {
      const resourceNameProp = p.properties['Resource Name'];
      const resourceTypeProp = p.properties['Resource Type'];
      const priceProp = p.properties['Price'];
      const priceFrequencyProp = p.properties['Price Frequency'];

      return {
        id: p.id as string,
        resourceName:
          resourceNameProp?.title?.[0]?.plain_text?.trim() ||
          '(Untitled)',
        resourceType: resourceTypeProp?.select?.name ?? undefined,
        price: priceProp?.number?.[0] ?? null,
        priceFrequency: priceFrequencyProp?.plain_text?.trim() ?? undefined,
      };
    });

    return NextResponse.json({ resources });
  } catch (err: any) {
    return NextResponse.json({ resources: [], error: err?.message ?? 'Notion Resource Tracker error' }, { status: 500 });
  }
}