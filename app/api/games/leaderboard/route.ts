import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.getUsers();

    // Top players in Space Survivor
    const topSpace = users
      .filter((u) => u.stats?.spaceHighScore && u.stats.spaceHighScore > 0)
      .sort((a, b) => (b.stats.spaceHighScore || 0) - (a.stats.spaceHighScore || 0))
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar || '🚀',
        score: u.stats.spaceHighScore,
        game: 'Neon Space Survivor',
      }));

    // Top players in Runner Royale (by stars, then best time)
    const topRunner = users
      .filter((u) => (u.stats?.runnerStars && u.stats.runnerStars > 0) || (u.stats?.runnerGames && u.stats.runnerGames > 0))
      .sort((a, b) => (b.stats.runnerStars || 0) - (a.stats.runnerStars || 0))
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar || '🏃‍♂️',
        stars: u.stats.runnerStars,
        bestTime: u.stats.runnerBestTime,
        game: 'Cyber Runner Royale',
      }));

    return NextResponse.json({
      success: true,
      topSpace,
      topRunner,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
