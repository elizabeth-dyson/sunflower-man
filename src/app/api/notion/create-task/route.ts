import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_TASK_TRACKER_ID!;

/**
 * Body: { title: string; notes?: string; contentName?: string; goalDate?: string | null; priority?: 'High'|'Medium'|'Low'|null }
 */
export async function POST(req: Request) {
  try {
    const { title, notes, contentName, goalDate, priority } = await req.json();

    // Build properties safely (these names must match your Notion DB)
    const properties: Record<string, any> = {
      Task: { title: [{ type: 'text', text: { content: String(title).slice(0, 2000) } }] },
    };

    if (notes) {
      properties.Notes = { rich_text: [{ type: 'text', text: { content: notes.slice(0, 2000) } }] };
    }
    if (goalDate) {
      properties['Goal Date'] = { date: { start: goalDate } };
    }
    if (priority) {
      properties.Priority = { select: { name: priority } };
    }
    // If your "Content Name" is a select, this will work.
    if (contentName) {
      properties['Content Name'] = { select: { name: contentName } };
    }
    // If you use Status property, set default:
    properties.Status = { select: { name: 'Not started' } };

    await notion.pages.create({ parent: { database_id: DB_ID }, properties });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create Notion task';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
