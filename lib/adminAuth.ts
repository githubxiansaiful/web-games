import { db, User } from './db';

/**
 * Validates whether the incoming request originates from an active Administrator.
 */
export async function getAuthenticatedAdmin(req: Request): Promise<{
  admin: User | null;
  error?: string;
  status?: number;
}> {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/xian_user_id=([^;]+)/);
  const userId = match ? match[1] : null;

  if (!userId) {
    return { admin: null, error: 'Unauthorized: Administrative authentication required.', status: 401 };
  }

  const user = await db.getUserById(userId);
  if (!user) {
    return { admin: null, error: 'Unauthorized: User account not found.', status: 401 };
  }

  if (user.status !== 'active') {
    return { admin: null, error: 'Access Denied: Your account is currently suspended.', status: 403 };
  }

  if (user.role !== 'admin') {
    return { admin: null, error: 'Forbidden: Administrator privileges required.', status: 403 };
  }

  return { admin: user };
}

/**
 * Determines whether a given user is the primary immutable Super Administrator.
 */
export function isSuperAdmin(user: { email: string; id?: string }): boolean {
  const configuredEmail = (process.env.ADMIN_EMAIL || 'xiansaiful@gmail.com').trim().toLowerCase();
  const emailMatch = user.email.trim().toLowerCase() === configuredEmail;
  const idMatch = user.id === 'usr_admin_xian' || user.id === 'usr_admin_initial';
  return emailMatch || idMatch;
}
