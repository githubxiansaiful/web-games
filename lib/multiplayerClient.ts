import { io, Socket } from 'socket.io-client';
import { RoomState, RoomPlayer } from './multiplayerTypes';

type EventCallback<T = any> = (data: T) => void;

class MultiplayerClient {
  private socket: Socket | null = null;
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  public myPlayerId: string = 'local_' + Math.random().toString(36).substring(2, 9);
  public currentRoom: RoomState | null = null;
  public isConnected: boolean = false;
  private isFallbackMode: boolean = false;

  constructor() {
    // Lazy initialized when joining or creating room
  }

  public init() {
    if (typeof window === 'undefined') return;
    if (this.socket) return;

    try {
      // Connect to same origin
      const socketUrl = window.location.origin;
      this.socket = io(socketUrl, {
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
        // Fallback to BroadcastChannel for local/multi-tab play if socket server not running
        this.enableFallbackMode();
      });

      this.socket.on('room_updated', (room: RoomState) => {
        this.currentRoom = room;
        this.emitLocal('room_updated', room);
      });

      this.socket.on('game_starting', (data: { stageId: number; players: RoomPlayer[] }) => {
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

  private enableFallbackMode() {
    if (this.isFallbackMode) return;
    this.isFallbackMode = true;
    this.isConnected = true;

    // Use BroadcastChannel for multi-tab fallback
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      if (!this.channel) {
        this.channel = new BroadcastChannel('runner_royale_local_bus');
        this.channel.onmessage = (event) => {
          const { type, data, senderId } = event.data;
          if (senderId === this.myPlayerId) return; // skip own

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
      }
    }
  }

  private handleFallbackRoomAction(data: any) {
    if (data.action === 'room_updated') {
      this.currentRoom = data.room;
      this.emitLocal('room_updated', data.room);
    } else if (data.action === 'game_starting') {
      this.emitLocal('game_starting', data.payload);
    } else if (data.action === 'returned_to_lobby') {
      this.currentRoom = data.room;
      this.emitLocal('returned_to_lobby', data.room);
    }
  }

  public createRoom(
    code: string,
    player: { name: string; color: string },
    stageId: number = 1
  ): Promise<{ success: boolean; room?: RoomState; message?: string }> {
    this.init();

    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
        this.socket.emit(
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
      } else {
        // Fallback local room creation
        this.enableFallbackMode();
        const fallbackRoom: RoomState = {
          code: String(code || Math.floor(100000 + Math.random() * 900000)),
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
        this.emitFallbackAction('room_updated', { room: fallbackRoom });
        resolve({ success: true, room: fallbackRoom });
      }
    });
  }

  public joinRoom(
    code: string,
    player: { name: string; color: string }
  ): Promise<{ success: boolean; room?: RoomState; message?: string }> {
    this.init();

    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
        this.socket.emit(
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
      } else {
        // Fallback mode join attempt
        this.enableFallbackMode();
        // If room exists in fallback broadcast
        const fallbackRoom = this.currentRoom || {
          code,
          hostId: 'host_fallback',
          stageId: 1,
          status: 'lobby' as const,
          players: [],
        };

        const newPlayer: RoomPlayer = {
          id: this.myPlayerId,
          name: player.name || 'Runner',
          color: player.color || '#ec4899',
          isHost: fallbackRoom.players.length === 0,
          isReady: false,
        };

        const updatedRoom = {
          ...fallbackRoom,
          players: [...fallbackRoom.players.filter((p) => p.id !== this.myPlayerId), newPlayer],
        };

        this.currentRoom = updatedRoom;
        this.emitFallbackAction('room_updated', { room: updatedRoom });
        resolve({ success: true, room: updatedRoom });
      }
    });
  }

  public toggleReady(isReady: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('toggle_ready', { isReady });
    } else if (this.currentRoom) {
      const p = this.currentRoom.players.find((pl) => pl.id === this.myPlayerId);
      if (p) {
        p.isReady = isReady;
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
