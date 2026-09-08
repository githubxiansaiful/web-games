import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTestEmail } from '@/lib/email';
import { getAuthenticatedAdmin } from '@/lib/adminAuth';

export async function GET(req: Request) {
  try {
    const { admin, error, status } = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error }, { status: status || 401 });
    }

    const logs = await db.getEmailLogs();
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { admin, error, status } = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error }, { status: status || 401 });
    }

    const { to } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient email address is required.' }, { status: 400 });
    }

    const result = await sendTestEmail(to.trim());

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email successfully dispatched to ${to} via smtp.gmail.com!`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send test email.',
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
