// src/app/api/notion/create-task/route.ts
import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_TASK_TRACKER_ID!;

// --- minimal Notion types we use ---
type NotionTitle = { title: { text: { content: string } }[] };
type NotionRichText = { rich_text: { type: 'text'; text: { content: string } }[] };
type NotionSelect = { select: { name: string } };
type NotionDate = { date: { start: string } };

type TaskPayload = {
  Task: NotionTitle;
  Notes?: NotionRichText;
  'Goal Date'?: NotionDate;
  Priority?: NotionSelect;
  'Content Name'?: NotionSelect;
};

type ReqBody = {
  title: string;
  notes?: string | null;
  contentName?: string | null;
  goalDate?: string | null;
  priority?: 'High' | 'Medium' | 'Low' | null;
};

export async function POST(req: Request) {
  try {
    const { title, notes, contentName, goalDate, priority } = (await req.json()) as ReqBody;

    const properties: TaskPayload = {
      Task: { title: [{ text: { content: String(title).slice(0, 2000) } }] },
    };

    if (notes) {
      properties.Notes = {
        rich_text: [{ type: 'text', text: { content: String(notes).slice(0, 2000) } }],
      };
    }
    if (goalDate) {
      properties['Goal Date'] = { date: { start: goalDate } };
    }
    if (priority) {
      properties.Priority = { select: { name: priority } };
    }
    if (contentName) {
      properties['Content Name'] = { select: { name: contentName } };
    }

    await notion.pages.create({
      parent: { database_id: DB_ID },
      properties,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
