import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

type Body = { id: string; priority: string | null };

export async function POST(req: Request) {
  try {
    const { id, priority } = (await req.json()) as Body;

    await notion.pages.update({
      page_id: id,
      properties: {
        Priority: priority
          ? { select: { name: priority } }
          : { select: null },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to update priority';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}