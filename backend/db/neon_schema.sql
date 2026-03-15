-- Neon Database Schema for KhoaDz Key System
-- PostgreSQL Schema

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    hwid VARCHAR(255),
    ip_address INET,
    cookies TEXT,
    token VARCHAR(255),
    expire_ts BIGINT NOT NULL,
    service VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_key ON user_sessions(key);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire_ts ON user_sessions(expire_ts);
CREATE INDEX IF NOT EXISTS idx_user_sessions_hwid ON user_sessions(hwid);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);

-- Function to check if key is valid
CREATE OR REPLACE FUNCTION is_key_valid(input_key VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_sessions 
        WHERE key = input_key 
        AND expire_ts > EXTRACT(EPOCH FROM NOW())
        AND (hwid IS NULL OR hwid = '')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get key info
CREATE OR REPLACE FUNCTION get_key_info(input_key VARCHAR(100))
RETURNS TABLE(
    key VARCHAR(100),
    hwid VARCHAR(255),
    ip_address INET,
    expire_ts BIGINT,
    service VARCHAR(50),
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.key,
        us.hwid,
        us.ip_address,
        us.expire_ts,
        us.service,
        CASE 
            WHEN us.expire_ts > EXTRACT(EPOCH FROM NOW()) THEN true 
            ELSE false 
        END as is_valid
    FROM user_sessions us
    WHERE us.key = input_key;
END;
$$ LANGUAGE plpgsql;

-- Function to create new key
CREATE OR REPLACE FUNCTION create_new_key(
    p_service VARCHAR(50),
    p_duration_hours INTEGER,
    p_hwid VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_cookies TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    key VARCHAR(100),
    expire_ts BIGINT,
    message TEXT
) AS $$
DECLARE
    new_key VARCHAR(100);
    new_expire_ts BIGINT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    chars_length INTEGER := 52;
BEGIN
    -- Generate random key
    new_key := 'KHOA-' || p_duration_hours || '-';
    FOR i IN 1..25 LOOP
        new_key := new_key || SUBSTRING(chars, FLOOR(RANDOM() * chars_length + 1)::INTEGER, 1);
    END LOOP;
    
    -- Calculate expiration timestamp
    new_expire_ts := EXTRACT(EPOCH FROM NOW()) + (p_duration_hours * 3600);
    
    -- Insert new key
    BEGIN
        INSERT INTO user_sessions (
            key, hwid, ip_address, cookies, expire_ts, service
        ) VALUES (
            new_key, p_hwid, p_ip_address, p_cookies, new_expire_ts, p_service
        );
        
        success := true;
        message := 'Key created successfully';
    EXCEPTION
        WHEN unique_violation THEN
            success := false;
            message := 'Key already exists';
        WHEN OTHERS THEN
            success := false;
            message := 'Database error: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT success, new_key, new_expire_ts, message;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and bind key to HWID
CREATE OR REPLACE FUNCTION validate_and_bind_key(
    p_key VARCHAR(100),
    p_hwid VARCHAR(255),
    p_ip_address INET DEFAULT NULL,
    p_cookies TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    expire_ts BIGINT
) AS $$
DECLARE
    key_exists BOOLEAN;
    current_expire_ts BIGINT;
BEGIN
    -- Check if key exists and is valid
    SELECT expire_ts INTO current_expire_ts
    FROM user_sessions 
    WHERE key = p_key;
    
    IF NOT FOUND THEN
        success := false;
        message := 'KEY_NOT_FOUND';
        RETURN QUERY SELECT success, message, NULL::BIGINT;
        RETURN;
    END IF;
    
    -- Check if key is expired
    IF current_expire_ts <= EXTRACT(EPOCH FROM NOW()) THEN
        success := false;
        message := 'KEY_EXPIRED';
        RETURN QUERY SELECT success, message, current_expire_ts;
        RETURN;
    END IF;
    
    -- Update key with HWID and session info
    UPDATE user_sessions 
    SET hwid = p_hwid,
        ip_address = p_ip_address,
        cookies = p_cookies,
        updated_at = NOW()
    WHERE key = p_key;
    
    success := true;
    message := 'KEY_VALID';
    RETURN QUERY SELECT success, message, current_expire_ts;
END;
$$ LANGUAGE plpgsql;

-- Function to check heartbeat (for script validation)
CREATE OR REPLACE FUNCTION check_heartbeat(
    p_key VARCHAR(100),
    p_hwid VARCHAR(255)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    expire_ts BIGINT
) AS $$
DECLARE
    current_expire_ts BIGINT;
    stored_hwid VARCHAR(255);
BEGIN
    -- Get key info
    SELECT expire_ts, hwid INTO current_expire_ts, stored_hwid
    FROM user_sessions 
    WHERE key = p_key;
    
    IF NOT FOUND THEN
        success := false;
        message := 'KEY_NOT_FOUND';
        RETURN QUERY SELECT success, message, NULL::BIGINT;
        RETURN;
    END IF;
    
    -- Check if key is expired
    IF current_expire_ts <= EXTRACT(EPOCH FROM NOW()) THEN
        success := false;
        message := 'KEY_EXPIRED';
        RETURN QUERY SELECT success, message, current_expire_ts;
        RETURN;
    END IF;
    
    -- Check HWID match
    IF stored_hwid IS NOT NULL AND stored_hwid != '' AND stored_hwid != p_hwid THEN
        success := false;
        message := 'HWID_MISMATCH';
        RETURN QUERY SELECT success, message, current_expire_ts;
        RETURN;
    END IF;
    
    success := true;
    message := 'KEY_VALID';
    RETURN QUERY SELECT success, message, current_expire_ts;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired keys (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expire_ts <= EXTRACT(EPOCH FROM NOW());
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
