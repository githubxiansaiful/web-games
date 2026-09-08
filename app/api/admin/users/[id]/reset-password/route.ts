import { NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { getAuthenticatedAdmin, isSuperAdmin } from '@/lib/adminAuth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin: requester, error: authError, status: authStatus } = await getAuthenticatedAdmin(req);
    if (!requester) {
      return NextResponse.json({ error: authError }, { status: authStatus || 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const targetUser = await db.getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Only the Super Admin themselves can trigger a password reset on the Super Admin account
    if (isSuperAdmin(targetUser) && requester.id !== targetUser.id) {
      return NextResponse.json(
        { error: 'Security Violation: Only the primary Super Administrator can reset their own credentials.' },
        { status: 403 }
      );
    }

    // Generate random secure temp password if not provided
    const newPassword = body.newPassword || `Xian!${Math.floor(100000 + Math.random() * 900000)}`;

    await db.updateUser(id, {
      passwordHash: hashPassword(newPassword),
    });

    // Send reset email via SMTP
    sendPasswordResetEmail({
      name: targetUser.name,
      email: targetUser.email,
      newPass: newPassword,
    }).catch((err) => {
      console.error('Failed to send password reset email:', err);
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${targetUser.email}. Notification email dispatched.`,
      temporaryPassword: newPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
