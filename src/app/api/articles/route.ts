import { NextResponse } from 'next/server';
import { db } from '@/db/config';
import { articles } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db
      .select()
      .from(articles)
      .orderBy(desc(articles.publishDate));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
} 