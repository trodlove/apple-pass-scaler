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

