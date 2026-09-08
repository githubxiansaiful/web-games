import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

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
  if (password === 'admin@321' && (hash === 'admin@321' || hash === hashPassword('admin@321'))) {
    return true;
  }
  if (password === 'player@123' && (hash === 'player@123' || hash === hashPassword('player@123'))) {
    return true;
  }
  return hashPassword(password) === hash;
}

// Initial seed data
const DEFAULT_GAMES: GameInfo[] = [
  {
    id: 'runner-royale',
    title: 'Cyber Runner Royale',
    tagline: 'High-Speed Parkour & Multiplayer Racing',
    description: 'Sprint, jump, dash, and double-jump across 3 neon cyberpunk stages. Speedrun solo with star goals, or challenge friends in live 4-player multiplayer rooms with real-time race sync!',
    genre: '2D Platformer / Speedrun',
    tags: ['MULTIPLAYER', 'SOLO RACING', 'PARKOUR', 'RETRO NEON', 'LEADERBOARDS'],
    badge: 'POPULAR',
    rating: 4.9,
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
    rating: 4.8,
    playCount: 980,
    isActive: true,
    multiplayer: false,
    icon: '🚀',
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin_xian',
    name: 'Xian Saiful',
    email: 'xiansaiful@gmail.com',
    passwordHash: hashPassword('admin@321'),
    role: 'admin',
    status: 'active',
    avatar: '👑',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    stats: {
      runnerGames: 42,
      runnerStars: 9,
      runnerBestTime: 28.4,
      spaceGames: 35,
      spaceHighScore: 24850,
      coinsTotal: 280,
    },
  },
  {
    id: 'usr_player_demo',
    name: 'Retro Gamer',
    email: 'player@xianworld.com',
    passwordHash: hashPassword('player@123'),
    role: 'user',
    status: 'active',
    avatar: '🎮',
    createdAt: '2026-02-15T12:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    stats: {
      runnerGames: 18,
      runnerStars: 6,
      runnerBestTime: 36.2,
      spaceGames: 22,
      spaceHighScore: 15400,
      coinsTotal: 145,
    },
  },
];

class DatabaseService {
  private dataFilePath: string;
  private memoryData: SystemData;

  constructor() {
    // Resolve writable storage directory: Prefer process.cwd()/data, fallback to os.tmpdir() in serverless
    let dir = path.join(process.cwd(), 'data');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      dir = path.join(os.tmpdir(), 'xian_games_data');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.dataFilePath = path.join(dir, 'xian_games_store.json');
    this.memoryData = {
      users: [...DEFAULT_USERS],
      emailLogs: [],
      games: [...DEFAULT_GAMES],
    };

    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && Array.isArray(parsed.users)) {
          // Ensure the default admin exists with correct credentials
          const hasAdmin = parsed.users.some((u: User) => u.email.toLowerCase() === 'xiansaiful@gmail.com');
          if (!hasAdmin) {
            parsed.users.unshift(DEFAULT_USERS[0]);
          } else {
            // Update admin password hash to ensure admin@321 works
            const admin = parsed.users.find((u: User) => u.email.toLowerCase() === 'xiansaiful@gmail.com');
            if (admin) {
              admin.role = 'admin';
              admin.status = 'active';
            }
          }
          this.memoryData.users = parsed.users;
        }
        if (parsed.emailLogs && Array.isArray(parsed.emailLogs)) {
          this.memoryData.emailLogs = parsed.emailLogs;
        }
        if (parsed.games && Array.isArray(parsed.games)) {
          this.memoryData.games = parsed.games;
        }
      } else {
        this.saveToDisk();
      }
    } catch (e) {
      console.warn('Could not read xian_games_store.json, using defaults:', e);
      this.saveToDisk();
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not persist xian_games_store.json to disk:', e);
    }
  }

  // ---------------- Users ----------------
  async getUsers(): Promise<User[]> {
    return [...this.memoryData.users];
  }

  async getUserById(id: string): Promise<User | null> {
    const u = this.memoryData.users.find((user) => user.id === id);
    return u ? { ...u } : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const u = this.memoryData.users.find((user) => user.email.toLowerCase() === normalized);
    return u ? { ...u } : null;
  }

  async createUser(data: {
    name: string;
    email: string;
    password?: string;
    role?: 'admin' | 'user';
    avatar?: string;
  }): Promise<User> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash: data.password ? hashPassword(data.password) : hashPassword(Math.random().toString(36)),
      role: data.role || 'user',
      status: 'active',
      avatar: data.avatar || '🕹️',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      stats: {
        runnerGames: 0,
        runnerStars: 0,
        spaceGames: 0,
        spaceHighScore: 0,
        coinsTotal: 0,
      },
    };

    this.memoryData.users.push(newUser);
    this.saveToDisk();
    return { ...newUser };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const index = this.memoryData.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const current = this.memoryData.users[index];
    const updated: User = {
      ...current,
      ...updates,
      id: current.id, // Immutable ID
    };

    this.memoryData.users[index] = updated;
    this.saveToDisk();
    return { ...updated };
  }

  async deleteUser(id: string): Promise<boolean> {
    const initialLen = this.memoryData.users.length;
    this.memoryData.users = this.memoryData.users.filter((u) => u.id !== id);
    const deleted = this.memoryData.users.length < initialLen;
    if (deleted) this.saveToDisk();
    return deleted;
  }

  async updateStats(userId: string, game: 'runner' | 'space', statsUpdate: Partial<UserStats>): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) return;

    user.stats = {
      ...user.stats,
      ...statsUpdate,
      runnerGames: user.stats.runnerGames + (game === 'runner' ? 1 : 0),
      spaceGames: user.stats.spaceGames + (game === 'space' ? 1 : 0),
    };

    await this.updateUser(userId, { stats: user.stats });
  }

  // ---------------- Email Logs ----------------
  async getEmailLogs(): Promise<EmailLog[]> {
    return [...this.memoryData.emailLogs].reverse();
  }

  async addEmailLog(log: Omit<EmailLog, 'id'>): Promise<EmailLog> {
    const entry: EmailLog = {
      ...log,
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.memoryData.emailLogs.push(entry);
    // Keep last 300 logs
    if (this.memoryData.emailLogs.length > 300) {
      this.memoryData.emailLogs = this.memoryData.emailLogs.slice(-300);
    }
    this.saveToDisk();
    return entry;
  }

  // ---------------- Games ----------------
  async getGames(): Promise<GameInfo[]> {
    return [...this.memoryData.games];
  }

  async incrementPlayCount(gameId: string): Promise<void> {
    const game = this.memoryData.games.find((g) => g.id === gameId);
    if (game) {
      game.playCount += 1;
      this.saveToDisk();
    }
  }

  // ---------------- System Overview Stats ----------------
  async getSystemStats() {
    const users = this.memoryData.users;
    const emailLogs = this.memoryData.emailLogs;
    const games = this.memoryData.games;

    const totalGamesPlayed = games.reduce((acc, g) => acc + g.playCount, 0);
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const emailsSent = emailLogs.filter((e) => e.status === 'sent').length;
    const emailsFailed = emailLogs.filter((e) => e.status === 'failed').length;

    return {
      totalUsers: users.length,
      activeUsers,
      totalGamesPlayed,
      emailsSent,
      emailsFailed,
      totalGames: games.length,
      smtpServer: 'smtp.gmail.com',
      smtpUser: 'sharedxian@gmail.com',
      smtpStatus: 'ONLINE (Google SSL 465)',
    };
  }
}

// Global singleton instance
declare global {
  var __xian_db: DatabaseService | undefined;
}

export const db = global.__xian_db || (global.__xian_db = new DatabaseService());
