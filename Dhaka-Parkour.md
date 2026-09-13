# DUO RAMPAGE: Dhaka PARKOUR

## Full Game Development Specification

**Goal:** Add a polished 2D cinematic parkour mode to the existing DUO
RAMPAGE browser game. Reuse the existing Home, Create Room, Join Room,
Room ID, Lobby, multiplayer connection, UI foundation, and save
infrastructure wherever possible.

**Modes:** Solo and 2 Player Online Cooperative\
**Campaign target:** 12 levels, minimum 60 minutes of real first
playthrough content\
**Target:** Mobile landscape first, desktop browser supported\
**Rendering:** Prefer the existing renderer. For a new 2D renderer, use
Canvas 2D rather than hundreds of HTML elements.

------------------------------------------------------------------------

## 1. Non Negotiable Rule: Do Not Rebuild The Existing Game

The existing platform already has:

-   Home page
-   Create Room
-   Join Room
-   Six digit room IDs
-   Lobby
-   Player connection flow
-   Existing multiplayer foundation

Parkour is a **new game mode**, not a replacement.

Expected flow:

``` text
HOME
├── CREATE ROOM
│   └── PARKOUR
│       ├── SOLO
│       └── DUO
└── JOIN ROOM
    └── PARKOUR
        └── PLAY
```

Reuse existing routing, room state, networking, buttons, fonts,
settings, and common UI where practical.

Never rewrite a working system simply to make the new mode easier.

------------------------------------------------------------------------

# 2. Game Vision

DUO RAMPAGE: Dhaka PARKOUR is a fast cinematic 2D side scrolling urban parkour
game.

The player runs through a Dhaka inspired city using:

-   Sprint
-   Jump
-   Double jump
-   Slide
-   Roll
-   Wall slide
-   Wall jump
-   Wall run
-   Vault
-   Ledge grab
-   Climb
-   Swing
-   Zipline
-   Dash

The game should feel:

**Fast, responsive, stylish, readable, forgiving, and replayable.**

The player should constantly think:

> I can go faster.

------------------------------------------------------------------------

# 3. Solo Mode

One player completes the campaign alone.

Every mandatory section must be possible without another player.

Cooperative mechanics are optional shortcuts or bonuses.

Solo progression:

``` text
Level 01
↓
Level 02
↓
Level 03
↓
...
↓
Level 12
```

Save:

-   Completed levels
-   Best times
-   Stars
-   Coins
-   Secret emblems
-   Unlocked abilities

Use the existing save system if available.

------------------------------------------------------------------------

# 4. Duo Mode

Two real players use the existing room system.

Do not fake the second player with an AI character.

Both players share the same level.

Duo mechanics include:

### Cooperative shortcuts

Both players can activate a shortcut.

### Pressure switches

One player activates a switch while the other uses the opened route.

### Separate routes

Players can temporarily take different routes and reconnect later.

### Shared checkpoints

When one player reaches a checkpoint, the team can benefit from it.

### Rescue

A player who falls can quickly recover while the other continues.

### Finish bonus

If both players finish close together, award a team bonus.

Important:

**Do not make normal progression depend on perfect synchronization.**

A skilled player should still be able to help a less experienced player.

------------------------------------------------------------------------

# 5. Camera

Use a side scrolling 2D camera.

For one player:

``` text
PLAYER
   ↓
CAMERA FOLLOWS
```

For two players:

``` text
P1 -------- P2
     ↓
  CAMERA
```

Keep both players visible whenever practical.

If players separate:

1.  Camera gently zooms out.
2.  A soft separation boundary appears.
3.  Show `RETURN TO PARTNER`.
4.  Give a reasonable grace period.
5.  Recover the slower player to the latest safe checkpoint if
    necessary.

Never use abrupt teleporting as the normal behavior.

------------------------------------------------------------------------

# 6. Visual Direction

Target visual:

**Cinematic anime inspired urban parkour.**

The supplied Dhaka Parkour concept is the visual north star.

Use:

-   Detailed city backgrounds
-   Strong character silhouettes
-   Warm sunset lighting
-   Blue night lighting
-   Neon signs
-   Rain
-   Atmospheric haze
-   Rooftops
-   Construction sites
-   Water tanks
-   Electrical wires
-   Bridges
-   Market structures
-   Industrial objects
-   Dense buildings
-   River views

The city should feel Dhaka inspired without attempting to reproduce the
real city exactly.

------------------------------------------------------------------------

# 7. 2D Parallax Architecture

Use multiple visual layers:

``` text
Layer 0  Sky
Layer 1  Far skyline
Layer 2  Distant buildings
Layer 3  Bridges and signs
Layer 4  Gameplay environment
Layer 5  Foreground objects
Layer 6  Rain / dust / atmosphere
Layer 7  Characters
Layer 8  Gameplay effects
Layer 9  HUD
```

Suggested parallax factors:

``` text
Sky             0.02
Far skyline     0.05
Buildings       0.12
Midground       0.25
Gameplay        1.00
Foreground       1.15
```

Do not create a giant empty 3D arena.

The gameplay should read as a polished 2D platform game with cinematic
depth.

------------------------------------------------------------------------

# 8. Character Presentation

P1:

-   Red and black outfit
-   Athletic silhouette
-   Dark hair
-   Red accent

P2:

-   Blue and black outfit
-   Different silhouette
-   Blue accent

Characters must be large enough to read clearly on mobile.

Minimum animation states:

``` text
idle
run
sprint
jump
fall
land
slide
roll
wall_slide
wall_run
wall_jump
vault
ledge_grab
climb
swing
zipline
dash
hurt
death
checkpoint
finish
```

Do not leave a static character image while moving it around the level.

------------------------------------------------------------------------

# 9. Movement Specification

## Run

Responsive acceleration.

Avoid floaty movement.

Target feel:

``` text
input
↓
quick acceleration
↓
high running speed
↓
controlled deceleration
```

## Sprint

Holding sprint increases speed.

Add:

-   Sprint animation
-   Small camera effect
-   Motion streak
-   Dust
-   Stronger footsteps

## Jump

Use forgiving platformer timing:

-   Coyote time approximately 100 to 140 ms
-   Jump buffer approximately 100 to 160 ms

## Double Jump

Unlock early.

Use a distinct animation and small visual effect.

## Slide

Available during running or sprinting.

Use for:

-   Low gaps
-   Barriers
-   Speed routes

Preserve forward momentum.

## Roll

Useful after moderate falls and as an optional movement action.

## Wall Slide

Player can slide down approved walls.

## Wall Jump

Jump away from a valid wall.

## Wall Run

Short controlled wall run.

Add:

-   Motion streak
-   Dust
-   Camera movement
-   Foot effects

## Vault

Automatically vault small obstacles when possible.

Examples:

-   Railings
-   Crates
-   Low barriers
-   Fences

## Ledge Grab

If the player reaches a valid ledge:

``` text
JUMP
↓
GRAB
↓
PULL UP / DROP / JUMP AWAY
```

## Climb

Support:

-   Ladders
-   Pipes
-   Fire escapes
-   Scaffolding
-   Ropes

## Swing

Later levels introduce hanging cables and construction hooks.

## Zipline

Automatically attach at designated ziplines.

Allow jumping off.

## Dash

Unlock later.

Use for:

-   Long gaps
-   Dodging
-   Breaking weak barriers
-   Speedrunning

Use a cooldown.

------------------------------------------------------------------------

# 10. Level Campaign

Minimum target:

**12 levels**

Average:

**5 to 7 minutes each**

First playthrough target:

**60 to 75 minutes**

Do not artificially slow movement to reach one hour.

The hour must come from real level content.

Campaign:

``` text
01  Rooftop Introduction
02  Old Dhaka Rooftops
03  Market Escape
04  Construction Zone
05  Highway Crossing
06  Rainy Night
07  Industrial District
08  Riverfront
09  Bridge Run
10  Skyline Chase
11  Storm Run
12  Final Tower
```

------------------------------------------------------------------------

# 11. Level 01: Rooftop Introduction

Target: 5 minutes.

Teach:

-   Run
-   Jump
-   Sprint
-   Slide
-   Ledge grab

Environment:

-   Apartment rooftops
-   Water tanks
-   Clothes lines
-   Small gaps
-   Rooftop doors

Include:

-   Start
-   3 checkpoints
-   Collectibles
-   One safe shortcut
-   Finish

No severe hazards.

------------------------------------------------------------------------

# 12. Level 02: Old Dhaka Rooftops

Target: 5 minutes.

Environment:

-   Dense rooftops
-   Narrow routes
-   Market signs
-   Rooftop bridges
-   Ladders

Introduce:

-   Double jump
-   Wall jump
-   Vault

Add one difficult optional shortcut.

------------------------------------------------------------------------

# 13. Level 03: Market Escape

Target: 6 minutes.

Environment:

-   Market stalls
-   Signs
-   Boxes
-   Tarps
-   Hanging wires
-   Small vehicles

Hazards:

-   Closing shutters
-   Moving gates
-   Falling objects

Duo shortcut:

Two players can activate a gate together.

------------------------------------------------------------------------

# 14. Level 04: Construction Zone

Target: 6 minutes.

Environment:

-   Cranes
-   Concrete platforms
-   Scaffolding
-   Steel beams
-   Construction elevators

Introduce:

-   Wall run
-   Swinging
-   Falling platforms

Duo shortcut:

One player activates an elevator.

------------------------------------------------------------------------

# 15. Level 05: Highway Crossing

Target: 5 minutes.

Environment:

-   Elevated roads
-   Barriers
-   Traffic
-   Signs
-   Bridges

Gameplay:

-   Timing
-   Sprinting
-   Jumping over traffic
-   Sliding under barriers

------------------------------------------------------------------------

# 16. Level 06: Rainy Night

Target: 6 minutes.

Visual showcase:

-   Heavy rain
-   Wet surfaces
-   Neon
-   Reflections
-   Dark buildings
-   Lightning

Introduce:

-   Zipline
-   Fast traversal sections

Rain is visual only. Do not make controls slippery.

------------------------------------------------------------------------

# 17. Level 07: Industrial District

Target: 6 minutes.

Environment:

-   Warehouses
-   Pipes
-   Containers
-   Metal platforms
-   Conveyors
-   Smoke

Mechanics:

-   Moving platforms
-   Falling platforms
-   Timing challenges

Duo players can choose different routes that reconnect.

------------------------------------------------------------------------

# 18. Level 08: Riverfront

Target: 5 minutes.

Environment:

-   River
-   Boats
-   Docks
-   Bridges
-   Cranes
-   Rooftops

Use:

-   Swing
-   Zipline
-   Long jumps

------------------------------------------------------------------------

# 19. Level 09: Bridge Run

Target: 6 minutes.

High speed stage.

Features:

-   Long sprint sections
-   Moving barriers
-   Traffic
-   Falling platforms
-   Wind effects

Music becomes faster.

------------------------------------------------------------------------

# 20. Level 10: Skyline Chase

Target: 6 minutes.

A continuous chase sequence.

Features:

-   Rooftop jumps
-   Wall runs
-   Dash
-   Moving cranes
-   Large gaps

Minimal downtime.

------------------------------------------------------------------------

# 21. Level 11: Storm Run

Target: 6 minutes.

Environment:

-   Heavy rain
-   Wind
-   Lightning
-   Dark skyline
-   Construction structures

Hazards:

-   Falling signs
-   Electrical sparks
-   Collapsing platforms

Cooperative routes become more important.

------------------------------------------------------------------------

# 22. Level 12: Final Tower

Target: 7 minutes.

Vertical finale:

``` text
Street
↓
Alley
↓
Construction site
↓
Scaffolding
↓
Elevator shaft
↓
Exterior wall
↓
Rooftop
↓
Final jump
↓
FINISH
```

Final result:

``` text
MISSION COMPLETE

TIME
STARS
COINS
STYLE SCORE
BEST TIME
```

Duo additionally:

``` text
P1 TIME
P2 TIME
TEAM TIME
COOP BONUS
```

------------------------------------------------------------------------

# 23. Checkpoints

Each level:

**3 to 6 checkpoints**

Checkpoint appearance:

-   Neon beacon
-   Animated light
-   Clear visual marker

Activation:

``` text
CHECKPOINT SAVED
```

Failure returns to latest checkpoint.

Target respawn time:

**under 2 seconds**

------------------------------------------------------------------------

# 24. Collectibles

Each level:

-   Coins
-   Speed tokens
-   3 stars
-   1 secret emblem

Coins can later be used for cosmetics.

Do not make collectibles required to finish the level.

------------------------------------------------------------------------

# 25. Star System

Three stars:

``` text
1. Finish level
2. Collect enough coins
3. Beat target time
```

Progression must not require all stars.

------------------------------------------------------------------------

# 26. Secret Routes

Every level must have at least one optional route.

Example:

``` text
SAFE ROUTE
Medium speed
Lower risk

SHORTCUT
Higher difficulty
Higher speed
Better reward
```

------------------------------------------------------------------------

# 27. Style / Flow System

Reward combinations:

``` text
VAULT
+
WALL RUN
+
JUMP
+
DASH
+
SLIDE
```

Example feedback:

``` text
FLOW x5
+250
```

Do not require style scoring to finish a level.

------------------------------------------------------------------------

# 28. Mobile Controls

Landscape first.

Left:

``` text
Virtual joystick
```

Right:

``` text
JUMP
DASH
SLIDE / ACTION
```

Use a context sensitive action button for:

-   Climb
-   Swing
-   Zipline
-   Activate
-   Vault where needed

Do not cover the screen with 10 tiny buttons.

Touch targets should be large and comfortable.

------------------------------------------------------------------------

# 29. Desktop Controls

Recommended:

``` text
A / D       Move
W / Space   Jump
Shift       Sprint
S           Slide
E           Action
Q           Dash
```

Mouse is not required for basic movement.

------------------------------------------------------------------------

# 30. HUD

Top left:

``` text
P1
LEVEL
ABILITY
```

Top center:

``` text
TIME
```

Top right in Duo:

``` text
P2
LEVEL
ABILITY
```

Optional:

``` text
CHECKPOINT 3 / 5
```

Bottom:

Mobile controls.

HUD should use the existing DUO RAMPAGE visual identity.

Use Rajdhani or the existing project gaming font.

------------------------------------------------------------------------

# 31. Audio

Use only properly licensed or free assets.

Required:

``` text
footstep
jump
land
slide
roll
wall_run
vault
ledge_grab
climb
dash
coin
checkpoint
death
level_complete
menu
button
wind
rain
city_ambience
```

At least four music moods:

-   Day rooftop
-   Sunset
-   Night
-   Final chase

Keep licenses in:

``` text
assets/audio/LICENSES.md
```

------------------------------------------------------------------------

# 32. Effects

Use lightweight particles for:

-   Dust
-   Landing
-   Sprint
-   Wall run
-   Dash
-   Rain
-   Sparks
-   Broken objects
-   Coin pickup

Prefer pooled particles.

Do not create hundreds of DOM elements.

------------------------------------------------------------------------

# 33. Technical Architecture

Recommended:

``` text
Existing DUO RAMPAGE
        ↓
Existing Room System
        ↓
Mode Selection
        ↓
Parkour Mode
        ↓
Parkour Game
```

For a new 2D gameplay renderer:

``` text
Canvas 2D
```

DOM should mainly handle:

-   Menus
-   HUD
-   Settings
-   Room screens
-   Touch controls

Do not build gameplay from hundreds of HTML divs.

------------------------------------------------------------------------

# 34. Level Data Must Be Data Driven

Example:

``` js
{
  id: "parkour_01",
  name: "Rooftop Introduction",
  background: "city_sunset",
  start: { x: 120, y: 420 },
  finish: { x: 5800, y: 320 },
  platforms: [],
  hazards: [],
  collectibles: [],
  checkpoints: [],
  shortcuts: []
}
```

Do not hard code every level into one enormous function.

------------------------------------------------------------------------

# 35. Platform Types

``` text
concrete
metal
wood
glass
moving
falling
bounce
one_way
breakable
```

Example:

``` js
{
  x: 400,
  y: 360,
  width: 280,
  height: 32,
  type: "concrete"
}
```

------------------------------------------------------------------------

# 36. Hazards

Possible hazards:

-   Traffic
-   Fire
-   Electricity
-   Falling objects
-   Moving machinery
-   Collapsing platforms
-   Water
-   Deep gaps

Hazards must be readable.

Never hide instant death in something that looks harmless.

------------------------------------------------------------------------

# 37. Multiplayer

Reuse the existing multiplayer system.

Synchronize important state:

``` text
position
velocity
movement state
jump
wall movement
dash
checkpoint
death
respawn
collectibles
finish
timer
level state
```

Do not blindly send every rendered frame.

Use the existing network architecture where possible.

If server authority already exists, extend it rather than replacing it.

------------------------------------------------------------------------

# 38. Room Integration

Existing room IDs remain unchanged.

Example:

``` text
#483921
```

When the host selects Parkour:

``` text
mode = "parkour"
```

The existing room should then allow:

``` text
SOLO
DUO
```

Do not create a second room system.

------------------------------------------------------------------------

# 39. Duo Lobby

Reuse the existing lobby.

Display:

``` text
PARKOUR MODE

PLAYER 1
READY

PLAYER 2
READY

LEVEL
01 / 12

START
```

Host controls level selection and start.

------------------------------------------------------------------------

# 40. Level Unlocking

Initially:

``` text
Level 01 unlocked
```

Completing a level unlocks the next one.

Do not require an account for the first release.

------------------------------------------------------------------------

# 41. Performance

Target:

**60 FPS**

Priority:

1.  Mobile performance
2.  Input responsiveness
3.  Stable multiplayer
4.  Visual quality

Use:

-   Sprite atlases
-   Asset reuse
-   Object pooling
-   Limited particles
-   Cached calculations
-   Minimal DOM updates

------------------------------------------------------------------------

# 42. Responsive Resolution

Primary design:

``` text
1920 x 1080
```

Support:

``` text
1366 x 768
1280 x 720
1024 x 576
800 x 450
```

Do not blindly stretch UI.

------------------------------------------------------------------------

# 43. Tutorial Through Level Design

Do not make a long instruction screen.

Teach mechanics through obstacles.

Example:

``` text
Small gap
↓
Jump

Larger gap
↓
Sprint jump

Low barrier
↓
Slide

Wall
↓
Wall jump

High route
↓
Double jump
```

------------------------------------------------------------------------

# 44. First Ten Minutes

Target pacing:

``` text
0:00   Short intro
0:15   Running
1:00   First jump
2:00   Checkpoint
3:00   Slide
4:00   Collectible
5:00   Shortcut
6:00   Double jump
7:00   Larger gap
8:00   Chase moment
9:00   First Duo interaction
10:00  Level completion
```

The first ten minutes must feel polished.

------------------------------------------------------------------------

# 45. Level Rhythm

Every 20 to 40 seconds, introduce something interesting.

Example:

``` text
Normal rooftop
↓
Gap
↓
Slide
↓
Wall jump
↓
Collectible
↓
Moving platform
↓
Shortcut
↓
Chase
↓
Checkpoint
```

Do not let the player run across empty platforms for minutes.

Use:

``` text
FAST
FAST
REST
FAST
CHALLENGE
REWARD
FAST
```

------------------------------------------------------------------------

# 46. Development Strategy: Stop Antigravity From Making Garbage

This is mandatory.

## Never ask Antigravity to build the whole game in one request.

A huge request produces:

-   Unverified systems
-   Fake features
-   Broken networking
-   Placeholder visuals
-   Giant files
-   Duplicate code
-   UI bugs
-   Physics bugs

Instead use small verified stages.

------------------------------------------------------------------------

# 47. Mandatory Antigravity Work Protocol

For every task:

``` text
1. Inspect the existing project.
2. Identify reusable systems.
3. State which files will change.
4. Implement one feature.
5. Run the project.
6. Test the feature.
7. Fix errors.
8. Verify existing features.
9. Report exactly what changed.
10. Stop.
```

Do not continue into the next feature automatically.

------------------------------------------------------------------------

# 48. Acceptance Test

A feature is not complete until:

``` text
[ ] Project runs
[ ] No console errors
[ ] Existing pages still work
[ ] Existing room system still works
[ ] Desktop tested
[ ] Mobile landscape tested
[ ] Touch input tested
[ ] Keyboard input tested
[ ] Restart tested
[ ] Death tested
[ ] Respawn tested
[ ] Multiplayer tested when applicable
```

------------------------------------------------------------------------

# 49. Visual Quality Gate

A finished level must have:

``` text
[ ] Parallax depth
[ ] Readable player silhouette
[ ] Detailed platforms
[ ] Consistent props
[ ] Consistent lighting
[ ] Good background composition
[ ] Good HUD
[ ] No obvious placeholder rectangles
[ ] No stretched assets
[ ] No giant empty areas
```

Prototype rectangles are allowed only during movement prototyping.

------------------------------------------------------------------------

# 50. Game Feel Quality Gate

Movement must feel:

-   Fast
-   Responsive
-   Predictable
-   Forgiving
-   Satisfying

Avoid:

-   Floaty jumps
-   Delayed input
-   Sticky walls
-   Random collision behavior
-   Unfair instant deaths
-   Slow respawns

------------------------------------------------------------------------

# 51. Development Phases

## Phase 1: Inspect Existing Project

Do not modify anything.

Identify:

-   Home implementation
-   Create Room
-   Join Room
-   Room state
-   Multiplayer
-   Player state
-   Rendering
-   Input
-   Assets
-   Save system

Produce an architecture report.

Stop.

------------------------------------------------------------------------

## Phase 2: Add Parkour Routing

Add only:

``` text
Existing Home
↓
Parkour Mode
```

Do not build gameplay.

Verify existing systems.

Stop.

------------------------------------------------------------------------

## Phase 3: Movement Prototype

Build only:

-   Run
-   Jump
-   Double jump
-   Slide
-   Camera

Temporary geometry is acceptable.

Goal:

Movement must feel good.

Stop.

------------------------------------------------------------------------

## Phase 4: Parkour Mechanics

Add:

-   Wall slide
-   Wall jump
-   Vault
-   Ledge grab
-   Climb

Test each individually.

Stop.

------------------------------------------------------------------------

## Phase 5: First Complete Level

Build one 5 minute level.

Include:

-   Start
-   Tutorial
-   Multiple platform heights
-   Collectibles
-   Shortcut
-   Three checkpoints
-   Finish
-   Respawn
-   Final visual direction

Stop.

------------------------------------------------------------------------

## Phase 6: Solo

Make the complete level work alone.

Test restart, death, checkpoint, completion.

Stop.

------------------------------------------------------------------------

## Phase 7: Duo

Connect two real players using the existing room and network system.

Test:

-   Movement
-   Jump
-   Wall mechanics
-   Checkpoints
-   Respawn
-   Finish
-   Separation

Stop.

------------------------------------------------------------------------

## Phase 8: Progression

Add:

-   Stars
-   Coins
-   Best time
-   Unlocking
-   Ability progression

Stop.

------------------------------------------------------------------------

## Phase 9: Levels 02 to 04

Build three polished levels.

Do not make three copies of Level 01.

Stop.

------------------------------------------------------------------------

## Phase 10: Levels 05 to 08

Build middle campaign.

Stop.

------------------------------------------------------------------------

## Phase 11: Levels 09 to 12

Build final campaign.

Stop.

------------------------------------------------------------------------

## Phase 12: Audio, Effects, Polish

Add:

-   Music
-   Sound effects
-   Rain
-   Dust
-   Dash effects
-   Camera effects
-   Better animation
-   UI polish

Stop.

------------------------------------------------------------------------

## Phase 13: Final QA

Test:

-   Solo
-   Duo
-   Mobile
-   Desktop
-   Room creation
-   Room joining
-   Reconnect
-   Level restart
-   Save
-   Performance

------------------------------------------------------------------------

# 52. Exact Prompts To Give Antigravity

## TASK 01

``` text
Inspect the existing DUO RAMPAGE project.

Do not modify anything.

Identify:
1. Home page
2. Create Room
3. Join Room
4. Room state
5. Multiplayer connection
6. Player state
7. Rendering system
8. Input system
9. Asset loading
10. Save system

Then produce a short architecture report explaining what can be reused for Parkour Mode.

Do not build Parkour Mode yet.
Do not create placeholder gameplay.

Stop after the report.
```

## TASK 02

``` text
Add Parkour Mode as a new mode without changing existing room functionality.

Reuse the existing routing and room system.

Create only:
1. Parkour mode entry
2. Solo selection
3. Duo selection
4. Parkour lobby integration

Do not build gameplay.

Verify:
- Home works
- Create Room works
- Join Room works
- Existing room IDs work
- Existing mode works
- Parkour mode opens correctly

Stop after verification.
```

## TASK 03

``` text
Build the Parkour movement prototype.

Only implement:
- Run
- Jump
- Double jump
- Slide
- Camera

Use temporary development geometry.

Do not build multiplayer.
Do not build all levels.
Do not build final art.

Test movement carefully.

The priority is responsive movement, not visual complexity.

Stop after verification.
```

## TASK 04

``` text
Add:
- Wall slide
- Wall jump
- Vault
- Ledge grab
- Climb

Do not break existing movement.

Test each mechanic individually.

Do not add unrelated features.

Stop after verification.
```

## TASK 05

``` text
Create the first complete five minute Parkour level.

Use the approved visual direction:
cinematic 2D urban Dhaka inspired environment,
layered parallax,
anime inspired runner,
detailed platforms,
rooftops,
construction elements,
strong lighting.

Include:
- Start
- Tutorial movement
- Multiple platform heights
- Collectibles
- One shortcut
- Three checkpoints
- Finish
- Respawn

Do not create an empty rectangle arena.

Do not build the other 11 levels yet.

Stop after the level is playable.
```

## TASK 06

``` text
Connect two real players to Parkour Mode using the existing room and multiplayer system.

Do not replace the existing networking architecture.

Synchronize the required player state.

Test using two browser clients.

Verify:
- Both players see each other
- Both move correctly
- Jump works
- Wall mechanics work
- Checkpoints work
- Death and respawn work
- Finish works
- Separation is handled

Stop after verification.
```

------------------------------------------------------------------------

# 53. Additional Antigravity Rule

When a task fails:

**Do not continue adding features.**

Use:

``` text
STOP
↓
READ ERROR
↓
FIND ROOT CAUSE
↓
FIX
↓
TEST
↓
CONTINUE
```

Never stack new features on broken foundations.

------------------------------------------------------------------------

# 54. Do Not Build Yet

Do not spend time initially on:

-   Shop
-   Battle pass
-   Ads
-   Voice chat
-   Accounts
-   Global matchmaking
-   Huge open world
-   Procedural generation
-   Advanced AI
-   Complex inventory
-   Cosmetic store

First make the actual parkour game excellent.

------------------------------------------------------------------------

# 55. Optional Later Features

After the 60 minute campaign is stable:

-   Global leaderboard
-   Replay ghosts
-   Character cosmetics
-   Daily challenges
-   Time attack mode
-   Infinite runner mode
-   Community level editor
-   Cloud save
-   Advanced matchmaking

------------------------------------------------------------------------

# 56. Definition Of Done

Solo:

``` text
HOME
↓
PARKOUR
↓
SOLO
↓
LEVEL SELECT
↓
LEVEL 01
↓
RUN
↓
JUMP
↓
DOUBLE JUMP
↓
SLIDE
↓
WALL JUMP
↓
VAULT
↓
CLIMB
↓
COLLECT
↓
CHECKPOINT
↓
RESPAWN
↓
FINISH
↓
RESULT
↓
NEXT LEVEL
↓
12 LEVELS
↓
60+ MINUTES
```

Duo:

``` text
CREATE ROOM
↓
PARKOUR
↓
DUO
↓
FRIEND JOINS
↓
BOTH READY
↓
LEVEL
↓
BOTH PLAY
↓
COOPERATIVE SHORTCUTS
↓
SHARED CHECKPOINT
↓
FINISH
↓
RESULT
```

------------------------------------------------------------------------

# 57. Final Principle

The goal is **not** to make Antigravity generate a huge amount of code.

The goal is to make it generate a game that is actually fun.

Priority:

``` text
FUN
↓
RESPONSIVE MOVEMENT
↓
GOOD LEVEL DESIGN
↓
GOOD VISUALS
↓
RELIABLE MULTIPLAYER
↓
CONTENT
↓
POLISH
```

A small polished game is better than a huge broken game.

**Build one excellent level first. Then expand.**

------------------------------------------------------------------------

# 58. Visual North Star

Use the supplied Dhaka Parkour concept as the reference direction:

-   Cinematic urban skyline
-   Anime inspired runner
-   Rooftop gameplay
-   Construction zones
-   Bridges
-   Neon signs
-   Sunset and night scenes
-   Detailed layered 2D environment
-   Strong silhouettes
-   Modern gaming HUD
-   Mobile landscape controls

The final game should never fall back to:

-   Plain colored rectangles
-   Empty blue backgrounds
-   Stick figures
-   Random unrelated sprites
-   Giant empty platforms
-   Default browser UI

Temporary geometry is acceptable only during development phases
explicitly marked as prototypes.

------------------------------------------------------------------------

# 59. Final Build Order

``` text
EXISTING DUO RAMPAGE
        ↓
PARKOUR ROUTING
        ↓
MOVEMENT
        ↓
PARKOUR MECHANICS
        ↓
ONE BEAUTIFUL LEVEL
        ↓
SOLO
        ↓
DUO
        ↓
CHECKPOINTS
        ↓
COLLECTIBLES
        ↓
PROGRESSION
        ↓
LEVELS 02–04
        ↓
LEVELS 05–08
        ↓
LEVELS 09–12
        ↓
AUDIO
        ↓
VFX
        ↓
MOBILE POLISH
        ↓
PERFORMANCE
        ↓
FINAL QA
```

**Never skip directly from the existing project to all 12 levels.**

**The first milestone is one genuinely fun five minute level.**
