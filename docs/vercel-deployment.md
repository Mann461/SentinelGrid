# Deploying SentinelGrid to Vercel

SentinelGrid's React Vite frontend is fully configured for Vercel deployment with client-side SPA routing (`react-router` / index rewrites) and automated asset optimization.

---

## Method 1: Deploy via Vercel Web Dashboard (Recommended)

1. **Push your code to GitHub / GitLab / Bitbucket**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Open Vercel**:
   * Go to [https://vercel.com/new](https://vercel.com/new) and log in.
   * Click **Import** next to your repository.

3. **Configure Project Settings**:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend` (or leave root if using the root `vercel.json`)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`

4. **Environment Variables**:
   Add this environment variable in the Vercel dashboard:
   * **Key**: `VITE_API_BASE`
   * **Value**: Your live backend URL (e.g. `https://sentinelgrid-backend.onrender.com` or your Cloudflare tunnel URL)
   * *(Optional)* **Key**: `VITE_WS_BASE`
   * **Value**: `wss://sentinelgrid-backend.onrender.com/ws/alerts`

5. Click **Deploy**. Vercel will build and assign you a permanent `*.vercel.app` URL.

---

## Method 2: Deploy via Vercel CLI

Run this directly from your local terminal:

```bash
# Navigate to the frontend directory
cd frontend

# Deploy using Vercel CLI
npx vercel
```

Follow the interactive prompts:
1. Log in to your Vercel account in the browser.
2. Link to existing project? `No` (for new project).
3. Project name? `sentinelgrid` (or press Enter).
4. Directory located? `./` (current directory).
5. Modify settings? `No`.

To deploy directly to production with custom domain or final alias:
```bash
npx vercel --prod
```

---

## Configuration Files Added

1. [`vercel.json`](../vercel.json): Configures root deployment, output directory `frontend/dist`, and SPA rewrite rules.
2. [`frontend/vercel.json`](../frontend/vercel.json): Configures standalone frontend deployment when imported directly as root in Vercel.
3. [`package.json`](../package.json): Root build scripts to run `npm --prefix frontend install && npm --prefix frontend run build`.
