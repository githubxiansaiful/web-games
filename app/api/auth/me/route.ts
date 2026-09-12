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
    if (!user) {
      return NextResponse.json({ user: null });
    }
    if (user.status === 'suspended') {
      return NextResponse.json({ user: null, suspended: true });
    }

    const response = NextResponse.json({
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

    // Continuously renew 10-year persistent cookie
    response.cookies.set('xian_user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years persistent
    });

    return response;
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

    // Do not allow deleting super admin or last active admin account
    const configuredEmail = (process.env.ADMIN_EMAIL || 'xiansaiful@gmail.com').trim().toLowerCase();
    const isSuper = user.email.toLowerCase() === configuredEmail || user.id === 'usr_admin_xian' || user.id === 'usr_admin_initial';
    if (isSuper) {
      return NextResponse.json({ error: 'Security Violation: The primary Super Administrator account cannot be deleted.' }, { status: 403 });
    }

    if (user.role === 'admin' && user.status === 'active') {
      const allUsers = await db.getUsers();
      const remainingActiveAdmins = allUsers.filter(u => u.role === 'admin' && u.status === 'active' && u.id !== user.id);
      if (remainingActiveAdmins.length === 0) {
        return NextResponse.json({ error: 'System Lockout Protection: Cannot delete the last remaining active administrator.' }, { status: 400 });
      }
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
