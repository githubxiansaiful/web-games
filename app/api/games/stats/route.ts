import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const games = await db.getGames();
    return NextResponse.json({ success: true, games });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, gameId, stats } = await req.json();

    if (gameId) {
      await db.incrementPlayCount(gameId);
    }

    if (userId && stats) {
      const gameKey = gameId === 'space-survivor' ? 'space' : 'runner';
      await db.updateStats(userId, gameKey, stats);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
