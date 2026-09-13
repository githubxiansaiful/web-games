# 2D Character Assets & Final Art Replacement Guide

This directory holds the 2D character sprite sequences, portraits, and thumbnails shared across games in the platform (including Dhaka Parkour and future 2D titles).

---

## 🎨 Replacing Art with Final Production Assets

Any character here can be swapped with final custom art without touching game physics or engine code.

### 1. Folder Structure
Each character folder contains PNG animation sequences with transparent backgrounds:
```
public/images/characters/2d/
├── Full body animated characters/
│   ├── Char 1/with hands/     # KOBRA
│   ├── Char 2/with hands/     # PHANTOM
│   ├── Char 3/with hands/     # STRIKER
│   ├── Char 4/with hands/     # BLAZE
│   └── Enemies/
│       ├── Enemy 1/           # CYBORG
│       └── Enemy 4/           # NIGHTSHADE
└── thumbnails/                # Cropped HUD portraits & bust icons
```

### 2. Animation Frame Naming Conventions
The engine animates through sequential numbered PNG frames:
* **Idle**: `idle_000.png` – `idle_017.png`
* **Walk / Run**: `walk_000.png` – `walk_023.png`
* **Jump Start**: `jumpStart_000.png` – `jumpStart_005.png`
* **Air Fall**: `fall_000.png` – `fall_005.png`
* **Roll / Slide**: `roll_000.png` – `roll_011.png`
* **Landing**: `jumpEnd_000.png` – `jumpEnd_005.png`
* **Death / Knockout**: `dead_000.png` – `dead_029.png`

### 3. Dimensions & Alignment Anchors
* **Source Frame Size**: `2048 x 2048 px` transparent PNGs (or proportional resolution).
* **Ground Anchor Point**: Feet contact point is centered horizontally at `X = 1024` and vertically at `Y = 1785`.
* **In-Game Target Height**: Scaled dynamically to ~`84px` (`scale = 84 / 720`), matching the physics bounding box (`44px` width × `72px` standing height).
* **Safe Fallback**: If frames are missing or still loading, the engine automatically renders high-performance vector silhouettes so the game never crashes or glitches.

### 4. Updating Character Metadata
To modify names, color accents, or stats for new art, edit:
`game/duo-rampage/parkour/character/ParkourCharacters.ts`
