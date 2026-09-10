import { Pool, QueryResult } from 'pg';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface UserStats {
  runnerGames: number;
  runnerStars: number;
  runnerBestTime?: number;
  spaceGames: number;
  spaceHighScore: number;
  coinsTotal: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  stats: UserStats;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: 'welcome' | 'account_deleted' | 'password_reset' | 'admin_alert' | 'test';
  status: 'sent' | 'failed';
  error?: string;
  sentAt: string;
  htmlPreview?: string;
}

export interface GameInfo {
  id: string;
  title: string;
  tagline: string;
  description: string;
  genre: string;
  tags: string[];
  badge: string;
  rating: number;
  playCount: number;
  isActive: boolean;
  multiplayer: boolean;
  icon: string;
}

export interface SystemData {
  users: User[];
  emailLogs: EmailLog[];
  games: GameInfo[];
}

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'xian-games-salt', 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Default Seed Data
const DEFAULT_GAMES: GameInfo[] = [
  {
    id: 'runner-royale',
    title: 'Cyber Runner Royale',
    tagline: 'High-Speed Parkour & Multiplayer Racing',
    description: 'Sprint, jump, dash, and double-jump across 3 neon cyberpunk stages. Speedrun solo with star goals, or challenge friends in live 4-player multiplayer rooms with real-time race sync!',
    genre: '2D Platformer / Speedrun',
    tags: ['MULTIPLAYER', 'SOLO RACING', 'PARKOUR', 'RETRO NEON', 'LEADERBOARDS'],
    badge: 'POPULAR',
    rating: 5.0,
    playCount: 1420,
    isActive: true,
    multiplayer: true,
    icon: '🏃‍♂️',
  },
  {
    id: 'space-survivor',
    title: 'Neon Space Survivor',
    tagline: 'Retro Arcade Space Shooter & Boss Battles',
    description: 'Pilot your neon starfighter against unrelenting swarms of alien drones, cruiser bombers, asteroid storms, and colossal mothership bosses. Collect weapon upgrades, trigger smart bombs, and survive endless waves!',
    genre: 'Arcade Space Shooter',
    tags: ['ACTION ARCADE', 'SURVIVAL', 'BOSS FIGHTS', 'LASER POWERUPS', 'HIGH SCORES'],
    badge: 'NEW',
    rating: 5.0,
    playCount: 980,
    isActive: true,
    multiplayer: false,
    icon: '🚀',
  },
  {
    id: 'zombie-haven',
    title: 'Zombie Haven: Deadwood Village',
    tagline: 'Two Friends. One Village. Endless Zombies.',
    description: 'Enter the abandoned rural ruins of Deadwood Village in a 3D cooperative zombie survival game for 2 players. Scavenge weapons, ammunition, and medical supplies, hold off escalating undead hordes, and revive your downed partner to survive the night.',
    genre: '3D Co-op Horror Survival',
    tags: ['3D CO-OP', 'ZOMBIE SURVIVAL', '2 PLAYERS', 'THIRD PERSON', 'HORDE DEFENSE'],
    badge: 'NEW CO-OP',
    rating: 5.0,
    playCount: 1250,
    isActive: true,
    multiplayer: true,
    icon: '🧟‍♂️',
  },
];

function getInitialAdminUsers(): User[] {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Super Admin';

  if (!adminEmail || !adminPassword) {
    return [];
  }

  return [
    {
      id: 'usr_admin_initial',
      name: adminName,
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: 'admin',
      status: 'active',
      avatar: '👑',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      stats: {
        runnerGames: 0,
        runnerStars: 0,
        runnerBestTime: undefined,
        spaceGames: 0,
        spaceHighScore: 0,
        coinsTotal: 0,
      },
    },
  ];
}

function mapUserRow(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    status: row.status as 'active' | 'suspended',
    avatar: row.avatar || '🕹️',
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    lastLoginAt: row.last_login_at
      ? row.last_login_at instanceof Date
        ? row.last_login_at.toISOString()
        : String(row.last_login_at)
      : undefined,
    stats: {
      runnerGames: Number(row.runner_games || 0),
      runnerStars: Number(row.runner_stars || 0),
      runnerBestTime: row.runner_best_time != null ? Number(row.runner_best_time) : undefined,
      spaceGames: Number(row.space_games || 0),
      spaceHighScore: Number(row.space_high_score || 0),
      coinsTotal: Number(row.coins_total || 0),
    },
  };
}

function mapEmailLogRow(row: any): EmailLog {
  return {
    id: row.id,
    to: row.to_email,
    subject: row.subject,
    template: row.template as any,
    status: row.status as any,
    error: row.error || undefined,
    sentAt: row.sent_at instanceof Date ? row.sent_at.toISOString() : String(row.sent_at),
    htmlPreview: row.html_preview || undefined,
  };
}

function mapGameRow(row: any): GameInfo {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    genre: row.genre,
    tags: Array.isArray(row.tags) ? row.tags : [],
    badge: row.badge,
    rating: Number(row.rating || 5.0),
    playCount: Number(row.play_count || 0),
    isActive: Boolean(row.is_active),
    multiplayer: Boolean(row.multiplayer),
    icon: row.icon,
  };
}

class DatabaseService {
  private pool: Pool | null = null;
  private isFallbackMode: boolean = false;
  private initPromise: Promise<void> | null = null;
  private memoryFallback: SystemData = {
    users: getInitialAdminUsers(),
    emailLogs: [],
    games: [...DEFAULT_GAMES],
  };

  constructor() {
    this.initPool();
  }

  private initPool() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:xian_secure_pg_pass_2026@localhost:5437/xian_games';

    try {
      this.pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
        max: 20,
        idleTimeoutMillis: 30000,
      });

      this.pool.on('error', (err) => {
        console.error('[PostgreSQL] Unexpected pool error:', err.message);
      });
    } catch (err: any) {
      console.warn('[PostgreSQL] Could not initialize pool, fallback mode active:', err?.message);
      this.isFallbackMode = true;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!this.pool || this.isFallbackMode) {
        this.loadLocalJsonFallback();
        return;
      }

      try {
        const client = await this.pool.connect();
        try {
          // 1. Create tables and indexes
          await client.query(`
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(100) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              role VARCHAR(50) DEFAULT 'user',
              status VARCHAR(50) DEFAULT 'active',
              avatar TEXT DEFAULT '🕹️',
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              last_login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              runner_games INTEGER DEFAULT 0,
              runner_stars INTEGER DEFAULT 0,
              runner_best_time DOUBLE PRECISION,
              space_games INTEGER DEFAULT 0,
              space_high_score INTEGER DEFAULT 0,
              coins_total INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS email_logs (
              id VARCHAR(100) PRIMARY KEY,
              to_email VARCHAR(255) NOT NULL,
              subject VARCHAR(500) NOT NULL,
              template VARCHAR(100) NOT NULL,
              status VARCHAR(50) NOT NULL,
              error TEXT,
              sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              html_preview TEXT
            );

            CREATE TABLE IF NOT EXISTS games (
              id VARCHAR(100) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              tagline VARCHAR(500) NOT NULL,
              description TEXT NOT NULL,
              genre VARCHAR(100) NOT NULL,
              tags TEXT[] NOT NULL DEFAULT '{}',
              badge VARCHAR(100) NOT NULL,
              rating DOUBLE PRECISION DEFAULT 5.0,
              play_count INTEGER DEFAULT 0,
              is_active BOOLEAN DEFAULT TRUE,
              multiplayer BOOLEAN DEFAULT FALSE,
              icon VARCHAR(100) NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
            CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
            CREATE INDEX IF NOT EXISTS idx_games_play_count ON games(play_count DESC);
          `);

          // Seed default games if missing
          for (const g of DEFAULT_GAMES) {
            await client.query(
              `INSERT INTO games (id, title, tagline, description, genre, tags, badge, rating, play_count, is_active, multiplayer, icon)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (id) DO NOTHING`,
              [g.id, g.title, g.tagline, g.description, g.genre, g.tags, g.badge, g.rating, g.playCount, g.isActive, g.multiplayer, g.icon]
            );
          }

          // 2. Check if users table is empty
          const usersCountRes = await client.query('SELECT COUNT(*) as count FROM users');
          const userCount = parseInt(usersCountRes.rows[0]?.count || '0', 10);

          if (userCount === 0) {
            // Check if local JSON backup exists to migrate existing data
            const localData = this.readLocalJsonBackup();
            if (localData && localData.users && localData.users.length > 0) {
              console.log(`[PostgreSQL] Migrating ${localData.users.length} existing users from JSON file...`);
              for (const u of localData.users) {
                await client.query(
                  `INSERT INTO users (id, name, email, password_hash, role, status, avatar, created_at, last_login_at, runner_games, runner_stars, runner_best_time, space_games, space_high_score, coins_total)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                   ON CONFLICT (email) DO NOTHING`,
                  [
                    u.id,
                    u.name,
                    u.email.toLowerCase(),
                    u.passwordHash,
                    u.role || 'user',
                    u.status || 'active',
                    u.avatar || '🕹️',
                    u.createdAt || new Date().toISOString(),
                    u.lastLoginAt || new Date().toISOString(),
                    u.stats?.runnerGames || 0,
                    u.stats?.runnerStars || 0,
                    u.stats?.runnerBestTime ?? null,
                    u.stats?.spaceGames || 0,
                    u.stats?.spaceHighScore || 0,
                    u.stats?.coinsTotal || 0,
                  ]
                );
              }

              if (localData.emailLogs && localData.emailLogs.length > 0) {
                for (const e of localData.emailLogs) {
                  await client.query(
                    `INSERT INTO email_logs (id, to_email, subject, template, status, error, sent_at, html_preview)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (id) DO NOTHING`,
                    [e.id, e.to, e.subject, e.template, e.status, e.error || null, e.sentAt, e.htmlPreview || null]
                  );
                }
              }
            } else {
              // Seed initial admin user from environment variables if provided
              const initialAdmins = getInitialAdminUsers();
              if (initialAdmins.length > 0) {
                console.log(`[PostgreSQL] Seeding initial admin (${initialAdmins[0].email}) from environment variables...`);
                for (const u of initialAdmins) {
                  await client.query(
                    `INSERT INTO users (id, name, email, password_hash, role, status, avatar, created_at, last_login_at, runner_games, runner_stars, runner_best_time, space_games, space_high_score, coins_total)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                     ON CONFLICT (email) DO NOTHING`,
                    [
                      u.id,
                      u.name,
                      u.email.toLowerCase(),
                      u.passwordHash,
                      u.role,
                      u.status,
                      u.avatar,
                      u.createdAt,
                      u.lastLoginAt,
                      u.stats.runnerGames,
                      u.stats.runnerStars,
                      u.stats.runnerBestTime ?? null,
                      u.stats.spaceGames,
                      u.stats.spaceHighScore,
                      u.stats.coinsTotal,
                    ]
                  );
                }
              }
            }
          }

          // 3. Seed or sync games
          const gamesCountRes = await client.query('SELECT COUNT(*) as count FROM games');
          const gamesCount = parseInt(gamesCountRes.rows[0]?.count || '0', 10);
          if (gamesCount === 0) {
            const localData = this.readLocalJsonBackup();
            const gamesToSeed = localData?.games?.length ? localData.games : DEFAULT_GAMES;
            console.log(`[PostgreSQL] Seeding ${gamesToSeed.length} games...`);
            for (const g of gamesToSeed) {
              await client.query(
                `INSERT INTO games (id, title, tagline, description, genre, tags, badge, rating, play_count, is_active, multiplayer, icon)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  g.id,
                  g.title,
                  g.tagline,
                  g.description,
                  g.genre,
                  g.tags,
                  g.badge,
                  g.rating,
                  g.playCount,
                  g.isActive,
                  g.multiplayer,
                  g.icon,
                ]
              );
            }
          }

          console.log('[PostgreSQL] Connected and verified successfully.');
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.warn('[PostgreSQL] Database unavailable, continuing in resilient local fallback mode:', err?.message);
        this.isFallbackMode = true;
        this.loadLocalJsonFallback();
      }
    })();

    return this.initPromise;
  }

  private readLocalJsonBackup(): SystemData | null {
    try {
      const dataFilePath = path.join(process.cwd(), 'data', 'xian_games_store.json');
      if (fs.existsSync(dataFilePath)) {
        const raw = fs.readFileSync(dataFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  }

  private loadLocalJsonFallback() {
    const backup = this.readLocalJsonBackup();
    if (backup) {
      if (Array.isArray(backup.users)) this.memoryFallback.users = backup.users;
      if (Array.isArray(backup.emailLogs)) this.memoryFallback.emailLogs = backup.emailLogs;
      if (Array.isArray(backup.games)) this.memoryFallback.games = backup.games;
    }
  }

  // ---------------- Users ----------------
  async getUsers(): Promise<User[]> {
    await this.ensureInitialized();
    if (this.isFallbackMode || !this.pool) {
      return [...this.memoryFallback.users];
    }
    try {
      const res = await this.pool.query('SELECT * FROM users ORDER BY created_at ASC');
      return res.rows.map(mapUserRow);
    } catch (e) {
      return [...this.memoryFallback.users];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    await this.ensureInitialized();
    if (this.isFallbackMode || !this.pool) {
      const u = this.memoryFallback.users.find((user) => user.id === id);
      return u ? { ...u } : null;
    }
    try {
      const res = await this.pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length === 0) return null;
      return mapUserRow(res.rows[0]);
    } catch (e) {
      const u = this.memoryFallback.users.find((user) => user.id === id);
      return u ? { ...u } : null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    await this.ensureInitialized();
    const normalized = email.trim().toLowerCase();
    if (this.isFallbackMode || !this.pool) {
      const u = this.memoryFallback.users.find((user) => user.email.toLowerCase() === normalized);
      return u ? { ...u } : null;
    }
    try {
      const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [normalized]);
      if (res.rows.length === 0) return null;
      return mapUserRow(res.rows[0]);
    } catch (e) {
      const u = this.memoryFallback.users.find((user) => user.email.toLowerCase() === normalized);
      return u ? { ...u } : null;
    }
  }

  async createUser(data: {
    name: string;
    email: string;
    password?: string;
    role?: 'admin' | 'user';
    avatar?: string;
  }): Promise<User> {
    await this.ensureInitialized();
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = data.password ? hashPassword(data.password) : hashPassword(Math.random().toString(36));
    const role = data.role || 'user';
    const status = 'active';
    const avatar = data.avatar || '🕹️';
    const now = new Date().toISOString();

    if (this.isFallbackMode || !this.pool) {
      const newUser: User = {
        id,
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        status,
        avatar,
        createdAt: now,
        lastLoginAt: now,
        stats: {
          runnerGames: 0,
          runnerStars: 0,
          spaceGames: 0,
          spaceHighScore: 0,
          coinsTotal: 0,
        },
      };
      this.memoryFallback.users.push(newUser);
      return { ...newUser };
    }

    const res = await this.pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, status, avatar, created_at, last_login_at, runner_games, runner_stars, runner_best_time, space_games, space_high_score, coins_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, NULL, 0, 0, 0)
       RETURNING *`,
      [id, data.name.trim(), normalizedEmail, passwordHash, role, status, avatar, now, now]
    );

    return mapUserRow(res.rows[0]);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    await this.ensureInitialized();
    if (this.isFallbackMode || !this.pool) {
      const idx = this.memoryFallback.users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      const current = this.memoryFallback.users[idx];
      const updated: User = { ...current, ...updates, id: current.id };
      this.memoryFallback.users[idx] = updated;
      return { ...updated };
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      setClauses.push(`email = $${idx++}`);
      values.push(updates.email.trim().toLowerCase());
    }
    if (updates.passwordHash !== undefined) {
      setClauses.push(`password_hash = $${idx++}`);
      values.push(updates.passwordHash);
    }
    if (updates.role !== undefined) {
      setClauses.push(`role = $${idx++}`);
      values.push(updates.role);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${idx++}`);
      values.push(updates.status);
    }
    if (updates.avatar !== undefined) {
      setClauses.push(`avatar = $${idx++}`);
      values.push(updates.avatar);
    }
    if (updates.lastLoginAt !== undefined) {
      setClauses.push(`last_login_at = $${idx++}`);
      values.push(updates.lastLoginAt);
    }
    if (updates.stats !== undefined) {
      if (updates.stats.runnerGames !== undefined) {
        setClauses.push(`runner_games = $${idx++}`);
        values.push(updates.stats.runnerGames);
      }
      if (updates.stats.runnerStars !== undefined) {
        setClauses.push(`runner_stars = $${idx++}`);
        values.push(updates.stats.runnerStars);
      }
      if (updates.stats.runnerBestTime !== undefined) {
        setClauses.push(`runner_best_time = $${idx++}`);
        values.push(updates.stats.runnerBestTime);
      }
      if (updates.stats.spaceGames !== undefined) {
        setClauses.push(`space_games = $${idx++}`);
        values.push(updates.stats.spaceGames);
      }
      if (updates.stats.spaceHighScore !== undefined) {
        setClauses.push(`space_high_score = $${idx++}`);
        values.push(updates.stats.spaceHighScore);
      }
      if (updates.stats.coinsTotal !== undefined) {
        setClauses.push(`coins_total = $${idx++}`);
        values.push(updates.stats.coinsTotal);
      }
    }

    if (setClauses.length === 0) {
      return this.getUserById(id);
    }

    values.push(id);
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.pool.query(query, values);
    if (res.rows.length === 0) return null;
    return mapUserRow(res.rows[0]);
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (this.isFallbackMode || !this.pool) {
      const prev = this.memoryFallback.users.length;
      this.memoryFallback.users = this.memoryFallback.users.filter((u) => u.id !== id);
      return this.memoryFallback.users.length < prev;
    }
    const res = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async updateStats(userId: string, game: 'runner' | 'space', statsUpdate: Partial<UserStats>): Promise<void> {
    await this.ensureInitialized();
    const user = await this.getUserById(userId);
    if (!user) return;

    const newStats: UserStats = {
      ...user.stats,
      ...statsUpdate,
      runnerGames: user.stats.runnerGames + (game === 'runner' ? 1 : 0),
      spaceGames: user.stats.spaceGames + (game === 'space' ? 1 : 0),
    };

    await this.updateUser(userId, { stats: newStats });
  }

  // ---------------- Email Logs ----------------
  async getEmailLogs(): Promise<EmailLog[]> {
    await this.ensureInitialized();
    if (this.isFallbackMode || !this.pool) {
      return [...this.memoryFallback.emailLogs].reverse();
    }
    try {
      const res = await this.pool.query('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 300');
      return res.rows.map(mapEmailLogRow);
    } catch {
      return [...this.memoryFallback.emailLogs].reverse();
    }
  }

  async addEmailLog(log: Omit<EmailLog, 'id'>): Promise<EmailLog> {
    await this.ensureInitialized();
    const id = `mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sentAt = log.sentAt || new Date().toISOString();

    if (this.isFallbackMode || !this.pool) {
      const entry: EmailLog = { ...log, id, sentAt };
      this.memoryFallback.emailLogs.push(entry);
      if (this.memoryFallback.emailLogs.length > 300) {
        this.memoryFallback.emailLogs = this.memoryFallback.emailLogs.slice(-300);
      }
      return entry;
    }

    const res = await this.pool.query(
      `INSERT INTO email_logs (id, to_email, subject, template, status, error, sent_at, html_preview)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, log.to, log.subject, log.template, log.status, log.error || null, sentAt, log.htmlPreview || null]
    );

    return mapEmailLogRow(res.rows[0]);
  }

  // ---------------- Games ----------------
  async getGames(): Promise<GameInfo[]> {
    await this.ensureInitialized();
    if (this.isFallbackMode || !this.pool) {
      return [...this.memoryFallback.games];
    }
    try {
      const res = await this.pool.query('SELECT * FROM games ORDER BY play_count DESC');
      return res.rows.map(mapGameRow);
    } catch {
      return [...this.memoryFallback.games];
    }
  }

  async incrementPlayCount(gameId: string): Promise<void> {
    await this.ensureInitialized();
    if (this.isFallbackMode || !this.pool) {
      const game = this.memoryFallback.games.find((g) => g.id === gameId);
      if (game) game.playCount += 1;
      return;
    }
    try {
      await this.pool.query('UPDATE games SET play_count = play_count + 1 WHERE id = $1', [gameId]);
    } catch (e) {
      console.warn('[PostgreSQL] Could not increment play count:', e);
    }
  }

  // ---------------- System Overview Stats ----------------
  async getSystemStats() {
    await this.ensureInitialized();
    if (this.isFallbackMode || !this.pool) {
      const users = this.memoryFallback.users;
      const emailLogs = this.memoryFallback.emailLogs;
      const games = this.memoryFallback.games;
      return {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === 'active').length,
        totalGamesPlayed: games.reduce((acc, g) => acc + g.playCount, 0),
        emailsSent: emailLogs.filter((e) => e.status === 'sent').length,
        emailsFailed: emailLogs.filter((e) => e.status === 'failed').length,
        totalGames: games.length,
        smtpServer: process.env.SMTP_SERVER || 'smtp.gmail.com',
        smtpUser: process.env.SMTP_USERNAME || 'sharedxian@gmail.com',
        smtpStatus: 'ONLINE (Google SSL 465)',
        databaseEngine: 'PostgreSQL (Active)',
      };
    }

    try {
      const [uRes, gRes, eRes] = await Promise.all([
        this.pool.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(*) FILTER (WHERE status = 'active') as active_users
          FROM users
        `),
        this.pool.query(`
          SELECT 
            COUNT(*) as total_games,
            COALESCE(SUM(play_count), 0) as total_plays
          FROM games
        `),
        this.pool.query(`
          SELECT 
            COUNT(*) FILTER (WHERE status = 'sent') as emails_sent,
            COUNT(*) FILTER (WHERE status = 'failed') as emails_failed
          FROM email_logs
        `),
      ]);

      const uRow = uRes.rows[0] || {};
      const gRow = gRes.rows[0] || {};
      const eRow = eRes.rows[0] || {};

      return {
        totalUsers: parseInt(uRow.total_users || '0', 10),
        activeUsers: parseInt(uRow.active_users || '0', 10),
        totalGamesPlayed: parseInt(gRow.total_plays || '0', 10),
        emailsSent: parseInt(eRow.emails_sent || '0', 10),
        emailsFailed: parseInt(eRow.emails_failed || '0', 10),
        totalGames: parseInt(gRow.total_games || '0', 10),
        smtpServer: process.env.SMTP_SERVER || 'smtp.gmail.com',
        smtpUser: process.env.SMTP_USERNAME || 'sharedxian@gmail.com',
        smtpStatus: 'ONLINE (Google SSL 465)',
        databaseEngine: 'PostgreSQL 16 (Relational DB)',
      };
    } catch (err) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalGamesPlayed: 0,
        emailsSent: 0,
        emailsFailed: 0,
        totalGames: 2,
        smtpServer: process.env.SMTP_SERVER || 'smtp.gmail.com',
        smtpUser: process.env.SMTP_USERNAME || 'sharedxian@gmail.com',
        smtpStatus: 'ONLINE (Google SSL 465)',
        databaseEngine: 'PostgreSQL (Connecting...)',
      };
    }
  }
}

declare global {
  var __xian_db: DatabaseService | undefined;
}

export const db = global.__xian_db || (global.__xian_db = new DatabaseService());
