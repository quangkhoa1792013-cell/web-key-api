import psycopg2
import os
import json
import time
import secrets
import string
from datetime import datetime, timedelta

class NeonKeySystemLogic:
    def __init__(self):
        self.conn = None
        self.connect_db()
    
    def load_conf(self):
        """Load configuration from setting.json with relative path"""
        try:
            with open('key/setting.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load config: {e}")
            # Return default config
            return {
                "app_name": "KHOADZ PREMIUM SYSTEM",
                "max_slots": 3,
                "test_duration": 30,
                "api_port": 5000,
                "secret_salt": "KHOA_DZ_2026"
            }
    
    def connect_db(self):
        try:
            database_url = os.environ.get('DATABASE_URL', 
                'postgresql://username:password@host:5432/dbname?sslmode=require')
            self.conn = psycopg2.connect(database_url)
            self.conn.autocommit = True
            print("[NeonKeySystem] Connected to Neon Database")
        except Exception as e:
            print(f"[NeonKeySystem] Database connection error: {e}")
            self.conn = None
    
    def execute_query(self, query, params=None):
        if not self.conn:
            self.connect_db()
        
        try:
            with self.conn.cursor() as cursor:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                if query.strip().upper().startswith('SELECT') or 'RETURNING' in query.upper():
                    result = cursor.fetchall()
                    return result
                else:
                    return cursor.rowcount
        except Exception as e:
            print(f"[NeonKeySystem] Query error: {e}")
            return None
    
    def init_tables(self):
        """Initialize keys table if not exists"""
        create_table_query = """
        CREATE TABLE IF NOT EXISTS keys (
            id SERIAL PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            hwid TEXT,
            ip TEXT,
            token TEXT,
            cookies TEXT,
            service TEXT,
            expire_ts BIGINT NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_keys_key ON keys(key);
        CREATE INDEX IF NOT EXISTS idx_keys_expire_ts ON keys(expire_ts);
        CREATE INDEX IF NOT EXISTS idx_keys_hwid ON keys(hwid);
        CREATE INDEX IF NOT EXISTS idx_keys_ip ON keys(ip);
        """
        
        result = self.execute_query(create_table_query)
        if result is not None:
            print("[NeonKeySystem] Tables initialized successfully")
    
    def create_key(self, duration_hours=24, hwid=None, ip=None, user_agent=None, cookies=None, token=None, service='lootlab'):
        """Create new key in Neon database"""
        if not self.conn:
            return None, "Database connection failed"
        
        # Initialize tables if needed
        self.init_tables()
        
        # Generate random key
        chars = string.ascii_letters + string.digits
        random_part = ''.join(secrets.choice(chars) for _ in range(25))
        key = f"KHOA-{duration_hours}-{random_part}"
        
        # Calculate expiration timestamp
        expire_ts = int(time.time()) + (duration_hours * 3600)
        
        # Insert new key
        insert_query = """
        INSERT INTO keys (key, hwid, ip, user_agent, cookies, token, service, expire_ts)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING key, expire_ts
        """
        
        params = (key, hwid, ip, user_agent, cookies, token, service, expire_ts)
        
        try:
            result = self.execute_query(insert_query, params)
            if result and len(result) > 0:
                return result[0], "SUCCESS"
            else:
                return None, "Insert failed"
        except Exception as e:
            if "duplicate key" in str(e).lower():
                return None, "KEY_EXISTS"
            return None, f"Database error: {e}"
    
    def verify_key(self, key, hwid=None, ip=None, user_agent=None, cookies=None, token=None):
        """Verify and update key with user information"""
        if not self.conn:
            return False, "Database connection failed"
        
        # Check if key exists and is valid
        check_query = """
        SELECT expire_ts, hwid FROM keys 
        WHERE key = %s AND expire_ts > %s
        FOR UPDATE
        """
        
        current_time = int(time.time())
        params = (key, current_time)
        
        result = self.execute_query(check_query, params)
        
        if not result or len(result) == 0:
            return False, "KEY_NOT_FOUND_OR_EXPIRED"
        
        stored_expire_ts, stored_hwid = result[0]
        
        # Check if key is already bound to different HWID
        if stored_hwid and stored_hwid != "NOT_LINKED" and hwid and stored_hwid != hwid:
            return False, "KEY_ALREADY_BOUND"
        
        # Update key with user information
        update_query = """
        UPDATE keys 
        SET hwid = COALESCE(%s, hwid),
            ip = COALESCE(%s, ip),
            user_agent = COALESCE(%s, user_agent),
            cookies = COALESCE(%s, cookies),
            token = COALESCE(%s, token),
            updated_at = NOW()
        WHERE key = %s
        """
        
        update_params = (hwid, ip, user_agent, cookies, token, key)
        update_result = self.execute_query(update_query, update_params)
        
        if update_result is not None:
            return True, "KEY_VERIFIED"
        else:
            return False, "Update failed"
    
    def get_key_info(self, key):
        """Get key information"""
        if not self.conn:
            return None
        
        query = """
        SELECT key, hwid, ip, user_agent, cookies, token, service, expire_ts, status,
               EXTRACT(EPOCH FROM created_at) as created_ts,
               EXTRACT(EPOCH FROM updated_at) as updated_ts
        FROM keys 
        WHERE key = %s
        """
        
        result = self.execute_query(query, (key,))
        
        if result and len(result) > 0:
            row = result[0]
            return {
                'key': row[0],
                'hwid': row[1],
                'ip': row[2],
                'user_agent': row[3],
                'cookies': row[4],
                'token': row[5],
                'service': row[6],
                'expire_ts': row[7],
                'status': row[8],
                'created_ts': row[9],
                'updated_ts': row[10]
            }
        return None
    
    def check_session_valid(self, random_id):
        """Check session validity by random_id (if stored in token field)"""
        if not self.conn:
            return False, "Database connection failed"
        
        query = """
        SELECT key, expire_ts FROM keys 
        WHERE token = %s AND expire_ts > %s
        """
        
        current_time = int(time.time())
        params = (random_id, current_time)
        
        result = self.execute_query(query, params)
        
        if result and len(result) > 0:
            return True, "SESSION_VALID"
        else:
            return False, "SESSION_INVALID_OR_EXPIRED"
    
    def cleanup_expired_keys(self):
        """Clean up expired keys"""
        if not self.conn:
            return 0
        
        delete_query = "DELETE FROM keys WHERE expire_ts <= %s"
        current_time = int(time.time())
        
        result = self.execute_query(delete_query, (current_time,))
        return result if result else 0
    
    def get_all_keys(self):
        """Get all keys for dashboard"""
        if not self.conn:
            return []
        
        query = """
        SELECT key, hwid, ip, expire_ts, status
        FROM keys 
        ORDER BY created_at DESC
        """
        
        result = self.execute_query(query)
        
        keys = []
        if result:
            for row in result:
                time_left = max(0, row[3] - int(time.time()))
                keys.append({
                    'id': row[0],  # Using key as ID
                    'key': row[0],
                    'hwid': row[1],
                    'ip': row[2],
                    'expire_ts': row[3],
                    'status': row[4],
                    'timeLeft': time_left
                })
        
        return keys

# Keep backward compatibility
class KeySystemLogic(NeonKeySystemLogic):
    pass