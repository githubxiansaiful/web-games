/**
 * Zombie Haven - Multiplayer Socket.io Client
 * Handles 2-player room creation, matchmaking lobby, high-frequency survivor sync,
 * shooting tracers, and authoritative wave/zombie events.
 */

import { io, Socket } from 'socket.io-client';
import { RemotePlayerSync, ZombieRoom, WeaponType } from '../types';

export class ZombieSocketClient {
  private socket: Socket | null = null;
  public room: ZombieRoom | null = null;
  public myId: string | null = null;
  public isHost: boolean = false;
  public isConnected: boolean = false;

  // Remote player state buffer for interpolation
  public remotePlayer: RemotePlayerSync | null = null;

  // Listeners
  public onRoomUpdated?: (room: ZombieRoom) => void;
  public onGameStarting?: () => void;
  public onRemoteShoot?: (data: { origin: [number, number, number]; dir: [number, number, number]; weapon: WeaponType }) => void;
  public onRemoteRevived?: () => void;
  public onRemoteZombieDamage?: (data: { zombieId: string; damage: number }) => void;

  constructor() {}

  public connect(): Promise<boolean> {
    if (this.socket && this.socket.connected) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      // Connect to same origin or port 3000
      this.socket = io({
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 8000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.myId = this.socket!.id || null;
        this.setupEventListeners();
        resolve(true);
      });

      this.socket.on('connect_error', () => {
        // Allow solo offline play without blocking
        this.isConnected = false;
        resolve(false);
      });
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('zombie:room_updated', (room: ZombieRoom) => {
      this.room = room;
      const me = room.players.find((p) => p.id === this.myId);
      if (me) {
        this.isHost = me.isHost;
      }
      if (this.onRoomUpdated) {
        this.onRoomUpdated(room);
      }
    });

    this.socket.on('zombie:game_starting', () => {
      if (this.onGameStarting) {
        this.onGameStarting();
      }
    });

    this.socket.on('zombie:remote_player_state', (data: RemotePlayerSync) => {
      this.remotePlayer = data;
    });

    this.socket.on('zombie:remote_shoot', (data: any) => {
      if (this.onRemoteShoot) {
        this.onRemoteShoot(data);
      }
    });

    this.socket.on('zombie:remote_revived', () => {
      if (this.onRemoteRevived) {
        this.onRemoteRevived();
      }
    });

    this.socket.on('zombie:remote_zombie_damage', (data: any) => {
      if (this.onRemoteZombieDamage) {
        this.onRemoteZombieDamage(data);
      }
    });
  }

  public createRoom(playerName: string): Promise<{ success: boolean; code?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        // Generate simulated offline room for solo play
        const offlineCode = 'SOLO-' + Math.floor(100 + Math.random() * 900);
        this.room = {
          code: offlineCode,
          hostId: 'local_player',
          status: 'lobby',
          players: [{ id: 'local_player', name: playerName, isHost: true, isReady: true }],
          createdAt: Date.now(),
        };
        this.isHost = true;
        return resolve({ success: true, code: offlineCode });
      }

      this.socket.emit('zombie:create_room', { playerName }, (res: any) => {
        if (res?.success) {
          this.room = res.room;
          this.isHost = true;
          resolve({ success: true, code: res.room.code });
        } else {
          resolve({ success: false, error: res?.error || 'Failed to create room' });
        }
      });
    });
  }

  public joinRoom(code: string, playerName: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        return resolve({ success: false, error: 'Not connected to multiplayer server' });
      }

      this.socket.emit('zombie:join_room', { code, playerName }, (res: any) => {
        if (res?.success) {
          this.room = res.room;
          this.isHost = false;
          resolve({ success: true });
        } else {
          resolve({ success: false, error: res?.error || 'Room not found or full' });
        }
      });
    });
  }

  public toggleReady(isReady: boolean) {
    if (this.socket && this.isConnected && this.room) {
      this.socket.emit('zombie:toggle_ready', { code: this.room.code, isReady });
    }
  }

  public startGame() {
    if (this.socket && this.isConnected && this.room) {
      this.socket.emit('zombie:start_game', { code: this.room.code });
    }
  }

  public sendPlayerState(data: Omit<RemotePlayerSync, 'id'>) {
    if (this.socket && this.isConnected && this.room) {
      this.socket.emit('zombie:player_state', {
        code: this.room.code,
        ...data,
      });
    }
  }

  public sendShoot(origin: [number, number, number], dir: [number, number, number], weapon: WeaponType) {
    if (this.socket && this.isConnected && this.room) {
      this.socket.emit('zombie:shoot', {
        code: this.room.code,
        origin,
        dir,
        weapon,
      });
    }
  }

  public sendZombieDamage(zombieId: string, damage: number) {
    if (this.socket && this.isConnected && this.room) {
      this.socket.emit('zombie:zombie_damage', {
        code: this.room.code,
        zombieId,
        damage,
      });
    }
  }

  public sendReviveDone() {
    if (this.socket && this.isConnected && this.room) {
      this.socket.emit('zombie:revive_done', { code: this.room.code });
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.room = null;
    this.remotePlayer = null;
  }
}

export const zombieSocket = new ZombieSocketClient();
