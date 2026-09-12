import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

function getCleanAppOrigin(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const isLocal = !host || host.includes('localhost') || host.includes('0.0.0.0') || host.includes('127.0.0.1');

  if (isLocal) {
    const portMatch = host.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : '3000';
    return `http://localhost:${port}`;
  }

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

function getCleanRedirectUri(req: Request, stateRedirectUri?: string): string {
  if (stateRedirectUri && !stateRedirectUri.includes('0.0.0.0') && !stateRedirectUri.includes('127.0.0.1')) {
    return stateRedirectUri;
  }
  const cleanOrigin = getCleanAppOrigin(req);
  return `${cleanOrigin}/api/auth/callback/google`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const cleanOrigin = getCleanAppOrigin(req);

  if (!code) {
    const oauthError = url.searchParams.get('error') || 'no_code';
    return NextResponse.redirect(`${cleanOrigin}/?auth_error=${encodeURIComponent(oauthError)}`);
  }

  let stateRedirectUri: string | undefined;
  if (stateParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(stateParam));
      if (parsed.redirectUri) {
        stateRedirectUri = parsed.redirectUri;
      }
    } catch {
      // ignore
    }
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const redirectUri = getCleanRedirectUri(req, stateRedirectUri);

    console.log('[Google OAuth Callback] Exchanging code with redirect_uri:', redirectUri);

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
      const errText = await tokenRes.text();
      console.error('[Google OAuth] Token exchange failed:', errText);
      let errorDesc = 'token_failed';
      try {
        const parsed = JSON.parse(errText);
        errorDesc = parsed.error_description || parsed.error || 'token_failed';
      } catch {
        errorDesc = errText.slice(0, 100);
      }
      return NextResponse.redirect(`${cleanOrigin}/?auth_error=${encodeURIComponent(errorDesc)}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch Google profile info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const userErr = await userRes.text();
      console.error('[Google OAuth] UserInfo request failed:', userErr);
      return NextResponse.redirect(`${cleanOrigin}/?auth_error=userinfo_failed`);
    }

    const googleUser = await userRes.json();
    const email = (googleUser.email || '').trim().toLowerCase();
    const name = googleUser.name || email.split('@')[0];
    const avatar = googleUser.picture || '🌐';

    if (!email) {
      return NextResponse.redirect(`${cleanOrigin}/?auth_error=no_email`);
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
        console.error('[Google OAuth] Failed to send welcome email:', err);
      });
    } else {
      if (user.status === 'suspended') {
        return NextResponse.redirect(`${cleanOrigin}/?auth_error=suspended`);
      }
      await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    }

    const response = NextResponse.redirect(`${cleanOrigin}/`);

    // Set auth cookie
    response.cookies.set('xian_user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years persistent
    });

    return response;
  } catch (err: any) {
    console.error('[Google OAuth] Callback server exception:', err);
    return NextResponse.redirect(`${cleanOrigin}/?auth_error=server_error`);
  }
}
