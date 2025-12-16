# Setup Vercel Log Drain

This guide will help you set up automatic log forwarding from Vercel to your application.

## Step 1: Deploy the Log Drain Endpoint

The log drain endpoint is already created at `/api/logs/drain`. Make sure it's deployed to Vercel.

## Step 2: Create the Logs Table in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Table for storing Vercel logs from Log Drains
CREATE TABLE IF NOT EXISTS vercel_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    message TEXT NOT NULL,
    level TEXT DEFAULT 'info',
    project TEXT DEFAULT 'apple-pass-scaler',
    deployment TEXT,
    source TEXT DEFAULT 'runtime',
    request_id TEXT,
    status INTEGER,
    method TEXT,
    path TEXT,
    user_agent TEXT,
    ip TEXT,
    region TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for log queries
CREATE INDEX IF NOT EXISTS idx_vercel_logs_timestamp ON vercel_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_logs_level ON vercel_logs(level);
CREATE INDEX IF NOT EXISTS idx_vercel_logs_path ON vercel_logs(path);
CREATE INDEX IF NOT EXISTS idx_vercel_logs_request_id ON vercel_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_vercel_logs_message ON vercel_logs USING GIN(to_tsvector('english', message));
```

## Step 3: Configure Log Drain in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `apple-pass-scaler`
3. Go to **Settings** → **Log Drains**
4. Click **Add Log Drain**
5. Configure:
   - **Name**: `Apple Pass Scaler Logs`
   - **URL**: `https://apple-pass-scaler.vercel.app/api/logs/drain`
   - **Source**: Select **Runtime Logs** (and optionally **Build Logs**)
   - **Sampling Rate**: 100% (or lower if you want to reduce volume)
6. Click **Create Log Drain**

## Step 4: Verify It's Working

1. Wait a few minutes for logs to start flowing
2. Check the endpoint: `GET https://apple-pass-scaler.vercel.app/api/logs/recent`
3. Or analyze logs: `GET https://apple-pass-scaler.vercel.app/api/logs/analyze`

## API Endpoints

- **POST /api/logs/drain** - Receives logs from Vercel (automatically called)
- **GET /api/logs/recent** - Get recent logs
  - Query params: `limit`, `since`, `level`, `search`
- **GET /api/logs/analyze** - Analyze logs automatically
  - Query params: `since`, `search`

## Example Usage

```bash
# Get recent logs
curl "https://apple-pass-scaler.vercel.app/api/logs/recent?limit=50"

# Analyze logs from last 10 minutes
curl "https://apple-pass-scaler.vercel.app/api/logs/analyze"

# Search for specific logs
curl "https://apple-pass-scaler.vercel.app/api/logs/recent?search=DEBUG"
```

