# Deploying Runner Royale to Vercel

Runner Royale is optimized for instant deployment to [Vercel](https://vercel.com). Follow this guide to deploy your game in under 2 minutes.

---

## 🚀 Step 1: Deploy to Vercel

1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** → **"Project"**.
4. Select your **`platformer-run`** repository.
5. Vercel will automatically detect **Next.js**:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `next build` (or `npm run build`)
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
6. Click **"Deploy"**.

Your game will build and be live at `https://<your-project>.vercel.app`! 🎉

---

## 🎮 How Multiplayer Works on Vercel

### 1. Solo Campaign & Practice (100% Ready Out-of-the-Box)
- All 3 stages, coin scoring, checkpoints, par times, physics, and mobile touch controls run entirely on Vercel's global Edge CDN with zero backend required.

### 2. Multi-Tab & Local Testing (Automatic)
- If deployed to Vercel without an external socket server, the game automatically switches to **Local Tab Sync** via `BroadcastChannel` and `localStorage`.
- You can open 2 or more tabs on the same computer or phone browser to test room creation, joining, and race sync.

### 3. Global Online Multiplayer Across Different Devices
Vercel functions are **serverless** (they spin down after seconds and do not keep permanent WebSockets open). To allow players on different phones or computers around the world to race each other in real time, connect a free WebSocket server:

#### Option A: Free 1-Click Hosting on Render.com
1. Go to [render.com](https://render.com) (free tier available).
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub repository.
4. Set the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node socket-server.js`
5. Click **"Create Web Service"**.
6. Render will provide a public URL, e.g. `https://runner-royale-socket.onrender.com`.

#### Option B: Free Hosting on Railway.app
1. Go to [railway.app](https://railway.app).
2. Create a new project from your GitHub repo.
3. In Settings, set **Start Command**: `node socket-server.js`.
4. Generate a public domain (e.g. `https://runner-royale-production.up.railway.app`).

#### Connecting the Socket Server to Vercel:
1. In your **Vercel Dashboard**, go to:
   **Project Settings** → **Environment Variables**.
2. Add:
   - **Key**: `NEXT_PUBLIC_SOCKET_URL`
   - **Value**: `https://your-socket-service.onrender.com` (your Render or Railway URL)
3. Redeploy on Vercel.
4. Your Vercel frontend will now connect all mobile and desktop players across the globe into live multiplayer rooms!

---

## 📱 Mobile PWA (Add to Home Screen)

Runner Royale includes a full Progressive Web App (`manifest.webmanifest`), dynamic app icons, and Apple touch icons.

### On iPhone / iPad (Safari)
1. Open your Vercel URL in Safari.
2. Tap the **Share** button (box with arrow up).
3. Tap **"Add to Home Screen"**.
4. Launch the game from your home screen — it runs in **fullscreen landscape mode** with no address bar or browser controls!

### On Android (Chrome)
1. Open your Vercel URL in Chrome.
2. Tap the **three dots menu** (⋮) at the top right.
3. Tap **"Install App"** or **"Add to Home Screen"**.
4. The game opens full-screen like a native mobile game.

---

## 🛡️ Performance & Security Features Included

- **Security Headers**: Configured with `nosniff`, `SAMEORIGIN`, `origin-when-cross-origin`, and DNS prefetch.
- **Dynamic OpenGraph & Twitter Cards**: Auto-generates a rich 1200x630 social preview card whenever your Vercel link is shared on Discord, WhatsApp, Twitter/X, or Slack.
- **Health Check Endpoint**: Available at `https://<your-project>.vercel.app/api/health` for uptime monitoring.
- **Zero Hydration Mismatch**: Dynamic client loading with `ssr: false` guarantees clean rendering across any browser extension or mobile device.
