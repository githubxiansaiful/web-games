import { NextResponse } from 'next/server';
import { db, verifyPassword } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended by an administrator. Contact support at sharedxian@gmail.com' },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Update last login timestamp
    const updatedUser = await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    // Build user response without exposing passwordHash
    const safeUser = {
      id: updatedUser?.id || user.id,
      name: updatedUser?.name || user.name,
      email: updatedUser?.email || user.email,
      role: updatedUser?.role || user.role,
      status: updatedUser?.status || user.status,
      avatar: updatedUser?.avatar || user.avatar,
      createdAt: updatedUser?.createdAt || user.createdAt,
      lastLoginAt: updatedUser?.lastLoginAt || user.lastLoginAt,
      stats: updatedUser?.stats || user.stats,
    };

    const response = NextResponse.json({ success: true, user: safeUser });

    // Set auth cookie
    response.cookies.set('xian_user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
