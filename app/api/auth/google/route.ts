import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, name, avatar } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Google email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await db.getUserByEmail(normalizedEmail);

    if (!user) {
      // Create new account for Google user
      user = await db.createUser({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: normalizedEmail === 'xiansaiful@gmail.com' ? 'admin' : 'user',
        avatar: avatar || '⚡',
      });

      // Send welcome email
      sendWelcomeEmail({ name: user.name, email: user.email }).catch((err) => {
        console.error('Failed to send welcome email for Google user:', err);
      });
    } else {
      if (user.status === 'suspended') {
        return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
      }
      // Update last login
      await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      stats: user.stats,
    };

    const response = NextResponse.json({ success: true, user: safeUser });

    response.cookies.set('xian_user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error('Google auth error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
