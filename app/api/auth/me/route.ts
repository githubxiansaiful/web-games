import { NextResponse } from 'next/server';
import { db, hashPassword, verifyPassword } from '@/lib/db';
import { sendAccountDeletedEmail, sendPasswordResetEmail } from '@/lib/email';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get('userId');

    // Check cookie or query param
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/xian_user_id=([^;]+)/);
    const userId = queryUserId || (match ? match[1] : null);

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await db.getUserById(userId);
    if (!user || user.status === 'suspended') {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        stats: user.stats,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, name, avatar, currentPassword, newPassword } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const updates: any = {};
    if (name) updates.name = name.trim();
    if (avatar) updates.avatar = avatar;

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }
      if (user.passwordHash && currentPassword) {
        if (!verifyPassword(currentPassword, user.passwordHash)) {
          return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
        }
      }
      updates.passwordHash = hashPassword(newPassword);

      // Send password update notification via SMTP
      sendPasswordResetEmail({ name: user.name, email: user.email }).catch((err) => {
        console.error('Failed to send password update email:', err);
      });
    }

    const updated = await db.updateUser(userId, updates);

    return NextResponse.json({
      success: true,
      user: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        status: updated!.status,
        avatar: updated!.avatar,
        createdAt: updated!.createdAt,
        lastLoginAt: updated!.lastLoginAt,
        stats: updated!.stats,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Do not allow deleting super admin account
    if (user.email === 'xiansaiful@gmail.com') {
      return NextResponse.json({ error: 'Super administrator account cannot be deleted.' }, { status: 403 });
    }

    await db.deleteUser(userId);

    // Send account deletion email notification
    sendAccountDeletedEmail({ name: user.name, email: user.email }).catch((err) => {
      console.error('Failed to send account deletion email:', err);
    });

    const response = NextResponse.json({ success: true, message: 'Account deleted successfully.' });
    response.cookies.delete('xian_user_id');
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
