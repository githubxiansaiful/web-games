/**
 * Dedicated Lightweight Socket.io Server for Platformer Run (Runner Royale)
 * 
 * Perfect for free 1-click deployment on Render, Railway, Fly.io, or Heroku
 * to provide online multiplayer for your Vercel-hosted frontend!
 */

const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = parseInt(process.env.PORT || '3001', 10);

// In-memory room store
const rooms = new Map();
const zombieRooms = new Map();

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

function getOrCreateRoom(code) {
  if (!rooms.has(code)) {
    rooms.set(code, {
      code,
      hostId: null,
      stageId: 1,
      status: 'lobby', // 'lobby' | 'in_game'
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
    hostId: room.hostId,
    stageId: room.stageId,
    status: room.status,
    players: Array.from(room.players.values()),
  };
}

// HTTP Server with Health Check endpoint
const httpServer = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'Runner Royale Multiplayer Socket Server',
        activeRooms: rooms.size,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Attach Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

io.on('connection', (socket) => {
  let currentRoomCode = null;

  // 1. Create Room
  socket.on('create_room', ({ code, player, stageId }, callback) => {
    const roomCode = String(code || Math.floor(100000 + Math.random() * 900000));
    const room = getOrCreateRoom(roomCode);

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
      if (callback) callback({ success: false, message: 'Room not found! Check room code.' });
      return;
    }

    if (room.status === 'in_game') {
      if (callback) callback({ success: false, message: 'Race already in progress in this room!' });
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

  // 4. Change Stage
  socket.on('change_stage', ({ stageId }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;

    room.stageId = stageId;
    io.to(currentRoomCode).emit('room_updated', serializeRoom(room));
  });

  // 5. Start Game
  socket.on('start_game', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const p = room.players.get(socket.id);
    const isHost = p?.isHost || room.hostId === socket.id;
    if (!isHost) return;

    room.status = 'in_game';
    room.finishCounter = 0;

    io.to(currentRoomCode).emit('game_starting', {
      stageId: room.stageId,
      players: Array.from(room.players.values()),
    });
    io.to(currentRoomCode).emit('room_updated', serializeRoom(room));
  });

  // 6. High-Frequency Player State Relay
  socket.on('player_state', (data) => {
    if (!currentRoomCode) return;
    socket.to(currentRoomCode).emit('remote_player_state', {
      id: socket.id,
      ...data,
    });
  });

  // 7. Emotes
  socket.on('player_emote', ({ emoji }) => {
    if (!currentRoomCode) return;
    io.to(currentRoomCode).emit('remote_player_emote', {
      id: socket.id,
      emoji,
    });
  });

  // 8. Player Finished
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

    // 9. Return to Lobby
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

    // 10. Disconnect
    socket.on('disconnect', () => {
      if (currentRoomCode) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(socket.id);
          io.to(currentRoomCode).emit('player_left', { id: socket.id });

          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          } else {
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
    });
});

httpServer.listen(PORT, () => {
  console.log(`> Standalone Socket.io server running on port ${PORT}`);
  console.log(`> Health check available at http://localhost:${PORT}/health`);
});
