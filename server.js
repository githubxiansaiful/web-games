const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory room store for active multiplayer sessions
const rooms = new Map();
const zombieRooms = new Map();
const duoRooms = new Map();

function getOrCreateDuoRoom(code) {
  if (!duoRooms.has(code)) {
    duoRooms.set(code, {
      code,
      hostId: null,
      status: 'lobby',
      players: new Map(),
      createdAt: Date.now(),
    });
  }
  return duoRooms.get(code);
}

function serializeDuoRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    players: Array.from(room.players.values()),
    createdAt: room.createdAt,
  };
}

function getOrCreateZombieRoom(code) {
  if (!zombieRooms.has(code)) {
    zombieRooms.set(code, {
      code,
      hostId: null,
      status: 'lobby',
      players: new Map(),
      createdAt: Date.now(),
    });
  }
  return zombieRooms.get(code);
}

function serializeZombieRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    players: Array.from(room.players.values()),
    createdAt: room.createdAt,
  };
}

function getOrCreateRoom(code, gameType = 'runner') {
  if (!rooms.has(code)) {
    rooms.set(code, {
      code,
      gameType,
      hostId: null,
      stageId: 1,
      status: 'lobby', // 'lobby' | 'countdown' | 'in_game' | 'finished'
      players: new Map(),
      finishCounter: 0,
      createdAt: Date.now(),
    });
  }
  return rooms.get(code);
}

function serializeRoom(room) {
  return {
    code: room.code,
    gameType: room.gameType || 'runner',
    hostId: room.hostId,
    stageId: room.stageId,
    status: room.status,
    players: Array.from(room.players.values()),
  };
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    let currentRoomCode = null;

    // 1. Create Room
    socket.on('create_room', ({ code, player, stageId }, callback) => {
      const roomCode = String(code || Math.floor(100000 + Math.random() * 900000));
      const room = getOrCreateRoom(roomCode, 'runner');

      currentRoomCode = roomCode;
      socket.join(roomCode);

      const playerData = {
        id: socket.id,
        name: player.name || 'Runner ' + socket.id.slice(0, 4),
        color: player.color || '#06b6d4',
        isHost: true,
        isReady: true,
      };

      room.hostId = socket.id;
      room.stageId = stageId || 1;
      room.status = 'lobby';
      room.finishCounter = 0;
      room.players.set(socket.id, playerData);

      if (callback) callback({ success: true, room: serializeRoom(room), player: playerData });
      io.to(roomCode).emit('room_updated', serializeRoom(room));
    });

    // 2. Join Room
    socket.on('join_room', ({ code, player }, callback) => {
      const roomCode = String(code).trim();
      const room = rooms.get(roomCode);

      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found! Check the room code.' });
        return;
      }

      if (room.status === 'in_game') {
        if (callback) callback({ success: false, message: 'Game already in progress in this room!' });
        return;
      }

      if (room.players.size >= 8) {
        if (callback) callback({ success: false, message: 'Room is full (maximum 8 players).' });
        return;
      }

      currentRoomCode = roomCode;
      socket.join(roomCode);

      const playerData = {
        id: socket.id,
        name: player.name || 'Runner ' + socket.id.slice(0, 4),
        color: player.color || '#ec4899',
        isHost: room.players.size === 0,
        isReady: false,
      };

      if (room.players.size === 0) {
        room.hostId = socket.id;
      }

      room.players.set(socket.id, playerData);

      if (callback) callback({ success: true, room: serializeRoom(room), player: playerData });
      io.to(roomCode).emit('room_updated', serializeRoom(room));
    });

    // 3. Toggle Ready
    socket.on('toggle_ready', ({ isReady }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const p = room.players.get(socket.id);
      if (p) {
        p.isReady = isReady;
        io.to(currentRoomCode).emit('room_updated', serializeRoom(room));
      }
    });

    // 4. Change Stage (Host only)
    socket.on('change_stage', ({ stageId }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== socket.id) return;

      room.stageId = stageId;
      io.to(currentRoomCode).emit('room_updated', serializeRoom(room));
    });

    // 5. Start Game (Host only)
    socket.on('start_game', () => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const p = room.players.get(socket.id);
      const isHost = p?.isHost || room.hostId === socket.id;
      if (!isHost) {
        console.warn(`[Socket] start_game ignored: ${socket.id} is not host of room ${currentRoomCode}`);
        return;
      }

      console.log(`[Socket] Starting game in room ${currentRoomCode} with ${room.players.size} runners!`);
      room.status = 'in_game';
      room.finishCounter = 0;

      // Broadcast game_starting and room_updated to ALL players in the room
      io.to(currentRoomCode).emit('game_starting', {
        stageId: room.stageId,
        players: Array.from(room.players.values()),
      });
      io.to(currentRoomCode).emit('room_updated', serializeRoom(room));
    });

    // 6. Realtime Player Physics State Relay (High frequency)
    socket.on('player_state', (data) => {
      if (!currentRoomCode) return;
      // Broadcast to other players in room (exclude sender)
      socket.to(currentRoomCode).emit('remote_player_state', {
        id: socket.id,
        ...data,
      });
    });

    // 7. Player Emote / Ping
    socket.on('player_emote', ({ emoji }) => {
      if (!currentRoomCode) return;
      io.to(currentRoomCode).emit('remote_player_emote', {
        id: socket.id,
        emoji,
      });
    });

    // 8. Player Finished Race
    socket.on('player_finished', ({ timeElapsed, coins }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      room.finishCounter += 1;
      const rank = room.finishCounter;

      io.to(currentRoomCode).emit('remote_player_finished', {
        id: socket.id,
        rank,
        timeElapsed,
        coins,
      });
    });

    // 9. Return to Lobby or Next Stage
    socket.on('return_to_lobby', ({ stageId }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== socket.id) return;

      room.status = 'lobby';
      room.finishCounter = 0;
      if (stageId) room.stageId = stageId;
      for (const p of room.players.values()) {
        if (!p.isHost) p.isReady = false;
      }

      io.to(currentRoomCode).emit('returned_to_lobby', serializeRoom(room));
    });

    // ============================================================
    // ZOMBIE HAVEN 2-PLAYER CO-OP EVENTS
    // ============================================================
    let currentZombieRoomCode = null;

    socket.on('zombie:create_room', ({ playerName }, callback) => {
      const code = 'ZH' + Math.floor(1000 + Math.random() * 9000);
      const room = getOrCreateZombieRoom(code);
      currentZombieRoomCode = code;
      socket.join(code);

      const playerData = {
        id: socket.id,
        name: playerName || 'Survivor 1',
        isHost: true,
        isReady: true,
      };

      room.hostId = socket.id;
      room.players.set(socket.id, playerData);

      if (callback) callback({ success: true, room: serializeZombieRoom(room) });
      io.to(code).emit('zombie:room_updated', serializeZombieRoom(room));
    });

    socket.on('zombie:join_room', ({ code, playerName }, callback) => {
      const roomCode = String(code).trim().toUpperCase();
      const room = zombieRooms.get(roomCode);

      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found! Check room code.' });
        return;
      }

      if (room.players.size >= 2) {
        if (callback) callback({ success: false, error: 'Room is full (maximum 2 survivors).' });
        return;
      }

      currentZombieRoomCode = roomCode;
      socket.join(roomCode);

      const playerData = {
        id: socket.id,
        name: playerName || 'Survivor 2',
        isHost: false,
        isReady: false,
      };

      room.players.set(socket.id, playerData);

      if (callback) callback({ success: true, room: serializeZombieRoom(room) });
      io.to(roomCode).emit('zombie:room_updated', serializeZombieRoom(room));
    });

    socket.on('zombie:toggle_ready', ({ code, isReady }) => {
      const roomCode = code || currentZombieRoomCode;
      if (!roomCode) return;
      const room = zombieRooms.get(roomCode);
      if (!room) return;

      const p = room.players.get(socket.id);
      if (p) {
        p.isReady = isReady;
        io.to(roomCode).emit('zombie:room_updated', serializeZombieRoom(room));
      }
    });

    socket.on('zombie:start_game', ({ code }) => {
      const roomCode = code || currentZombieRoomCode;
      if (!roomCode) return;
      const room = zombieRooms.get(roomCode);
      if (!room) return;

      room.status = 'playing';
      io.to(roomCode).emit('zombie:game_starting', serializeZombieRoom(room));
    });

    socket.on('zombie:player_state', ({ code, ...state }) => {
      const roomCode = code || currentZombieRoomCode;
      if (!roomCode) return;
      socket.to(roomCode).emit('zombie:remote_player_state', {
        id: socket.id,
        ...state,
      });
    });

    socket.on('zombie:shoot', ({ code, origin, dir, weapon }) => {
      const roomCode = code || currentZombieRoomCode;
      if (!roomCode) return;
      socket.to(roomCode).emit('zombie:remote_shoot', {
        id: socket.id,
        origin,
        dir,
        weapon,
      });
    });

    socket.on('zombie:zombie_damage', ({ code, zombieId, damage }) => {
      const roomCode = code || currentZombieRoomCode;
      if (!roomCode) return;
      socket.to(roomCode).emit('zombie:remote_zombie_damage', {
        zombieId,
        damage,
      });
    });

    socket.on('zombie:revive_done', ({ code }) => {
      const roomCode = code || currentZombieRoomCode;
      if (!roomCode) return;
      socket.to(roomCode).emit('zombie:remote_revived');
    });

    // ============================================================
    // DUO RAMPAGE 2-PLAYER CO-OP EVENTS
    // ============================================================
    let currentDuoRoomCode = null;

    socket.on('duo:create_room', ({ playerName, avatar }, callback) => {
      let code;
      let attempts = 0;
      do {
        code = '#' + Math.floor(100000 + Math.random() * 900000);
        attempts++;
      } while (duoRooms.has(code) && attempts < 10);

      const room = getOrCreateDuoRoom(code);
      currentDuoRoomCode = code;
      socket.join(code);

      const playerData = {
        id: socket.id,
        name: playerName || 'Hero 1',
        avatar: avatar || null,
        role: 'assault',
        isHost: true,
        isReady: true,
      };

      room.hostId = socket.id;
      room.players.set(socket.id, playerData);

      if (callback) callback({ success: true, room: serializeDuoRoom(room) });
      io.to(code).emit('duo:room_updated', serializeDuoRoom(room));
    });

    socket.on('duo:join_room', ({ code, playerName, avatar }, callback) => {
      let formattedCode = String(code).trim();
      if (!formattedCode.startsWith('#')) formattedCode = '#' + formattedCode;

      const room = duoRooms.get(formattedCode);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found! Check your 6-digit code.' });
        return;
      }

      if (room.players.size >= 2) {
        if (callback) callback({ success: false, error: 'Room is full (Maximum 2 players).' });
        return;
      }

      currentDuoRoomCode = formattedCode;
      socket.join(formattedCode);

      const playerData = {
        id: socket.id,
        name: playerName || 'Hero 2',
        avatar: avatar || null,
        role: 'heavy',
        isHost: false,
        isReady: false,
      };

      room.players.set(socket.id, playerData);

      if (callback) callback({ success: true, room: serializeDuoRoom(room) });
      io.to(formattedCode).emit('duo:room_updated', serializeDuoRoom(room));
    });

    socket.on('duo:toggle_ready', ({ code, isReady }) => {
      const roomCode = code || currentDuoRoomCode;
      if (!roomCode) return;
      const room = duoRooms.get(roomCode);
      if (!room) return;

      const p = room.players.get(socket.id);
      if (p) {
        p.isReady = isReady;
        io.to(roomCode).emit('duo:room_updated', serializeDuoRoom(room));
      }
    });

    socket.on('duo:start_game', ({ code }) => {
      const roomCode = code || currentDuoRoomCode;
      if (!roomCode) return;
      const room = duoRooms.get(roomCode);
      if (!room) return;

      room.status = 'countdown';
      io.to(roomCode).emit('duo:room_updated', serializeDuoRoom(room));

      let count = 3;
      const interval = setInterval(() => {
        io.to(roomCode).emit('duo:countdown', count);
        count--;
        if (count < 0) {
          clearInterval(interval);
          room.status = 'playing';
          io.to(roomCode).emit('duo:game_start');
        }
      }, 1000);
    });

    socket.on('duo:player_state', ({ code, ...state }) => {
      const roomCode = code || currentDuoRoomCode;
      if (!roomCode) return;
      socket.to(roomCode).emit('duo:remote_player_state', {
        id: socket.id,
        ...state,
      });
    });

    socket.on('duo:shoot', ({ code, origin, dir, weapon }) => {
      const roomCode = code || currentDuoRoomCode;
      if (!roomCode) return;
      socket.to(roomCode).emit('duo:remote_shoot', {
        id: socket.id,
        origin,
        dir,
        weapon,
      });
    });

    socket.on('duo:revive_done', ({ code }) => {
      const roomCode = code || currentDuoRoomCode;
      if (!roomCode) return;
      socket.to(roomCode).emit('duo:remote_revived');
    });

    socket.on('duo:leave_room', ({ code }) => {
      const roomCode = code || currentDuoRoomCode;
      if (!roomCode) return;
      const room = duoRooms.get(roomCode);
      if (room) {
        room.players.delete(socket.id);
        socket.leave(roomCode);
        if (room.players.size === 0) {
          duoRooms.delete(roomCode);
        } else {
          io.to(roomCode).emit('duo:room_updated', serializeDuoRoom(room));
        }
      }
      currentDuoRoomCode = null;
    });

    // 10. Handle Disconnect
    socket.on('disconnect', () => {
      if (currentRoomCode) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(socket.id);
          io.to(currentRoomCode).emit('player_left', { id: socket.id });

          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          } else {
            // Reassign host if host left
            if (room.hostId === socket.id) {
              const firstRemaining = room.players.keys().next().value;
              room.hostId = firstRemaining;
              const newHost = room.players.get(firstRemaining);
              if (newHost) newHost.isHost = true;
            }
            io.to(currentRoomCode).emit('room_updated', serializeRoom(room));
          }
        }
      }

      if (currentZombieRoomCode) {
        const zRoom = zombieRooms.get(currentZombieRoomCode);
        if (zRoom) {
          zRoom.players.delete(socket.id);
          if (zRoom.players.size === 0) {
            zombieRooms.delete(currentZombieRoomCode);
          } else {
            io.to(currentZombieRoomCode).emit('zombie:room_updated', serializeZombieRoom(zRoom));
          }
        }
      }

      if (currentDuoRoomCode) {
        const dRoom = duoRooms.get(currentDuoRoomCode);
        if (dRoom) {
          dRoom.players.delete(socket.id);
          if (dRoom.players.size === 0) {
            duoRooms.delete(currentDuoRoomCode);
          } else {
            io.to(currentDuoRoomCode).emit('duo:room_updated', serializeDuoRoom(dRoom));
          }
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Xian's Game World ready on http://localhost:${port}`);
    console.log(`> Network access: http://${hostname}:${port}`);
    console.log(`> Multiplayer Socket.io server running`);
  });
});
