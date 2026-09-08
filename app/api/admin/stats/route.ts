import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedAdmin } from '@/lib/adminAuth';

export async function GET(req: Request) {
  try {
    const { admin, error, status } = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error }, { status: status || 401 });
    }

    const stats = await db.getSystemStats();
    const games = await db.getGames();
    return NextResponse.json({ success: true, stats, games });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
