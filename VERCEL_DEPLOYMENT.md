# SafePulse Vercel + Backend Deployment Guide

## 🎯 Architecture

```
┌─────────────────────────────────────────┐
│         Vercel (Frontend)               │
│  React SPA - https://safepulse.vercel.app   │
│  (serves dist/ folder)                  │
└──────────────┬──────────────────────────┘
               │ API calls
               ↓
┌─────────────────────────────────────────┐
│  Railway/Render (Backend API)           │
│  Node.js Express - https://safepulse-api.xxx   │
│  (manages SQLite database)              │
└─────────────────────────────────────────┘
```

---

## 📋 Step 1: Deploy Frontend to Vercel

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub repo (fork or create new repo)

### Setup

1. **Push to GitHub**:
```bash
cd /Users/gokulmallabathula/med2predict
git init
git add .
git commit -m "Initial commit - SafePulse"
git remote add origin https://github.com/YOUR_USERNAME/med2predict.git
git branch -M main
git push -u origin main
```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `med2predict` repo
   - Click "Import"

3. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./` (default)
   - Node Version: `20.x`
   - Click "Deploy"

4. **Set Environment Variables**:
   - In Vercel Dashboard → Settings → Environment Variables
   - Add new variable:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://safepulse-api.railway.app` (you'll set backend URL later)
     - **Environment**: Production
   - Click "Save"

5. **Wait for Deploy** ✓
   - Vercel will build and deploy automatically
   - You'll get URL like: `https://safepulse-xxx.vercel.app`

---

## 🚀 Step 2: Deploy Backend to Railway

### Why Railway?
- ✅ Supports Node.js + persistent storage (SQLite)
- ✅ Free tier available ($5 credit/month)
- ✅ Easy setup with GitHub integration
- ✅ Auto-deploys on git push

### Setup

1. **Create Railway Account**:
   - Go to https://railway.app
   - Sign up with GitHub
   - Create new project

2. **Deploy Backend**:
   - Click "+ New Project"
   - Select "Deploy from GitHub repo"
   - Select your `med2predict` repo
   - Select branch: `main`
   - Railway auto-detects Node.js

3. **Configure Railway Environment**:
   - Go to Project → Variables
   - Add environment variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-secure-random-string-here
     PORT=4000
     ```
   - **⚠️ Important**: Use strong JWT_SECRET
     ```bash
     openssl rand -base64 32
     ```

4. **Configure Start Command**:
   - Railway → Deployments → Settings
   - Start Command: `npm run server`
   - Or in `package.json`, make sure `"start": "npm run server"` exists

5. **Enable Persistent Storage** (for SQLite):
   - Railway → Storage → Add Storage
   - Name: `safepulse-db`
   - Mount Path: `/app/server`
   - This keeps your database between deploys

6. **Get Backend URL**:
   - Railway → Environment
   - Look for `RAILWAY_PUBLIC_URL` (auto-generated)
   - Format: `https://safepulse-backend-xxx.railway.app`

---

## 🔗 Step 3: Connect Frontend to Backend

### Update Vercel Environment

1. **Go back to Vercel Dashboard**:
   - Project → Settings → Environment Variables
   - Edit `VITE_API_URL`
   - Change value to your Railway URL: `https://safepulse-backend-xxx.railway.app`
   - Save

2. **Redeploy Frontend**:
   - Vercel → Deployments
   - Click "Redeploy" on latest deployment
   - Wait for build to complete

3. **Test the Connection**:
   - Open frontend: `https://safepulse-xxx.vercel.app`
   - Go to Login page
   - Try logging in with: `admin@safepulse.local` / `Admin123!`
   - Should work! ✓

---

## 🧪 Testing After Deployment

### 1. Frontend Health Check
```bash
curl https://safepulse-xxx.vercel.app/
# Should return HTML with SafePulse content
```

### 2. Backend Health Check
```bash
curl https://safepulse-backend-xxx.railway.app/healthz
# Should return: {"ok":true,"patients":5}
```

### 3. Full Login Flow
```bash
curl -X POST https://safepulse-backend-xxx.railway.app/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@safepulse.local","password":"Admin123!"}'
# Should return JWT token
```

### 4. Browser Testing
- Open `https://safepulse-xxx.vercel.app` in browser
- Login with admin credentials
- Create a patient record
- Submit risk assessment
- Verify ML prediction shows

---

## 🛡️ Security Setup (Before Production)

### Step 1: Change Admin Password
```bash
# SSH into Railway backend (if supported) OR
# Via admin panel (you'll need to create this feature)
# Default: admin@safepulse.local / Admin123!
```

### Step 2: Update CORS in Backend
**File**: `server/index.js`
```javascript
app.use(cors({
  origin: [
    'https://safepulse-xxx.vercel.app',
    'https://www.safepulse-xxx.vercel.app'
  ],
  credentials: true
}));
```
Then push to GitHub → Railway auto-redeploys

### Step 3: Update JWT_SECRET
In Railway → Variables:
- Generate new random JWT_SECRET: `openssl rand -base64 32`
- Update in Railway dashboard
- Railway will auto-redeploy

### Step 4: Set Custom Domain (Optional)
**Vercel**:
- Settings → Domains
- Add your domain (e.g., `safepulse.com`)
- Follow DNS setup instructions

**Railway**:
- Settings → Domains
- Add subdomain (e.g., `api.safepulse.com`)

---

## 💰 Cost Breakdown

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Pro | $20/mo | Or free if <100GB bandwidth/mo |
| **Railway** | Pay-as-you-go | ~$5-15/mo | $5 credit included, storage ~$1/GB/mo |
| **Domain** (optional) | .com | $10-15/yr | Not required for deployment |
| **Total** | | ~$20-30/mo | Can be free with free tiers |

---

## 📊 Monitoring & Logs

### Vercel Logs
- Dashboard → Deployments → Runtime Logs
- Shows frontend build and runtime errors

### Railway Logs
- Dashboard → Deployments → Logs
- Shows backend API logs
- Look for `[auth:login] attempt` debug messages

---

## 🔄 Auto-Deploy Setup

Both Vercel and Railway auto-deploy when you push to GitHub:

1. Make code changes locally
2. Commit: `git commit -m "Update login"`
3. Push: `git push origin main`
4. **Automatic redeploy** starts in Vercel + Railway
5. New version live in ~2-5 minutes

---

## ✅ Deployment Checklist

- [ ] Created GitHub repo with code
- [ ] Deployed frontend to Vercel
- [ ] Deployed backend to Railway
- [ ] Set `VITE_API_URL` in Vercel environment
- [ ] Set `JWT_SECRET` in Railway environment
- [ ] Verified health endpoints work
- [ ] Tested login flow
- [ ] Updated CORS for production domains
- [ ] Changed default admin password
- [ ] Set up monitoring/logging
- [ ] (Optional) Added custom domain

---

## 🚨 Troubleshooting

### Frontend Shows "Check credentials and try again"
1. Check `VITE_API_URL` is correct in Vercel environment
2. Verify Railway backend is running: `curl https://safepulse-backend-xxx.railway.app/healthz`
3. Check CORS settings in `server/index.js`
4. Redeploy both services

### ML Model Not Loading
1. Verify `public/model/heart_gb.onnx` exists in repo (check Git LFS if large file)
2. Frontend can access: `https://safepulse-xxx.vercel.app/model/heart_gb.onnx`
3. Check browser console for WASM errors

### Database Lost After Railway Redeploy
1. Railway storage must be configured (Step 2.5 above)
2. If not configured, SQLite file is ephemeral
3. Reconfigure storage mount path to `/app/server`

### JWT Errors After Redeploying
1. If you changed `JWT_SECRET` in Railway, all existing tokens become invalid
2. Users must log in again
3. This is expected behavior ✓

---

## 📈 Next Steps

1. ✅ Deploy with this guide
2. ✅ Test in production
3. ⬜ Set up automated backups (download SQLite weekly)
4. ⬜ Add rate limiting to `/auth/login`
5. ⬜ Monitor error rates and logs
6. ⬜ Plan PostgreSQL migration when user base grows (1000+ users)

---

**Ready to deploy? Start with Step 1 above!** 🚀
