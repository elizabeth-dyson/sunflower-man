import { Client } from '@notionhq/client';

export function getNotionClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN is not set');
  return new Client({ auth: token });
}
