import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await db.getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    // Create user
    const newUser = await db.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
      avatar: '🎮',
    });

    // Send Welcome Email asynchronously via Gmail SMTP (non-blocking for registration speed)
    sendWelcomeEmail({ name: newUser.name, email: newUser.email }).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
      stats: newUser.stats,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome email sent.',
      user: safeUser,
    });

    // Set auth cookie
    response.cookies.set('xian_user_id', newUser.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
