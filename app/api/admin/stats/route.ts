import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const stats = await db.getSystemStats();
    const games = await db.getGames();
    return NextResponse.json({ success: true, stats, games });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
