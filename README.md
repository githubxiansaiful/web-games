# 🏃‍♂️ Platformer Run - 2D Action Platformer

A responsive, high-performance 2D platformer built with Next.js, React, HTML5 Canvas 2D, TypeScript, Tailwind CSS, and Web Audio API.

---

## 🎮 Game Features

- **Responsive Physics Engine**:
  - **Run & Accelerate**: Smooth ground acceleration, friction deceleration, and mid-air inertia.
  - **Jump**: Variable height jumping (short hop or full leap) with coyote time and jump buffering.
  - **Double-Jump**: Jump again in mid-air with distinct audio chimes, cyan energy burst particles, and character motion trails.
  - **Squash & Stretch**: Dynamic procedural character squash and stretch during takeoff, landing, and bouncing.
- **Moving Platforms**:
  - Horizontal shuttles and vertical elevator platforms with visual dashed track guides.
  - Direct player-to-platform velocity synchronization (no jitter or slipping).
- **Collectibles**:
  - Spinning golden coins with radiant glow and floating bobbing animations.
  - Coin counter HUD tracking stage completion (`🪙 X / Total`).
  - Floating `+1 COIN` popups and sparkle bursts.
- **Hazards & Enemies**:
  - **Floor Spikes**: Sharp triangular spikes with crimson tips and fair hitboxes.
  - **Moving Sawblades**: Rotating circular buzz saws with metallic teeth.
  - **Slime Crawlers**: Bouncy patrolling slimes that can be stomped from above for a bounce boost (`+100` score) or hurt on side contact.
  - **Bottomless Pits**: Hazardous fall zones triggering screen shake and particle bursts.
- **Checkpoint System**:
  - Visual stone beacons with flags.
  - Passing a checkpoint activates it with an emerald glow, harmonic chord chime, and particle burst.
  - On hazard contact or pit fall, the player instantly respawns at the active checkpoint with brief flash invulnerability.
- **Goal Flag & Level Complete**:
  - Golden victory flagpole at the end of each stage.
  - Reaching the goal triggers a triumphant victory fanfare, confetti fireworks, and stage victory modal.
  - Displays clear time vs par time, coins collected, death count, and 1 to 3 star ratings.
- **Level Selection**:
  - **Stage 1: Greenhorn Grasslands** - Learn running, jumping, double-jumping, moving platforms, and checkpoints.
  - **Stage 2: Clockwork Cavern** - Moving gears, vertical elevators, spike chasms, and sawblades.
  - **Stage 3: Starlight Skyway** - Super spring bounce pads, fast moving sky platforms, and high precision platforming.
  - Level progress (stars, best times, coins found) is automatically saved to `localStorage`.
- **Audio Engine (Web Audio API)**:
  - 100% procedurally synthesized retro sound effects (no external audio files needed).
  - Jump, Double-jump, Coin pickup, Checkpoint activation, Enemy stomp, Hazard death, and Victory fanfare.
  - Mute/Unmute audio toggle in the HUD.
- **Touch / Mobile Support**:
  - On-screen virtual buttons for Left, Right, and Jump on touch-capable devices.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `←` / `→` | Left / Right On-Screen Arrows |
| **Jump** | `W`, `↑`, or `Space` | On-Screen Jump Button |
| **Double Jump** | Press Jump again in mid-air | Tap Jump again in mid-air |
| **Quick Respawn (Checkpoint)** | `R` | - |
| **Full Stage Restart** | `Shift + R` | HUD Restart Button |
| **Pause / Resume** | `Escape` or `P` | HUD Pause Button |
| **Toggle Sound** | HUD Sound Icon | HUD Sound Icon |
| **Stage Select** | HUD "Levels" Button | HUD "Levels" Button |

---

## 🚀 Running the Game

To start the local development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your web browser.

To create an optimized production build:

```bash
npm run build
npm start
```
