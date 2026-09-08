# 🏃‍♂️ Platformer Run - 2D Multiplayer Action Platformer

A responsive, high-performance 2D multiplayer platformer built with Next.js, React, HTML5 Canvas 2D, TypeScript, Tailwind CSS, Socket.io, and Web Audio API.

---

## 🌐 Real-Time Multiplayer Features

- **Gaming Home Page ([`HomePage.tsx`](file:///D:/NextJs%20Projects/platformer-run/components/HomePage.tsx))**:
  - **Runner Customizer**: Choose your runner handle (with a randomizer dice 🎲) and select from 6 vibrant neon suits (Cyber Cyan, Neon Pink, Emerald Lime, Solar Gold, Flame Orange, Phantom Purple).
  - **Mode Selection**:
    - **Create Room**: Generates a 6-digit room code (e.g. `123456`) and opens the match lobby.
    - **Join Room**: Enter any 6-digit room number to join a friend's lobby.
    - **Solo Practice**: Play the single-player campaign to practice speedruns and collect coins.
- **Match Lobby ([`RoomLobby.tsx`](file:///D:/NextJs%20Projects/platformer-run/components/RoomLobby.tsx))**:
  - Displays room code with a 1-click **Copy Code** button to easily invite friends.
  - Stage selection (Host can pick Stage 1, 2, or 3).
  - Runner roster showing connected players with their custom colors, Host badge, and Ready checkmarks.
  - Interactive lobby emote bar (👋, 🔥, 🚀, 👑, ⚡, 🎉, 💀).
- **In-Game Multiplayer Racing**:
  - **Live Opponent Rendering**: Other runners appear on your screen in real time with their chosen suit color, name tag, animated cape, and running/jumping physics.
  - **Race Leader Crown 👑**: The runner currently furthest ahead in the stage dynamically wears a sparkling gold crown!
  - **Live Race Standings HUD ([`MultiplayerRaceHUD.tsx`](file:///D:/NextJs%20Projects/platformer-run/components/MultiplayerRaceHUD.tsx))**: Shows all players ranked by stage progress percentage or finish placement.
  - **In-Game Emotes**: Tap/click quick emote buttons (🚀, 👋, 💀, 🎉, ⚡) to pop speech bubbles above your runner's head mid-race.
  - **3-Tier Podium Modal ([`MultiplayerPodiumModal.tsx`](file:///D:/NextJs%20Projects/platformer-run/components/MultiplayerPodiumModal.tsx))**: Celebratory podium ceremony (🥇 1st, 🥈 2nd, 🥉 3rd) with clear times, coins collected, and host controls to play the next stage.
- **Robust Networking ([`server.js`](file:///D:/NextJs%20Projects/platformer-run/server.js), [`multiplayerClient.ts`](file:///D:/NextJs%20Projects/platformer-run/lib/multiplayerClient.ts))**:
  - Real-time Socket.io server integrated directly into the HTTP server.
  - Dual-mode networking with seamless `BroadcastChannel` fallback for testing across multiple tabs on the same machine without server restarts.

---

## 🎮 Game Mechanics

- **Physics & Movement**:
  - Smooth ground acceleration and air control via Arrow keys, WASD, or on-screen touch buttons.
  - Variable jump height (short hop or high leap) with 120ms coyote time and jump buffering.
  - Double-jump mid-air with audio chimes and cyan particle bursts.
  - Dynamic squash and stretch on landing and takeoff.
- **Moving Platforms**:
  - Horizontal and vertical platforms with visual dashed track guides.
  - Zero-slip velocity transfer when standing on moving platforms.
- **Collectibles & Hazards**:
  - Spinning golden coins with radiant glow and `+1 COIN` floaters.
  - Floor spikes with fair collision insets.
  - Moving buzz saws and bouncy patroller slimes (can be stomped for `+100` score boost!).
- **Checkpoint & Respawn**:
  - Activating stone checkpoints gives harmonic chord chime and emerald banner wave.
  - On death, instant respawn at the active checkpoint with invulnerability flash.

---

## 🕹️ Controls Guide

| Action | Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `←` / `→` | Left / Right On-Screen Arrows |
| **Jump** | `W`, `↑`, or `Space` | Big Jump Button |
| **Double Jump** | Press Jump again in mid-air | Tap Jump again in mid-air |
| **Quick Respawn (Checkpoint)** | `R` | Mini Respawn Button |
| **Full Stage Restart** | `Shift + R` | HUD Restart Button |
| **Pause / Resume** | `Escape` or `P` | HUD Pause Button |
| **In-Game Emotes** | Click emote bar | Tap on-screen emote icons |
| **Toggle Sound** | HUD Sound Icon | HUD Sound Icon |
| **Toggle Fullscreen** | HUD Fullscreen Icon | HUD Fullscreen Icon |

---

## 🚀 How to Run & Play Multiplayer

1. Start the server:
   ```powershell
   npm run dev
   ```
2. Open your browser to [http://localhost:3000](http://localhost:3000).
3. **Host a Game**:
   - Customize your name and suit color.
   - Click **Create Room** -> A room code like `123456` will be generated.
4. **Join from Another Browser Tab, Laptop, or Phone**:
   - Open [http://localhost:3000](http://localhost:3000) (or `http://<your-ip>:3000` from another device on the same Wi-Fi).
   - Click **Join Room**, enter the room code (e.g. `123456`), and click **Join Room Now**!
5. In the Lobby, click **Ready Up!** and the Host clicks **START RACE NOW!** to race across the stage in real time!
