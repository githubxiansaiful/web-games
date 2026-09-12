# DUO RAMPAGE HOME SCREEN IMPLEMENTATION

You are building the first polished screen of the game **DUO RAMPAGE**.

Your current task is ONLY to build the complete **Home Screen / Main Menu**.

The visual target is the reference image provided in the project or conversation. Match its overall quality, composition, colors, lighting, character presentation, modern game interface, and premium mobile game feeling.

The game is a **2D browser game with a modern 3D cartoon visual style**.

The final Home Screen must look like a real modern mobile game, not like a normal website.

---

## 1. MAIN VISUAL DIRECTION

The Home Screen must be:

* Bright
* Highly saturated
* Colorful
* Cinematic
* Modern
* Premium
* Energetic
* Action focused
* Cartoon styled
* High resolution
* Mobile friendly
* Landscape oriented

The visual style should feel like a polished modern 3D cartoon game while the actual game remains 2D.

Do NOT use pixel art.

Do NOT use flat website style graphics.

Do NOT use plain HTML looking buttons.

Do NOT use generic browser fonts.

Do NOT create a dark and dull interface.

Use strong lighting, depth, shadows, glow, highlights, particles, atmospheric effects, and saturated colors.

---

# 2. RESPONSIVE TARGET

The primary target is:

**Mobile browser in landscape orientation.**

Also support:

* Android Chrome
* iPhone Safari
* Tablet browsers
* Desktop Chrome
* Desktop Edge
* Desktop Firefox

The interface must automatically adapt to different landscape screen sizes.

Design around a 16:9 composition but support wider mobile landscape ratios.

Respect mobile safe areas.

Nothing important should be hidden behind the screen edge.

---

# 3. HOME SCREEN COMPOSITION

Create a full screen cinematic background.

The background should show an action packed abandoned city.

Include:

* Damaged buildings
* Street
* Cars
* Fire
* Smoke
* Neon lights
* Street lights
* Broken signs
* Distant explosions
* Atmospheric particles
* Destroyed objects
* Cinematic depth

The background must not be static if simple animation is possible.

Add subtle movement such as:

* Smoke movement
* Fire movement
* Floating particles
* Light flickering
* Very subtle camera movement
* Small environmental animation

Do not make the animation distracting.

---

# 4. MAIN CHARACTERS

Place the two main DUO RAMPAGE characters prominently in the center of the Home Screen.

Character One:

**ASSAULT**

Character Two:

**HEAVY**

They should look like premium stylized 3D cartoon game characters.

Character One should be slimmer and agile.

Character Two should be larger and stronger.

They must have:

* Detailed faces
* Detailed clothing
* Strong silhouettes
* High quality weapons
* Strong lighting
* Rim lighting
* Soft shadows
* Bright highlights

They should feel like the main heroes of the game.

Do not make them look like generic stock characters.

---

# 5. CHARACTER CONSISTENCY

Create the characters in a way that allows the same character assets to be reused later in:

* Gameplay
* Lobby
* Loading screen
* Victory screen
* Defeat screen
* Character selection
* Room screen

The characters must keep the same:

* Face
* Hair
* Clothing
* Body proportions
* Colors
* Accessories
* Weapon design
* Art direction

Do not generate a different version of the character every time.

Create a central character asset configuration so future screens can reuse them.

---

# 6. DUO RAMPAGE LOGO

Place the game logo prominently near the center.

Text:

# DUO

# RAMPAGE

The logo should feel like a real action game logo.

Use:

* Large bold typography
* Strong depth
* Shadow
* Glow
* Highlight
* Slight 3D appearance
* Action style
* High contrast

The logo must remain readable on mobile screens.

---

# 7. TAGLINE

Under the logo:

**TWO PLAYERS • ONE MISSION • ENDLESS ACTION**

Use a smaller modern gaming font.

Keep it clean and readable.

---

# 8. PRIMARY BUTTONS

Create three large modern game buttons.

## CREATE ROOM

This is the main button.

When pressed, it should eventually open the room creation flow.

For now, implement the button and connect it to a placeholder room screen or TODO state.

Button text:

**CREATE ROOM**

Optional secondary text:

**PLAY WITH A FRIEND**

---

## JOIN ROOM

Second button.

When pressed, eventually open the Join Room interface.

For now, create the navigation structure and a working placeholder screen.

Button text:

**JOIN ROOM**

Optional secondary text:

**ENTER ROOM ID**

---

## QUICK PLAY

Third button.

This can be marked:

**BETA**

It does not need to be fully functional yet.

Create the visual and navigation structure.

---

# 9. BUTTON DESIGN

Buttons must look like modern 3D mobile game buttons.

Do not make standard HTML buttons.

Use:

* Rounded corners
* Depth
* Shadow
* Highlight
* Glow
* Border
* Gradient
* Press animation
* Hover animation on desktop
* Touch animation on mobile

Buttons should visibly respond when touched.

Example interaction:

Normal:

Bright polished button.

Touch:

Button moves slightly downward and becomes brighter.

Release:

Smooth return animation.

---

# 10. COLOR SYSTEM

Use a strong modern game color system.

Primary action:

Orange / yellow

Secondary action:

Blue / cyan

Third action:

Purple

Background:

Dark blue and purple tones with bright orange fire and neon highlights.

Characters must remain clearly visible.

The interface must have strong contrast.

Do not allow the background to reduce text readability.

---

# 11. LEFT SIDE MENU

Add a vertical menu on the left side.

Buttons:

**STORE**

**LOADOUT**

**CHARACTERS**

**MISSIONS**

**DAILY REWARDS**

Each button should have:

* Icon
* Text
* Modern game panel
* Hover animation
* Touch animation

For now, clicking these buttons can open simple placeholder screens saying:

**COMING SOON**

But the navigation system must be structured properly so these screens can be implemented later.

---

# 12. TOP LEFT PLAYER PROFILE

Create a player profile panel.

Example:

**RAMPAGE#001**

**LV. 1**

Show:

* Character portrait
* Player name
* Level
* Experience bar

Keep this area compact on mobile.

Use a modern game style profile panel.

---

# 13. TOP RIGHT MENU

Add:

**SETTINGS**

**HOW TO PLAY**

**FRIENDS**

**LEADERBOARD**

Also show:

**ONLINE**

with an online indicator.

The exact number of online players can be placeholder data for now.

Example:

**ONLINE: 1,248**

Make sure this does not imply a real server count yet.

Use placeholder data until the multiplayer backend exists.

---

# 14. MAP PREVIEW SECTION

At the bottom of the Home Screen, create a horizontal map selection area.

First map:

# ABANDONED CITY

Subtitle:

**FIRST BATTLE**

This map should be unlocked.

Additional future maps:

**JUNGLE BASE**

**FROZEN OUTPOST**

**DESERT STRONGHOLD**

**MORE WORLDS**

Future maps should display:

**COMING SOON**

and a lock icon.

The map cards must use high quality artwork.

---

# 15. MAP CARD DESIGN

Each map card should have:

* Background artwork
* Name
* Subtitle
* Lock state
* Border
* Shadow
* Slight depth
* Touch animation

When the player selects:

**ABANDONED CITY**

show a stronger highlight.

The selected map should be visually obvious.

---

# 16. BOTTOM INFORMATION

Add a small game slogan:

**REAL FRIENDS. REAL CHAOS.**

Also show the current game version in a small corner.

Example:

**v0.1.0**

Keep it subtle.

---

# 17. ANIMATION

The Home Screen should feel alive.

Add:

* Character idle animation
* Smoke
* Fire
* Floating particles
* Light movement
* Button animation
* Logo animation
* Small environmental movement
* Smooth menu transitions

Use subtle animation.

Do not overload the screen.

---

# 18. CAMERA FEEL

Use a cinematic layered composition.

The characters should appear closer to the camera.

The city should appear behind them.

Use visual depth through:

* Foreground
* Characters
* Middle ground
* Background
* Atmospheric effects

If using 2D layers, create parallax movement.

---

# 19. MOBILE LAYOUT

On mobile landscape:

The main buttons must remain large enough for touch.

Do not make tiny desktop style controls.

Minimum practical touch target should be around 44 pixels or larger.

Keep important buttons away from the screen edges.

Use safe area handling.

If the screen becomes extremely narrow:

* Reduce decorative elements
* Reduce character scale slightly
* Compress the map cards
* Keep CREATE ROOM and JOIN ROOM visible

Never hide the main actions.

---

# 20. DESKTOP LAYOUT

On desktop:

Allow the Home Screen to use the full browser window.

Keep the same visual composition.

Do not stretch characters unnaturally.

Maintain the intended aspect ratio.

Use responsive scaling.

---

# 21. PERFORMANCE

The artwork should look high quality, but the Home Screen must remain mobile friendly.

Use:

* Optimized textures
* Compressed images
* Sprite atlases where useful
* Lazy loading for future screens
* Efficient animations
* Efficient particles

Do not load every future game asset on the Home Screen.

Only load assets required for the current screen.

---

# 22. AUDIO

Add basic UI sound hooks.

Create placeholder sound hooks for:

* Button hover
* Button press
* Menu open
* Menu close
* Room button
* Join button

If final sound assets are not available yet, create the audio system with placeholder support.

Do not block the Home Screen because audio assets are missing.

---

# 23. NAVIGATION ARCHITECTURE

The Home Screen must not contain all future logic in one file.

Create separate modules/components for:

* Home Screen
* Player Profile
* Main Navigation
* Primary Actions
* Map Selection
* Background
* Character Display
* Game Logo
* Settings
* Join Room
* Create Room

Keep the project modular.

---

# 24. CREATE ROOM PLACEHOLDER

When clicking:

**CREATE ROOM**

open a polished room creation screen.

For now generate a temporary room ID such as:

#123456

Show:

**ROOM CREATED**

**#123456**

**COPY ROOM ID**

**SHARE**

**WAITING FOR PLAYER 2...**

Do not build the complete multiplayer backend yet.

Only create the UI flow and clear TODO points for the real multiplayer implementation.

---

# 25. JOIN ROOM PLACEHOLDER

When clicking:

**JOIN ROOM**

open a polished Join Room screen.

Show:

# JOIN ROOM

Input:

**ENTER ROOM ID**

Allow:

**123456**

and:

**#123456**

Show button:

**JOIN**

Add:

**BACK**

For now, validate the six digit format locally.

Prepare the code so real room validation can be connected later.

---

# 26. SETTINGS PLACEHOLDER

Create a polished Settings screen.

Include:

* Music volume
* Sound volume
* Graphics quality
* Fullscreen
* Control sensitivity

The controls can initially use local browser storage.

---

# 27. HOW TO PLAY PLACEHOLDER

Create a polished How To Play screen.

Show:

* Move
* Aim
* Shoot
* Reload
* Dash
* Grenade
* Special Ability
* Revive teammate
* Duo Combo

Use large icons and simple text.

---

# 28. VISUAL ASSET GENERATION

If visual assets are missing, generate them.

Do not use random internet images.

Create original game assets that match the DUO RAMPAGE art direction.

Generate:

* Player One
* Player Two
* City background
* Logo
* Map cards
* UI icons
* Button backgrounds
* Menu decorations
* Character portraits

All assets must maintain one consistent visual style.

---

# 29. IMPORTANT: DO NOT OVERBUILD

This task is ONLY the Home Screen and the initial navigation structure.

Do NOT build:

* Full combat
* Enemy AI
* Boss
* Weapon system
* Full multiplayer synchronization
* Full level system

Those will come later.

The current goal is to make the Home Screen look extremely polished and make its navigation ready for future systems.

---

# 30. ACCEPTANCE TEST

The Home Screen is complete only when all of these work:

1. Game opens correctly.
2. Home Screen fills the screen.
3. Landscape layout works.
4. Mobile touch layout works.
5. Desktop layout works.
6. Characters display correctly.
7. Background looks cinematic.
8. Logo is readable.
9. CREATE ROOM works.
10. JOIN ROOM works.
11. SETTINGS opens.
12. HOW TO PLAY opens.
13. STORE opens.
14. LOADOUT opens.
15. CHARACTERS opens.
16. MISSIONS opens.
17. DAILY REWARDS opens.
18. Map cards display correctly.
19. ABANDONED CITY is selected.
20. Locked maps show correctly.
21. Buttons have touch animation.
22. Screen has no horizontal scrolling.
23. Text does not overflow.
24. Safe areas work.
25. The page remains responsive.
26. No console errors.
27. No broken image assets.
28. No missing font errors.
29. The Home Screen loads efficiently.
30. The visual result feels like a modern premium mobile game.

---

# 31. DEVELOPMENT METHOD

Work in small steps.

First inspect the existing project.

Then determine the current technology and structure.

Do not replace the project technology without a strong reason.

Implement the Home Screen.

Run the application.

Test it in a desktop browser.

Test it using mobile browser dimensions.

Fix all visual and functional problems.

Then test the room navigation.

Do not move to combat or enemy AI yet.

---

# 32. FINAL VISUAL GOAL

The final Home Screen should give the user this immediate feeling:

**“This is a real modern action game.”**

It should look:

**Bright**

**Saturated**

**High quality**

**Cinematic**

**Modern**

**3D cartoon styled**

**Action packed**

**Premium**

**Mobile friendly**

The visual quality of the Home Screen is extremely important because it is the player's first impression of DUO RAMPAGE.

Build the Home Screen to production quality rather than making a simple prototype.
