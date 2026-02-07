# 🚀 Vercel Full Stack Deployment Guide (PostgreSQL)

## 📐 Architecture

```
┌──────────────────────────────────────────────────────┐
│           Vercel (All-in-One Platform)               │
│                                                      │
│  Frontend (React SPA)         API Routes            │
│  https://safepulse.vercel.app                       │
│  /dist                        /api/*                 │
│                                  │                   │
│                                  ↓                   │
│                         Vercel Postgres DB          │
│                         (Serverless)                 │
└──────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Single platform (frontend + backend + database)
- ✅ Auto-scaling serverless functions
- ✅ Managed PostgreSQL with connection pooling
- ✅ Simple deployment (push to GitHub)
- ✅ Free tier available

---

## 📋 Prerequisites

1. **Vercel account** (free at https://vercel.com)
2. **GitHub account** with repo access
3. **Node.js 18+** installed locally
4. **Git** installed

---

## 🔧 Step 1: Install Dependencies

```bash
cd /Users/gokulmallabathula/med2predict
npm install @vercel/postgres @vercel/node dotenv tsx @types/bcryptjs @types/jsonwebtoken
```

---

## 📊 Step 2: Set Up PostgreSQL Database

### ⚠️ Important: Vercel Postgres Migration

Vercel has deprecated `@vercel/postgres` in favor of **Neon** as the native PostgreSQL provider. You have two options:

### Option A: Neon (Recommended)

**Why Neon:**
- ✅ Native Vercel integration
- ✅ Serverless PostgreSQL
- ✅ Better performance & scalability
- ✅ Free tier available

**Setup:**
1. Go to https://console.neon.tech
2. Sign up with GitHub
3. Create new project: `safepulse-db`
4. Copy connection string (starts with `postgres://`)
5. In Vercel Dashboard → Your Project → Settings → Environment Variables
6. Add: `DATABASE_URL` = `postgres://your-neon-url`

### Option B: Vercel Postgres (Legacy)

Still works but deprecated. Follow Step 2.2 below if you want to use it.

### 2.1 Create Vercel Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `med2predict` repo
4. Click "Import"
5. **Don't deploy yet** - we need to set up database first

### 2.2 Create PostgreSQL Database

1. In Vercel Dashboard → Your Project → "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Database name: `safepulse-db`
5. Region: Choose closest to your users
6. Click "Create"

### 2.3 Connect Database to Project

1. Database created → Click "Connect Project"
2. Select your project
3. Environment: "Production"
4. Click "Connect"

✅ Vercel automatically adds `POSTGRES_URL` and related env variables to your project

---

## 🔐 Step 3: Configure Environment Variables

### 3.1 In Vercel Dashboard

Go to Project → Settings → Environment Variables

Add these variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `JWT_SECRET` | (generate with `openssl rand -base64 32`) | Production |
| `NODE_ENV` | `production` | Production |
| `VITE_API_URL` | `/api` | Production |

**Important**: `POSTGRES_URL` is automatically set by Vercel when you connect the database.

### 3.2 For Local Development

Create `.env.local`:

```bash
# Get these from Vercel Dashboard → Storage → Your DB → .env.local tab
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"

# Local dev
JWT_SECRET=local-dev-secret-change-in-production
NODE_ENV=development
VITE_API_URL=/api
```

---

## 🗄️ Step 4: Migrate Data from SQLite to PostgreSQL

### 4.1 Prepare Migration

```bash
# Install dependencies
npm install

# Set PostgreSQL URL from Vercel
export POSTGRES_URL="postgres://your-url-from-vercel"
```

### 4.2 Run Migration Script

```bash
npm run migrate
```

This script:
- Reads your SQLite database (`server/safepulse.db`)
- Creates PostgreSQL tables
- Migrates all users, patients, and activity logs
- Creates indexes for performance
- Maps user IDs correctly

**Expected output:**
```
🔄 Starting SQLite → PostgreSQL migration...
✅ Connected to SQLite database
✅ Connected to PostgreSQL database
📋 Creating PostgreSQL tables...
✅ PostgreSQL tables created
👤 Migrating users...
  ✓ Migrated user: admin@safepulse.local
  ✓ Migrated user: test@example.com
✅ Migrated 3 users
📊 Migrating patients...
✅ Migrated 5 patients
📝 Migrating activity logs...
✅ Migrated 12 activity logs
🎉 Migration completed successfully!
```

---

## 🚀 Step 5: Deploy to Vercel

### 5.1 Push to GitHub

```bash
git add .
git commit -m "Add Vercel serverless API routes and PostgreSQL migration"
git push origin main
```

### 5.2 Trigger Deployment

Vercel automatically deploys when you push to GitHub. Watch the deployment:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Wait for build to complete (~2-3 minutes)
3. Click on deployment URL

### 5.3 Verify Deployment

```bash
# Test health endpoint
curl https://safepulse-xxx.vercel.app/api/healthz
# Expected: {"ok":true,"patients":5}

# Test login
curl -X POST https://safepulse-xxx.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@safepulse.local","password":"Admin123!"}'
# Expected: JWT token + user object
```

---

## 🧪 Step 6: Test Full Application

### 6.1 Browser Testing

1. Open `https://safepulse-xxx.vercel.app`
2. Click "Login"
3. Enter: `admin@safepulse.local` / `Admin123!`
4. Should redirect to dashboard ✓

### 6.2 Create Patient Record

1. Go to "Dashboard" → "Patient Data Form"
2. Fill in patient details
3. Click "Calculate Risk"
4. ML prediction should display instantly
5. Save patient record
6. Verify it appears in "Patients" page

---

## 📁 Project Structure

```
med2predict/
├── api/                       # Vercel Serverless Functions
│   ├── lib/
│   │   ├── db.ts             # PostgreSQL connection pool
│   │   ├── users.ts          # User management
│   │   ├── patients.ts       # Patient management
│   │   └── activity.ts       # Activity logging
│   ├── auth/
│   │   ├── login.ts          # POST /api/auth/login
│   │   ├── signup.ts         # POST /api/auth/signup
│   │   └── me.ts             # GET/PUT /api/auth/me
│   ├── patients/
│   │   ├── index.ts          # GET/POST /api/patients
│   │   └── [id].ts           # GET/PUT/DELETE /api/patients/:id
│   ├── activity.ts           # GET /api/activity
│   ├── users.ts              # GET /api/users
│   └── healthz.ts            # GET /api/healthz
├── src/                       # React frontend
├── dist/                      # Built frontend (auto-generated)
├── scripts/
│   └── migrate-to-postgres.ts # Migration script
├── vercel.json               # Vercel configuration
└── package.json              # Dependencies
```

---

## 🔄 API Routes Mapping

| Endpoint | Method | Vercel Function | Purpose |
|----------|--------|-----------------|---------|
| `/api/healthz` | GET | `api/healthz.ts` | Health check |
| `/api/auth/login` | POST | `api/auth/login.ts` | User login |
| `/api/auth/signup` | POST | `api/auth/signup.ts` | User registration |
| `/api/auth/me` | GET/PUT | `api/auth/me.ts` | Get/update profile |
| `/api/patients` | GET/POST | `api/patients/index.ts` | List/create patients |
| `/api/patients/:id` | GET/PUT/DELETE | `api/patients/[id].ts` | Get/update/delete patient |
| `/api/activity` | GET | `api/activity.ts` | Activity logs (admin) |
| `/api/users` | GET | `api/users.ts` | List users (admin) |

---

## 🛡️ Security Checklist

### Before Going Live:

- [ ] Generate strong `JWT_SECRET`: `openssl rand -base64 32`
- [ ] Change default admin password immediately
- [ ] Enable Vercel Preview Protection (Settings → General)
- [ ] Add custom domain with SSL
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure CORS if needed
- [ ] Enable rate limiting (Vercel Edge Config)
- [ ] Set up database backups (Vercel Postgres → Backups)
- [ ] Review Vercel security settings

---

## 💰 Cost Breakdown

| Service | Free Tier | Pro Tier | Notes |
|---------|-----------|----------|-------|
| **Vercel Hosting** | 100GB bandwidth/mo | $20/mo | Unlimited bandwidth |
| **Vercel Postgres** | 256 MB storage | $20/mo | 512 MB storage + backups |
| **Vercel Serverless Functions** | 100 GB-Hours/mo | Unlimited | Execution time |
| **Total** | **$0-20/mo** | **$40/mo** | Scales with usage |

**Free tier is sufficient for:**
- Development/staging environments
- Small teams (<100 users)
- Low to medium traffic (<10k requests/day)

---

## 📊 Monitoring & Logs

### View Logs

1. **Function Logs**: Vercel Dashboard → Deployments → Runtime Logs
2. **Database Queries**: Vercel Dashboard → Storage → Postgres → Insights
3. **Performance**: Vercel Analytics (enable in Settings)

### Debug Login Issues

Check function logs for:
```
[auth:login] attempt { email: 'user@example.com' }
[auth:login] success { email: 'user@example.com', userId: 1 }
```

Or failures:
```
[auth:login] failed - user not found { email: 'wrong@email.com' }
[auth:login] failed - bad password { email: 'admin@safepulse.local' }
```

---

## 🔄 Continuous Deployment

Vercel automatically redeploys on every push to `main`:

```bash
# Make code changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically:
# 1. Builds frontend (npm run build)
# 2. Deploys serverless functions
# 3. Updates live site in ~2 minutes
```

---

## 🚨 Troubleshooting

### "Cannot connect to database"

**Check:**
1. `POSTGRES_URL` is set in Vercel environment variables
2. Database is connected to project (Storage → Connect)
3. View function logs for detailed error

**Fix:**
```bash
# Re-link database
vercel env pull .env.local
npm run migrate  # Re-run if needed
```

### "Invalid credentials" on login

**Check:**
1. Database has admin user:
   ```bash
   # Connect via Vercel CLI
   vercel postgres sql -- "SELECT email, role FROM users"
   ```
2. If no admin user, run migration again

**Fix:**
```bash
npm run migrate  # Includes admin user seeding
```

### Serverless function timeout

**Cause:** PostgreSQL queries taking too long

**Fix:**
1. Check indexes are created (migration script does this)
2. Optimize queries in `api/lib/*.ts`
3. Use connection pooling (already configured)

### Migration fails

**Common issues:**
- Missing `POSTGRES_URL` environment variable
- SQLite database not found (`server/safepulse.db`)
- PostgreSQL connection limits

**Fix:**
```bash
# Ensure POSTGRES_URL is set
echo $POSTGRES_URL

# Run with verbose logging
npm run migrate 2>&1 | tee migration.log
```

---

## ⚡ Performance Optimization

### 1. Enable Edge Functions (Optional)

For even faster response times, convert API routes to Edge Functions:

```typescript
// api/auth/login.ts
export const config = {
  runtime: 'edge', // Run on Vercel Edge Network
};
```

### 2. Database Indexes

Already created by migration script:
- `idx_patients_owner_id`
- `idx_patients_saved_at`
- `idx_activity_created_at`
- `idx_users_email`

### 3. Frontend Optimization

```bash
# Build with production optimizations
npm run build

# Analyze bundle size
npx vite-bundle-visualizer
```

---

## 📈 Scaling Considerations

### When to upgrade from Free Tier:

- **Traffic**: >100 GB bandwidth/month
- **Database**: >256 MB data
- **Functions**: >100 GB-Hours execution time/month

### When to migrate to dedicated PostgreSQL:

- **Users**: >10,000 concurrent users
- **Database**: >10 GB data
- **Need**: Advanced PostgreSQL features (custom extensions, replication)

**Options:**
- Vercel Postgres Pro ($20/mo → $40/mo)
- External PostgreSQL (AWS RDS, DigitalOcean, Supabase)

---

## ✅ Deployment Checklist

- [ ] Installed `@vercel/postgres` and `@vercel/node`
- [ ] Created Vercel project
- [ ] Created Vercel Postgres database
- [ ] Connected database to project
- [ ] Set `JWT_SECRET` environment variable
- [ ] Ran migration script (`npm run migrate`)
- [ ] Pushed code to GitHub
- [ ] Verified deployment succeeded
- [ ] Tested `/api/healthz` endpoint
- [ ] Tested login flow
- [ ] Created patient record
- [ ] Verified ML prediction works
- [ ] Changed default admin password
- [ ] Enabled Vercel Analytics
- [ ] Set up custom domain (optional)
- [ ] Configured database backups

---

## 🎉 You're Live!

Your SafePulse application is now running on Vercel with:
- ✅ React frontend
- ✅ Serverless API routes
- ✅ PostgreSQL database
- ✅ ML inference in browser
- ✅ Auto-scaling
- ✅ Continuous deployment

**Next steps:**
1. Add custom domain
2. Set up monitoring/alerts
3. Invite team members
4. Start using in production!

---

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Edge Functions](https://vercel.com/docs/functions/edge-functions)

**Need help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) for general deployment info or contact support.
