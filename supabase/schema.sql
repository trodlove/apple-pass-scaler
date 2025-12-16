-- Create status enum for developer accounts
CREATE TYPE apple_account_status AS ENUM (
    'ACTIVE', 
    'BURNED', 
    'COOLDOWN'
);

-- Table to manage the pool of Apple Developer Accounts (for churn-and-burn)
CREATE TABLE apple_developer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- A friendly name, e.g., "Account 1 - John Doe"
    team_id TEXT NOT NULL,
    pass_type_id TEXT NOT NULL UNIQUE,
    apns_key_id TEXT NOT NULL, -- The Key ID for the .p8 file
    apns_auth_key TEXT NOT NULL, -- The content of the .p8 file
    pass_signer_cert TEXT NOT NULL, -- The content of the pass.cer file
    pass_signer_key TEXT NOT NULL, -- The content of the private key (.p12 export)
    wwdr_cert TEXT NOT NULL, -- The content of the Apple WWDR cert
    status apple_account_status NOT NULL DEFAULT 'ACTIVE',
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for pass templates
CREATE TABLE pass_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pass_style TEXT NOT NULL, -- e.g., coupon, loyalty, generic
    fields JSONB NOT NULL, -- The JSON structure of the pass fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for individual passes issued to users
CREATE TABLE passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT NOT NULL UNIQUE,
    authentication_token TEXT NOT NULL UNIQUE,
    template_id UUID REFERENCES pass_templates(id),
    apple_account_id UUID REFERENCES apple_developer_accounts(id),
    pass_data JSONB, -- User-specific values, including all tracking params
    revenue NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW() -- CRITICAL: Used by iOS to determine which passes need updating
);

-- Table for devices that have a pass installed
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_library_identifier TEXT NOT NULL UNIQUE,
    push_token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Join table for the many-to-many relationship between passes and devices
CREATE TABLE registrations (
    pass_id UUID REFERENCES passes(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (pass_id, device_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for notification sequences
CREATE TABLE sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for the steps within each sequence
CREATE TABLE sequence_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_hours INTEGER NOT NULL DEFAULT 24,
    message_template TEXT NOT NULL, -- e.g., "New offer just for you: %@"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sequence_id, step_number)
);

-- Table to track which pass is in which sequence
CREATE TABLE sequence_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID REFERENCES passes(id) ON DELETE CASCADE UNIQUE,
    sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    next_execution_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, COMPLETED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_passes_serial_number ON passes(serial_number);
CREATE INDEX idx_passes_authentication_token ON passes(authentication_token);
CREATE INDEX idx_passes_apple_account_id ON passes(apple_account_id);
CREATE INDEX idx_passes_pass_data ON passes USING GIN(pass_data);
CREATE INDEX idx_devices_device_library_identifier ON devices(device_library_identifier);
CREATE INDEX idx_registrations_pass_id ON registrations(pass_id);
CREATE INDEX idx_registrations_device_id ON registrations(device_id);
CREATE INDEX idx_apple_accounts_status ON apple_developer_accounts(status);
CREATE INDEX idx_apple_accounts_last_used_at ON apple_developer_accounts(last_used_at);
CREATE INDEX idx_sequence_enrollments_next_execution_at ON sequence_enrollments(next_execution_at);
CREATE INDEX idx_sequence_enrollments_status ON sequence_enrollments(status);
CREATE INDEX idx_sequence_steps_sequence_id ON sequence_steps(sequence_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_apple_developer_accounts_updated_at BEFORE UPDATE ON apple_developer_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pass_templates_updated_at BEFORE UPDATE ON pass_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_steps_updated_at BEFORE UPDATE ON sequence_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_enrollments_updated_at BEFORE UPDATE ON sequence_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table for storing Vercel logs from Log Drains
CREATE TABLE vercel_logs (
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
CREATE INDEX idx_vercel_logs_timestamp ON vercel_logs(timestamp DESC);
CREATE INDEX idx_vercel_logs_level ON vercel_logs(level);
CREATE INDEX idx_vercel_logs_path ON vercel_logs(path);
CREATE INDEX idx_vercel_logs_request_id ON vercel_logs(request_id);
CREATE INDEX idx_vercel_logs_message ON vercel_logs USING GIN(to_tsvector('english', message));

