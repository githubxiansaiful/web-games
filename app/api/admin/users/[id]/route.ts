import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendAccountDeletedEmail } from '@/lib/email';
import { getAuthenticatedAdmin, isSuperAdmin } from '@/lib/adminAuth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin: requester, error: authError, status: authStatus } = await getAuthenticatedAdmin(req);
    if (!requester) {
      return NextResponse.json({ error: authError }, { status: authStatus || 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const targetUser = await db.getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const isSelf = requester.id === targetUser.id;
    const isTargetSuperAdmin = isSuperAdmin(targetUser);

    // 1. Prevent Self-Suspension & Self-Demotion
    if (isSelf) {
      if (body.status && body.status !== 'active') {
        return NextResponse.json(
          { error: 'Security Violation: You cannot suspend your own administrator account.' },
          { status: 400 }
        );
      }
      if (body.role && body.role !== 'admin') {
        return NextResponse.json(
          { error: 'Security Violation: You cannot demote your own administrator privileges.' },
          { status: 400 }
        );
      }
    }

    // 2. Protect Super Admin from Suspension & Demotion by Anyone
    if (isTargetSuperAdmin) {
      if (body.status && body.status !== 'active') {
        return NextResponse.json(
          { error: 'Protected Account: The primary Super Administrator account cannot be suspended.' },
          { status: 403 }
        );
      }
      if (body.role && body.role !== 'admin') {
        return NextResponse.json(
          { error: 'Protected Account: The primary Super Administrator role is immutable and cannot be revoked.' },
          { status: 403 }
        );
      }
    }

    // 3. System Lockout Guard: Never allow leaving 0 active admins in the system
    const isTargetActiveAdmin = targetUser.role === 'admin' && targetUser.status === 'active';
    const willBecomeInactiveAdmin =
      (body.status && body.status !== 'active') || (body.role && body.role !== 'admin');

    if (isTargetActiveAdmin && willBecomeInactiveAdmin) {
      const allUsers = await db.getUsers();
      const otherActiveAdmins = allUsers.filter(
        (u) => u.role === 'admin' && u.status === 'active' && u.id !== targetUser.id
      );
      if (otherActiveAdmins.length === 0) {
        return NextResponse.json(
          { error: 'System Lockout Protection: Cannot suspend or demote the last active administrator.' },
          { status: 400 }
        );
      }
    }

    // Apply allowed updates
    const updates: any = {};
    if (body.name) updates.name = body.name.trim();
    if (body.role && (!isSelf || body.role === 'admin') && (!isTargetSuperAdmin || body.role === 'admin')) {
      updates.role = body.role;
    }
    if (body.status && (!isSelf || body.status === 'active') && (!isTargetSuperAdmin || body.status === 'active')) {
      updates.status = body.status;
    }
    if (body.avatar) updates.avatar = body.avatar;

    const updated = await db.updateUser(id, updates);

    return NextResponse.json({
      success: true,
      message: `User ${updated!.name} updated successfully.`,
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
    const { admin: requester, error: authError, status: authStatus } = await getAuthenticatedAdmin(req);
    if (!requester) {
      return NextResponse.json({ error: authError }, { status: authStatus || 401 });
    }

    const { id } = await params;
    const targetUser = await db.getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const isSelf = requester.id === targetUser.id;
    const isTargetSuperAdmin = isSuperAdmin(targetUser);

    // 1. Prevent Self-Deletion from Admin Panel
    if (isSelf) {
      return NextResponse.json(
        { error: 'Security Violation: You cannot delete your own account from the administrator dashboard.' },
        { status: 400 }
      );
    }

    // 2. Protect Super Admin from Deletion
    if (isTargetSuperAdmin) {
      return NextResponse.json(
        { error: 'Protected Account: The primary Super Administrator account cannot be deleted.' },
        { status: 403 }
      );
    }

    // 3. System Lockout Guard: Never allow deleting the last active admin
    if (targetUser.role === 'admin' && targetUser.status === 'active') {
      const allUsers = await db.getUsers();
      const otherActiveAdmins = allUsers.filter(
        (u) => u.role === 'admin' && u.status === 'active' && u.id !== targetUser.id
      );
      if (otherActiveAdmins.length === 0) {
        return NextResponse.json(
          { error: 'System Lockout Protection: Cannot delete the last active administrator.' },
          { status: 400 }
        );
      }
    }

    await db.deleteUser(id);

    // Send deletion confirmation email via SMTP
    sendAccountDeletedEmail({ name: targetUser.name, email: targetUser.email }).catch((err) => {
      console.error('Failed to send deletion email:', err);
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
