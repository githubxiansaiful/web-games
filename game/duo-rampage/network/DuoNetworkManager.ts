/**
 * DUO RAMPAGE - Multiplayer Network Client
 * Real-time Socket.io room management and dual-player synchronization.
 * Supports 6-digit room IDs (#123456), authoritative state broadcast, and friendly error handlers.
 */

import { io, Socket } from 'socket.io-client';
import { DuoRoomData, PlayerRole, WeaponType } from '../types';

export class DuoNetworkManager {
  private static instance: DuoNetworkManager;
  private socket: Socket | null = null;
  public room: DuoRoomData | null = null;
  public myId: string = '';
  public isHost: boolean = false;
  public myRole: PlayerRole = 'assault';

  // Event Callbacks
  public onRoomUpdated?: (room: DuoRoomData) => void;
  public onGameStartCountdown?: (num: number) => void;
  public onGameStarted?: () => void;
  public onRemotePlayerState?: (state: any) => void;
  public onRemoteShoot?: (data: { origin: any; dir: any; weapon: WeaponType }) => void;
  public onRemoteRevived?: () => void;
  public onError?: (msg: string) => void;

  private constructor() {}

  public static getInstance(): DuoNetworkManager {
    if (!DuoNetworkManager.instance) {
      DuoNetworkManager.instance = new DuoNetworkManager();
    }
    return DuoNetworkManager.instance;
  }

  public connect(): Promise<void> {
    if (this.socket && this.socket.connected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        this.myId = this.socket?.id || '';
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        this.onError?.('Failed to connect to the game server. Please check your internet connection.');
        reject(err);
      });

      this.setupListeners();
    });
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('duo:room_updated', (room: DuoRoomData) => {
      this.room = room;
      this.onRoomUpdated?.(room);
    });

    this.socket.on('duo:countdown', (num: number) => {
      this.onGameStartCountdown?.(num);
    });

    this.socket.on('duo:game_start', () => {
      this.onGameStarted?.();
    });

    this.socket.on('duo:remote_player_state', (state: any) => {
      this.onRemotePlayerState?.(state);
    });

    this.socket.on('duo:remote_shoot', (data: any) => {
      this.onRemoteShoot?.(data);
    });

    this.socket.on('duo:remote_revived', () => {
      this.onRemoteRevived?.();
    });
  }

  public createRoom(playerName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject('Socket not connected');

      this.socket.emit('duo:create_room', { playerName }, (res: any) => {
        if (res.success) {
          this.room = res.room;
          this.isHost = true;
          this.myRole = 'assault';
          resolve(res.room.code);
        } else {
          this.onError?.(res.error || 'Could not create room.');
          reject(res.error);
        }
      });
    });
  }

  public joinRoom(code: string, playerName: string): Promise<DuoRoomData> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject('Socket not connected');

      // Normalize code: accept "123456" or "#123456"
      const cleanCode = code.trim().startsWith('#') ? code.trim() : `#${code.trim()}`;

      this.socket.emit('duo:join_room', { code: cleanCode, playerName }, (res: any) => {
        if (res.success) {
          this.room = res.room;
          this.isHost = false;
          this.myRole = 'heavy';
          resolve(res.room);
        } else {
          this.onError?.(res.error || 'Room not found! Please check the 6-digit code.');
          reject(res.error);
        }
      });
    });
  }

  public toggleReady(isReady: boolean) {
    if (!this.socket || !this.room) return;
    this.socket.emit('duo:toggle_ready', { code: this.room.code, isReady });
  }

  public startGame() {
    if (!this.socket || !this.room) return;
    this.socket.emit('duo:start_game', { code: this.room.code });
  }

  public sendPlayerState(state: any) {
    if (!this.socket || !this.room) return;
    this.socket.emit('duo:player_state', { code: this.room.code, ...state });
  }

  public sendShoot(origin: any, dir: any, weapon: WeaponType) {
    if (!this.socket || !this.room) return;
    this.socket.emit('duo:shoot', { code: this.room.code, origin, dir, weapon });
  }

  public sendReviveSuccess() {
    if (!this.socket || !this.room) return;
    this.socket.emit('duo:revive_done', { code: this.room.code });
  }

  public leaveRoom() {
    if (this.socket && this.room) {
      this.socket.emit('duo:leave_room', { code: this.room.code });
      this.room = null;
    }
  }
}

export const duoNetwork = DuoNetworkManager.getInstance();
