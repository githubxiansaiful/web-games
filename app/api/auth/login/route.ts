import { NextResponse } from 'next/server';
import { db, verifyPassword } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await db.getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email. Please switch to the Register tab to create an account.' },
        { status: 404 }
      );
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended by an administrator. Contact support at sharedxian@gmail.com' },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Please check your password and try again.' },
        { status: 401 }
      );
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
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years persistent
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
