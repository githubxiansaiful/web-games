import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET() {
  try {
    const users = await db.getUsers();
    const safeUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      avatar: u.avatar,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      stats: u.stats,
    }));
    return NextResponse.json({ success: true, users: safeUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role, status } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const newUser = await db.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || 'user',
      avatar: role === 'admin' ? '👑' : '🎮',
    });

    if (status && status !== 'active') {
      await db.updateUser(newUser.id, { status });
    }

    // Send welcome email via SMTP
    sendWelcomeEmail({ name: newUser.name, email: newUser.email }).catch((err) => {
      console.error('Failed to send welcome email from admin action:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully! Welcome email sent.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
        lastLoginAt: newUser.lastLoginAt,
        stats: newUser.stats,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 400 });
  }
}
