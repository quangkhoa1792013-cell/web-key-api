import psycopg2
import os
import json
import time
import secrets
import string
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import urlparse, parse_qs

app = Flask(__name__)

# Cấu hình CORS cho phép frontend localhost:5173
CORS(app, 
     origins=['http://localhost:5173', 'https://khoablabla.pythonanywhere.com'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# Neon Database connection with proper URL parsing
NEON_DB_URL = os.environ.get('DATABASE_URL')

class NeonKeySystem:
    def __init__(self):
        self.conn = None
        self.db_config = self.parse_database_url()
        self.connect_db()
        self.init_tables()  # Auto-create tables on startup
    
    def parse_database_url(self):
        """Parse DATABASE_URL and ensure SSL mode"""
        if not NEON_DB_URL:
            print("[NEON] ❌ DATABASE_URL not found in environment variables")
            return None
        
        try:
            # Parse the URL
            parsed = urlparse(NEON_DB_URL)
            
            # Extract connection parameters
            config = {
                'host': parsed.hostname,
                'port': parsed.port or 5432,
                'database': parsed.path.lstrip('/'),
                'user': parsed.username,
                'password': parsed.password,
            }
            
            # Parse query parameters
            query_params = parse_qs(parsed.query)
            
            # Ensure sslmode=require
            if 'sslmode' not in query_params:
                config['sslmode'] = 'require'
            else:
                config['sslmode'] = query_params['sslmode'][0]
            
            print(f"[NEON] 📊 Database config parsed: {config['host']}:{config['port']}/{config['database']}")
            print(f"[NEON] 🔒 SSL mode: {config['sslmode']}")
            
            return config
            
        except Exception as e:
            print(f"[NEON] ❌ Failed to parse DATABASE_URL: {e}")
            return None
    
    def connect_db(self):
        """Connect to Neon Database with auto-reconnect"""
        if not self.db_config:
            print("[NEON] ❌ No database configuration available")
            return False
        
        try:
            # Close existing connection if any
            if self.conn:
                self.conn.close()
            
            # Create new connection with SSL
            self.conn = psycopg2.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                database=self.db_config['database'],
                user=self.db_config['user'],
                password=self.db_config['password'],
                sslmode=self.db_config['sslmode']
            )
            
            self.conn.autocommit = True
            
            # Test connection
            with self.conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            print("[NEON] ✅ Kết nối thành công!")
            return True
            
        except Exception as e:
            print(f"[NEON] ❌ Database connection error: {e}")
            print(f"[NEON] Error type: {type(e).__name__}")
            self.conn = None
            return False
    
    def init_tables(self):
        """Auto-create tables if they don't exist"""
        if not self.conn:
            print("[NEON] ❌ Cannot create tables - no database connection")
            return False
        
        try:
            create_table_query = """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) UNIQUE NOT NULL,
                hwid VARCHAR(255),
                ip_address INET,
                cookies TEXT,
                token VARCHAR(255),
                service VARCHAR(50),
                expire_ts BIGINT NOT NULL,
                status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_user_sessions_key ON user_sessions(key);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_expire_ts ON user_sessions(expire_ts);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_hwid ON user_sessions(hwid);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_service ON user_sessions(service);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
            """
            
            with self.conn.cursor() as cursor:
                cursor.execute(create_table_query)
            
            print("[NEON] ✅ Tables initialized successfully")
            return True
            
        except Exception as e:
            print(f"[NEON] ❌ Failed to create tables: {e}")
            return False
    
    def execute_query(self, query, params=None):
        """Execute query with auto-reconnect capability"""
        # Try to execute query
        try:
            if not self.conn:
                if not self.connect_db():
                    return None
            
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
                    
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            print(f"[NEON] ⚠️ Connection lost, attempting reconnect: {e}")
            
            # Try to reconnect
            if self.connect_db():
                print("[NEON] ✅ Reconnected successfully")
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
                except Exception as retry_error:
                    print(f"[NEON] ❌ Query failed after reconnect: {retry_error}")
                    return None
            else:
                print("[NEON] ❌ Reconnect failed")
                return None
                
        except Exception as e:
            print(f"[NEON] ❌ Query error: {e}")
            print(f"[NEON] Query: {query[:100]}...")
            return None

# Initialize key system
key_system = NeonKeySystem()

@app.route('/api/test-db', methods=['GET'])
def test_database():
    """Test database connection and table existence"""
    try:
        # Test basic connection
        result = key_system.execute_query("SELECT 1")
        if not result:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            })
        
        # Test table existence
        table_check = key_system.execute_query("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'user_sessions'
        """)
        
        if not table_check:
            return jsonify({
                'success': False,
                'message': 'Table user_sessions does not exist'
            })
        
        # Test table structure
        structure_check = key_system.execute_query("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions'
            ORDER BY ordinal_position
        """)
        
        return jsonify({
            'success': True,
            'message': 'Database connection successful',
            'table_exists': True,
            'table_structure': structure_check
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Database test failed: {str(e)}'
        })

@app.route('/api/mark-session', methods=['POST'])
def mark_session():
    """Mark session in database BEFORE frontend navigation"""
    try:
        data = request.get_json()
        service_id = data.get('serviceId')
        random_id = data.get('randomId')
        ip_address = data.get('ipAddress', request.remote_addr)
        user_agent = data.get('userAgent', request.headers.get('User-Agent', ''))
        
        if not service_id or not random_id:
            return jsonify({'success': False, 'message': 'Missing serviceId or randomId'}), 400
        
        # Check if session already exists
        check_query = """
        SELECT id FROM user_sessions 
        WHERE key = %s
        """
        
        result = key_system.execute_query(check_query, (random_id,))
        
        if result:
            return jsonify({'success': False, 'message': 'Session already exists'}), 400
        
        # Insert session marking into database
        insert_query = """
        INSERT INTO user_sessions (key, service, status, ip_address, expire_ts, hwid, cookies)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, expire_ts
        """
        
        # Session expires in 30 minutes (1800 seconds)
        session_expire_ts = int(time.time()) + 1800
        
        params = (
            random_id,           # key = randomId for marking
            service_id,          # service
            'PENDING',           # status = PENDING
            ip_address,          # ip_address
            session_expire_ts,   # expire_ts (30 minutes)
            'PENDING_SESSION',  # hwid = PENDING_SESSION
            json.dumps({'ua': user_agent, 'marked_at': time.time()})  # cookies
        )
        
        result = key_system.execute_query(insert_query, params)
        
        if result:
            session_id = result[0][0]
            expire_ts = result[0][1]
            
            print(f"[NEON] ✅ Session marked: {service_id}-{random_id} (ID: {session_id})")
            
            return jsonify({
                'success': True,
                'sessionId': session_id,
                'randomId': random_id,
                'serviceId': service_id,
                'expireTs': expire_ts,
                'message': 'Session marked successfully'
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to mark session'}), 500
            
    except Exception as e:
        print(f"[NEON] ❌ Session marking error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/check-session-mark', methods=['POST'])
def check_session_mark():
    """Check if session ID exists in database (for URL validation)"""
    try:
        data = request.get_json()
        random_id = data.get('randomId')
        
        if not random_id:
            return jsonify({'success': False, 'message': 'Missing randomId'}), 400
        
        # Check if session exists and is not expired
        check_query = """
        SELECT service, status, expire_ts FROM user_sessions 
        WHERE key = %s AND expire_ts > %s
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(check_query, (random_id, current_time))
        
        if result:
            row = result[0]
            service = row[0]
            status = row[1]
            expire_ts = row[2]
            
            return jsonify({
                'success': True,
                'exists': True,
                'service': service,
                'status': status,
                'expireTs': expire_ts,
                'timeLeft': expire_ts - current_time,
                'message': 'Session found and valid'
            })
        else:
            return jsonify({
                'success': True,
                'exists': False,
                'message': 'Session not found or expired'
            })
            
    except Exception as e:
        print(f"[NEON] ❌ Session check error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/check-service-keys', methods=['GET'])
def check_service_keys():
    """Check if service has active keys"""
    try:
        service = request.args.get('service', 'lootlab')
        
        query = """
        SELECT COUNT(*) as count, MIN(expire_ts) as next_expiry
        FROM user_sessions 
        WHERE service = %s AND expire_ts > %s AND key LIKE 'KHOA-%'
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(query, (service, current_time))
        
        if result:
            count = result[0][0]
            next_expiry = result[0][1]
            
            return jsonify({
                'hasKey': count > 0,
                'count': count,
                'nextExpiry': next_expiry
            })
        else:
            return jsonify({'hasKey': False, 'count': 0, 'nextExpiry': None})
            
    except Exception as e:
        print(f"[NEON] ❌ Service keys check error: {e}")
        return jsonify({'hasKey': False, 'count': 0, 'nextExpiry': None})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        result = key_system.execute_query("SELECT 1")
        db_status = "connected" if result is not None else "disconnected"
        
        return jsonify({
            'status': 'healthy',
            'database': db_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("[NEON] 🚀 Starting Enhanced Neon Database System...")
    print(f"[NEON] 📊 DATABASE_URL configured: {'Yes' if NEON_DB_URL else 'No'}")
    
    # Test database on startup
    if key_system.conn:
        print("[NEON] ✅ Database test passed - Ready to serve!")
    else:
        print("[NEON] ❌ Database test failed - Check configuration")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
