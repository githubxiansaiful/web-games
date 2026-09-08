import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendAccountDeletedEmail } from '@/lib/email';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const user = await db.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Protect super admin role from being revoked
    if (user.email === 'xiansaiful@gmail.com' && body.role && body.role !== 'admin') {
      return NextResponse.json({ error: 'Cannot demote the primary super admin.' }, { status: 403 });
    }

    const updates: any = {};
    if (body.name) updates.name = body.name.trim();
    if (body.role) updates.role = body.role;
    if (body.status) updates.status = body.status;
    if (body.avatar) updates.avatar = body.avatar;

    const updated = await db.updateUser(id, updates);

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const user = await db.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.email === 'xiansaiful@gmail.com') {
      return NextResponse.json({ error: 'Primary super admin cannot be deleted.' }, { status: 403 });
    }

    await db.deleteUser(id);

    // Send deletion confirmation email via SMTP
    sendAccountDeletedEmail({ name: user.name, email: user.email }).catch((err) => {
      console.error('Failed to send deletion email:', err);
    });

    return NextResponse.json({ success: true, message: `User ${user.email} deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
