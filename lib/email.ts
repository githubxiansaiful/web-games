import nodemailer, { type Transporter } from 'nodemailer';
import { db } from './db';

// Gmail SMTP configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_SERVER || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME || 'sharedxian@gmail.com',
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_APP_PASSWORD || '',
  },
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: {
        user: SMTP_CONFIG.auth.user,
        pass: SMTP_CONFIG.auth.pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert issues on some network firewalls
      },
    });
  }
  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  template: 'welcome' | 'account_deleted' | 'password_reset' | 'admin_alert' | 'test';
}

export async function sendEmail(options: SendMailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: `"Xian's Game World" <${SMTP_CONFIG.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    // Record email log in database
    await db.addEmailLog({
      to: options.to,
      subject: options.subject,
      template: options.template,
      status: 'sent',
      sentAt: new Date().toISOString(),
      htmlPreview: options.html.slice(0, 500),
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('SMTP Send Error:', err);

    // Record failed email in database
    await db.addEmailLog({
      to: options.to,
      subject: options.subject,
      template: options.template,
      status: 'failed',
      error: err?.message || 'Failed to dispatch email',
      sentAt: new Date().toISOString(),
      htmlPreview: options.html.slice(0, 500),
    });

    return { success: false, error: err?.message || 'Failed to dispatch email' };
  }
}

// ----------------------------------------------------
// HTML Email Templates with Xian's Game World Cyber Theme
// ----------------------------------------------------

function emailWrapper(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #3b82f6; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #6366f1; }
    .logo { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-shadow: 0 0 16px rgba(99,102,241,0.8); margin: 0; }
    .subtitle { color: #a5b4fc; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; }
    .body { padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #cbd5e1; }
    .card { background-color: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin: 20px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; text-align: center; font-size: 15px; box-shadow: 0 4px 14px rgba(99,102,241,0.5); }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; background-color: #090d16; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">⚡ XIAN'S GAME WORLD ⚡</h1>
      <div class="subtitle">Next-Gen Arcade & Multiplayer Platform</div>
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">© ${new Date().getFullYear()} Xian's Game World. All rights reserved.</p>
      <p style="margin: 0;">Automated notification from Google SMTP (smtp.gmail.com)</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const content = `
    <h2 style="color: #ffffff; margin-top: 0;">Welcome to the Arcade, ${user.name}! 🎮</h2>
    <p>Your account has been successfully created on <strong>Xian's Game World</strong>. You now have full access to our expanding library of web arcade games:</p>
    
    <div class="card">
      <h3 style="color: #38bdf8; margin: 0 0 8px 0;">🚀 Cyber Runner Royale</h3>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">High-speed 2D parkour speedrunning & real-time multiplayer room races with custom room codes.</p>
    </div>

    <div class="card">
      <h3 style="color: #ec4899; margin: 0 0 8px 0;">👾 Neon Space Survivor</h3>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">Intense retro arcade space shooter. Upgrade plasma lasers, blast alien swarms, and defeat mother-ship bosses.</p>
    </div>

    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="https://web-games-taupe.vercel.app/" class="btn">Launch Xian's Game World 🕹️</a>
    </div>

    <p style="font-size: 13px; color: #64748b; margin-top: 25px;">
      Registered Email: <strong style="color: #94a3b8;">${user.email}</strong><br>
      Need assistance? Contact our team at <a href="mailto:sharedxian@gmail.com" style="color: #60a5fa;">sharedxian@gmail.com</a>
    </p>
  `;

  return sendEmail({
    to: user.email,
    subject: `🎮 Welcome to Xian's Game World, ${user.name}!`,
    html: emailWrapper('Welcome to Xian\'s Game World', content),
    template: 'welcome',
  });
}

export async function sendAccountDeletedEmail(user: { name: string; email: string }) {
  const content = `
    <h2 style="color: #f87171; margin-top: 0;">Account Deletion Notice</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>This email confirms that your player account associated with <strong>${user.email}</strong> has been successfully deleted from <strong>Xian's Game World</strong>.</p>
    <p>All your saved game records, stage times, and leaderboard scores have been permanently removed.</p>
    <p>If you did not request this deletion or believe this was an error, please reach out to the Super Admin immediately at <a href="mailto:sharedxian@gmail.com" style="color: #60a5fa;">sharedxian@gmail.com</a>.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://web-games-taupe.vercel.app/" class="btn" style="background: #334155;">Visit Xian's Game World</a>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `⚠️ Xian's Game World - Account Deletion Notice`,
    html: emailWrapper('Account Deletion Notice', content),
    template: 'account_deleted',
  });
}

export async function sendPasswordResetEmail(user: { name: string; email: string; newPass?: string }) {
  const content = `
    <h2 style="color: #38bdf8; margin-top: 0;">Security Alert: Password Updated</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>Your password for <strong>Xian's Game World</strong> has been updated.</p>
    ${user.newPass ? `
      <div class="card" style="border-color: #38bdf8;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #94a3b8;">Your temporary password generated by administrator:</p>
        <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #38bdf8; letter-spacing: 2px;">${user.newPass}</div>
      </div>
      <p style="font-size: 13px; color: #fbbf24;">⚠️ We recommend changing your password immediately after logging in.</p>
    ` : `
      <p>If you did not perform this action, please contact our administrator immediately at <a href="mailto:sharedxian@gmail.com" style="color: #60a5fa;">sharedxian@gmail.com</a>.</p>
    `}
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://web-games-taupe.vercel.app/" class="btn">Log In to Play 🎮</a>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `🔐 Xian's Game World - Password Update Notice`,
    html: emailWrapper('Password Update Notice', content),
    template: 'password_reset',
  });
}

export async function sendTestEmail(to: string) {
  const content = `
    <h2 style="color: #34d399; margin-top: 0;">✅ SMTP Connection Test Succeeded!</h2>
    <p>This is a live test email sent from the <strong>Xian's Game World Admin Portal</strong> to verify the Gmail SMTP configuration.</p>
    <div class="card">
      <table style="width: 100%; font-size: 13px; color: #94a3b8;">
        <tr><td style="padding: 4px 0;"><strong>SMTP Server:</strong></td><td style="color: #e2e8f0;">smtp.gmail.com</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Port:</strong></td><td style="color: #e2e8f0;">465 (SSL Encrypted)</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Sender:</strong></td><td style="color: #e2e8f0;">sharedxian@gmail.com</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Dispatched At:</strong></td><td style="color: #e2e8f0;">${new Date().toLocaleString()}</td></tr>
      </table>
    </div>
    <p style="color: #cbd5e1;">All system email notifications are functioning at full capacity!</p>
  `;

  return sendEmail({
    to,
    subject: `🚀 [Test] Xian's Game World SMTP Notification Test`,
    html: emailWrapper('SMTP Test Successful', content),
    template: 'test',
  });
}
