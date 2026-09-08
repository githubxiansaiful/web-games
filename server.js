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
    socket.on('create_room', ({ code, player, stageId, gameType }, callback) => {
      const roomCode = String(code || Math.floor(100000 + Math.random() * 900000));
      const room = getOrCreateRoom(roomCode, gameType || 'runner');

      currentRoomCode = roomCode;
      socket.join(roomCode);

      const defaultPrefix = gameType === 'village' ? 'Outlaw ' : 'Runner ';
      const playerData = {
        id: socket.id,
        name: player.name || defaultPrefix + socket.id.slice(0, 4),
        color: player.color || (gameType === 'village' ? '#22c55e' : '#06b6d4'),
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

      const maxLimit = room.gameType === 'village' ? 2 : 8;
      if (room.players.size >= maxLimit) {
        if (callback) callback({ success: false, message: `Room is full (maximum ${maxLimit} players for this game).` });
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

    // 7b. Village Real-Time Synchronizations (2-Player Co-Op)
    socket.on('village_player_sync', (data) => {
      if (!currentRoomCode) return;
      socket.to(currentRoomCode).emit('remote_village_player_sync', {
        id: socket.id,
        ...data,
      });
    });

    socket.on('village_shoot_sync', (data) => {
      if (!currentRoomCode) return;
      socket.to(currentRoomCode).emit('remote_village_shoot_sync', {
        shooterId: socket.id,
        ...data,
      });
    });

    socket.on('village_action_sync', (data) => {
      if (!currentRoomCode) return;
      socket.to(currentRoomCode).emit('remote_village_action_sync', {
        senderId: socket.id,
        ...data,
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
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Xian's Game World ready on http://localhost:${port}`);
    console.log(`> Network access: http://${hostname}:${port}`);
    console.log(`> Multiplayer Socket.io server running`);
  });
});
