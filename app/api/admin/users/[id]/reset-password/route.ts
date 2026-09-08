import { NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const user = await db.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Generate random secure temp password if not provided
    const newPassword = body.newPassword || `Xian!${Math.floor(100000 + Math.random() * 900000)}`;

    await db.updateUser(id, {
      passwordHash: hashPassword(newPassword),
    });

    // Send reset email via SMTP
    sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      newPass: newPassword,
    }).catch((err) => {
      console.error('Failed to send password reset email:', err);
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${user.email}. Notification email dispatched.`,
      temporaryPassword: newPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
