import { io, Socket } from 'socket.io-client';
import { RoomState, RoomPlayer } from './multiplayerTypes';

type EventCallback<T = any> = (data: T) => void;

class MultiplayerClient {
  private socket: Socket | null = null;
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  public myPlayerId: string = 'runner_' + Math.random().toString(36).substring(2, 9);
  public currentRoom: RoomState | null = null;
  public isConnected: boolean = false;
  private isFallbackMode: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Eagerly connect socket on client load
      setTimeout(() => this.init(), 100);
    }
  }

  public init() {
    if (typeof window === 'undefined') return;
    if (this.socket) return;

    // Detect external dedicated socket server URL if configured
    const customSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // On localhost, default to local server; on remote (e.g. Vercel), require NEXT_PUBLIC_SOCKET_URL
    const targetUrl = customSocketUrl || (isLocalhost ? window.location.origin : '');

    if (!targetUrl) {
      // Running on a serverless host (such as Vercel) without external socket server configured.
      // Immediately activate local multi-tab fallback mode without polling 404s.
      this.enableFallbackMode();
      return;
    }

    try {
      this.socket = io(targetUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        timeout: 4000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.isFallbackMode = false;
        if (this.socket?.id) {
          this.myPlayerId = this.socket.id;
        }
        this.emitLocal('connected', { id: this.myPlayerId });
      });

      this.socket.on('connect_error', () => {
        this.enableFallbackMode();
      });

      this.socket.on('room_updated', (room: RoomState) => {
        this.currentRoom = room;
        this.emitLocal('room_updated', room);
      });

      this.socket.on('game_starting', (data: { stageId: number; players: RoomPlayer[] }) => {
        if (this.currentRoom) {
          this.currentRoom.status = 'in_game';
        }
        this.emitLocal('game_starting', data);
      });

      this.socket.on('remote_player_state', (data: any) => {
        this.emitLocal('remote_player_state', data);
      });

      this.socket.on('remote_player_emote', (data: { id: string; emoji: string }) => {
        this.emitLocal('remote_player_emote', data);
      });

      this.socket.on('remote_player_finished', (data: { id: string; rank: number; timeElapsed: number; coins: number }) => {
        this.emitLocal('remote_player_finished', data);
      });

      this.socket.on('player_left', (data: { id: string }) => {
        this.emitLocal('player_left', data);
      });

      this.socket.on('returned_to_lobby', (room: RoomState) => {
        this.currentRoom = room;
        this.emitLocal('returned_to_lobby', room);
      });
    } catch {
      this.enableFallbackMode();
    }
  }

  public isFallback(): boolean {
    return this.isFallbackMode;
  }

  public async waitForConnection(timeoutMs: number = 2000): Promise<boolean> {
    this.init();
    if (this.socket?.connected) return true;
    if (!this.socket) return false;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(this.socket?.connected ?? false);
      }, timeoutMs);

      this.socket?.once('connect', () => {
        clearTimeout(timer);
        resolve(true);
      });

      this.socket?.once('connect_error', () => {
        clearTimeout(timer);
        resolve(false);
      });
    });
  }

  private enableFallbackMode() {
    if (this.isFallbackMode) return;
    this.isFallbackMode = true;
    this.isConnected = true;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      if (!this.channel) {
        this.channel = new BroadcastChannel('runner_royale_local_bus');
        this.channel.onmessage = (event) => {
          const { type, data, senderId } = event.data;
          if (senderId === this.myPlayerId) return;

          if (type === 'room_action') {
            this.handleFallbackRoomAction(data);
          } else if (type === 'remote_player_state') {
            this.emitLocal('remote_player_state', data);
          } else if (type === 'remote_player_emote') {
            this.emitLocal('remote_player_emote', data);
          } else if (type === 'remote_player_finished') {
            this.emitLocal('remote_player_finished', data);
          }
        };

        // Listen for storage events across tabs as secondary sync
        window.addEventListener('storage', (e) => {
          if (e.key?.startsWith('runner_active_room_') && e.newValue) {
            try {
              const updated = JSON.parse(e.newValue);
              if (this.currentRoom && updated.code === this.currentRoom.code) {
                this.currentRoom = updated;
                this.emitLocal('room_updated', updated);
                if (updated.status === 'in_game') {
                  this.emitLocal('game_starting', { stageId: updated.stageId, players: updated.players });
                }
              }
            } catch {
              // ignore
            }
          }
        });
      }
    }
  }

  private handleFallbackRoomAction(data: any) {
    if (data.action === 'room_updated') {
      this.currentRoom = data.room;
      this.emitLocal('room_updated', data.room);
    } else if (data.action === 'game_starting') {
      if (this.currentRoom) {
        this.currentRoom.status = 'in_game';
      }
      this.emitLocal('game_starting', data.payload);
    } else if (data.action === 'returned_to_lobby') {
      this.currentRoom = data.room;
      this.emitLocal('returned_to_lobby', data.room);
    }
  }

  public async createRoom(
    code: string,
    player: { name: string; color: string },
    stageId: number = 1
  ): Promise<{ success: boolean; room?: RoomState; message?: string }> {
    const isSocketConnected = await this.waitForConnection();

    if (isSocketConnected && this.socket) {
      return new Promise((resolve) => {
        this.socket!.emit(
          'create_room',
          { code, player, stageId },
          (res: { success: boolean; room?: RoomState; player?: RoomPlayer; message?: string }) => {
            if (res.success && res.room) {
              this.currentRoom = res.room;
              if (res.player) this.myPlayerId = res.player.id;
            }
            resolve(res);
          }
        );
      });
    }

    // Fallback mode with LocalStorage + BroadcastChannel
    this.enableFallbackMode();
    const roomCode = String(code || Math.floor(100000 + Math.random() * 900000));
    const fallbackRoom: RoomState = {
      code: roomCode,
      hostId: this.myPlayerId,
      stageId,
      status: 'lobby',
      players: [
        {
          id: this.myPlayerId,
          name: player.name || 'Host',
          color: player.color || '#06b6d4',
          isHost: true,
          isReady: true,
        },
      ],
    };

    this.currentRoom = fallbackRoom;
    try {
      localStorage.setItem('runner_active_room_' + roomCode, JSON.stringify(fallbackRoom));
    } catch {
      // ignore
    }
    this.emitFallbackAction('room_updated', { room: fallbackRoom });
    return { success: true, room: fallbackRoom };
  }

  public async joinRoom(
    code: string,
    player: { name: string; color: string }
  ): Promise<{ success: boolean; room?: RoomState; message?: string }> {
    const isSocketConnected = await this.waitForConnection();

    if (isSocketConnected && this.socket) {
      return new Promise((resolve) => {
        this.socket!.emit(
          'join_room',
          { code, player },
          (res: { success: boolean; room?: RoomState; player?: RoomPlayer; message?: string }) => {
            if (res.success && res.room) {
              this.currentRoom = res.room;
              if (res.player) this.myPlayerId = res.player.id;
            }
            resolve(res);
          }
        );
      });
    }

    // Fallback mode with LocalStorage lookup
    this.enableFallbackMode();
    const roomCode = String(code).trim();
    let existingRoom: RoomState | null = null;

    try {
      const saved = localStorage.getItem('runner_active_room_' + roomCode);
      if (saved) existingRoom = JSON.parse(saved);
    } catch {
      // ignore
    }

    if (!existingRoom && this.currentRoom?.code === roomCode) {
      existingRoom = this.currentRoom;
    }

    if (!existingRoom) {
      return {
        success: false,
        message:
          'Room not found! If the room was created on another phone/device, online multiplayer requires connecting a free socket server (NEXT_PUBLIC_SOCKET_URL) because Vercel is serverless.',
      };
    }

    const newPlayer: RoomPlayer = {
      id: this.myPlayerId,
      name: player.name || 'Runner',
      color: player.color || '#ec4899',
      isHost: false,
      isReady: false,
    };

    const updatedRoom: RoomState = {
      ...existingRoom,
      players: [...existingRoom.players.filter((p) => p.id !== this.myPlayerId), newPlayer],
    };

    this.currentRoom = updatedRoom;
    try {
      localStorage.setItem('runner_active_room_' + roomCode, JSON.stringify(updatedRoom));
    } catch {
      // ignore
    }

    this.emitFallbackAction('room_updated', { room: updatedRoom });
    return { success: true, room: updatedRoom };
  }

  public toggleReady(isReady: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('toggle_ready', { isReady });
    } else if (this.currentRoom) {
      const p = this.currentRoom.players.find((pl) => pl.id === this.myPlayerId);
      if (p) {
        p.isReady = isReady;
        try {
          localStorage.setItem('runner_active_room_' + this.currentRoom.code, JSON.stringify(this.currentRoom));
        } catch {
          // ignore
        }
        this.emitFallbackAction('room_updated', { room: this.currentRoom });
        this.emitLocal('room_updated', this.currentRoom);
      }
    }
  }

  public changeStage(stageId: number) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('change_stage', { stageId });
    } else if (this.currentRoom) {
      this.currentRoom.stageId = stageId;
      try {
        localStorage.setItem('runner_active_room_' + this.currentRoom.code, JSON.stringify(this.currentRoom));
      } catch {
        // ignore
      }
      this.emitFallbackAction('room_updated', { room: this.currentRoom });
      this.emitLocal('room_updated', this.currentRoom);
    }
  }

  public startGame() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('start_game');
    } else if (this.currentRoom) {
      this.currentRoom.status = 'in_game';
      const payload = {
        stageId: this.currentRoom.stageId,
        players: this.currentRoom.players,
      };
      try {
        localStorage.setItem('runner_active_room_' + this.currentRoom.code, JSON.stringify(this.currentRoom));
      } catch {
        // ignore
      }
      this.emitFallbackAction('game_starting', { payload });
      this.emitLocal('game_starting', payload);
    }
  }

  public sendPlayerState(data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player_state', data);
    } else if (this.channel) {
      this.channel.postMessage({
        type: 'remote_player_state',
        senderId: this.myPlayerId,
        data: { id: this.myPlayerId, ...data },
      });
    }
  }

  public sendEmote(emoji: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player_emote', { emoji });
    } else if (this.channel) {
      this.channel.postMessage({
        type: 'remote_player_emote',
        senderId: this.myPlayerId,
        data: { id: this.myPlayerId, emoji },
      });
      this.emitLocal('remote_player_emote', { id: this.myPlayerId, emoji });
    }
  }

  public sendFinished(timeElapsed: number, coins: number) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player_finished', { timeElapsed, coins });
    } else if (this.channel) {
      const rank = 1;
      this.channel.postMessage({
        type: 'remote_player_finished',
        senderId: this.myPlayerId,
        data: { id: this.myPlayerId, rank, timeElapsed, coins },
      });
      this.emitLocal('remote_player_finished', { id: this.myPlayerId, rank, timeElapsed, coins });
    }
  }

  public returnToLobby(stageId?: number) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('return_to_lobby', { stageId });
    } else if (this.currentRoom) {
      this.currentRoom.status = 'lobby';
      if (stageId) this.currentRoom.stageId = stageId;
      try {
        localStorage.setItem('runner_active_room_' + this.currentRoom.code, JSON.stringify(this.currentRoom));
      } catch {
        // ignore
      }
      this.emitFallbackAction('returned_to_lobby', { room: this.currentRoom });
      this.emitLocal('returned_to_lobby', this.currentRoom);
    }
  }

  private emitFallbackAction(action: string, payload: any) {
    if (this.channel) {
      this.channel.postMessage({
        type: 'room_action',
        senderId: this.myPlayerId,
        data: { action, ...payload },
      });
    }
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    const list = this.listeners.get(event);
    if (list) {
      list.delete(callback);
    }
  }

  private emitLocal(event: string, data: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((cb) => cb(data));
    }
  }
}

export const multiplayer = new MultiplayerClient();
