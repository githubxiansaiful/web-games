import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=no_code`);
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/callback/google`;

    // Exchange auth code for access token with Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${origin}/?auth_error=token_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch Google profile info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/?auth_error=userinfo_failed`);
    }

    const googleUser = await userRes.json();
    const email = (googleUser.email || '').trim().toLowerCase();
    const name = googleUser.name || email.split('@')[0];
    const avatar = googleUser.picture || '🌐';

    if (!email) {
      return NextResponse.redirect(`${origin}/?auth_error=no_email`);
    }

    let user = await db.getUserByEmail(email);

    if (!user) {
      // Create new account
      user = await db.createUser({
        name,
        email,
        role: email === 'xiansaiful@gmail.com' ? 'admin' : 'user',
        avatar,
      });

      // Send Welcome Email via SMTP
      sendWelcomeEmail({ name: user.name, email: user.email }).catch((err) => {
        console.error('Failed to send welcome email for Google user:', err);
      });
    } else {
      if (user.status === 'suspended') {
        return NextResponse.redirect(`${origin}/?auth_error=suspended`);
      }
      await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    }

    const response = NextResponse.redirect(`${origin}/`);

    // Set auth cookie
    response.cookies.set('xian_user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${origin}/?auth_error=server_error`);
  }
}
