import psycopg2
import os
import json
import time
import secrets
import string
import random
import traceback
import logging
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import urlparse

# Cấu hình logging để ghi vào file cụ thể
logging.basicConfig(filename='/home/khoablabla2013/debug_db.log', level=logging.DEBUG)

app = Flask(__name__)

# Cấu hình CORS cho phép frontend localhost:5173
CORS(app, 
     origins=['http://localhost:5173', 'https://khoablabla2013.pythonanywhere.com'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

def log_error(error_message):
    """Ghi lỗi vào file error_log.txt"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    error_entry = f"[{timestamp}] {error_message}\n"
    
    try:
        with open('error_log.txt', 'a', encoding='utf-8') as f:
            f.write(error_entry)
    except Exception as e:
        print(f"[LOG_ERROR] Failed to write to error_log.txt: {e}") 

app = Flask(__name__)

# Cấu hình CORS cho phép frontend localhost:5173
CORS(app, 
     origins=['http://localhost:5173', 'https://khoablabla2013.pythonanywhere.com'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

class NeonKeySystem:
    def __init__(self):
        self.conn = None
        self.db_config = self.parse_database_url()
        self.connect_db()
        self.init_tables()
    
    def parse_database_url(self):
        """Parse DATABASE_URL từ biến môi trường"""
        try:
            # Sử dụng biến môi trường DATABASE_URL
            db_url = os.environ.get('DATABASE_URL')
            if not db_url:
                log_error("DATABASE_URL not found in environment variables")
                return None
            
            parsed = urlparse(db_url)
            
            config = {
                'host': parsed.hostname,
                'port': parsed.port or 5432,  # Port 5432 cho PostgreSQL
                'database': parsed.path.lstrip('/'),
                'user': parsed.username,
                'password': parsed.password,
                'sslmode': 'require'  # SSL bắt buộc cho Neon
            }
            
            safe_config = config.copy()
            safe_config['password'] = '***'
            log_error(f"DATABASE CONFIG: {safe_config}")
            log_error(f"DATABASE_URL from env: {db_url[:50]}...")
            return config
            
        except Exception as e:
            log_error(f"Failed to parse DATABASE_URL: {e}")
            return None
    
    def connect_db(self):
        """Kết nối đến Neon Database với psycopg2"""
        if not self.db_config:
            log_error("No database configuration available")
            return False
        
        try:
            if self.conn:
                self.conn.close()
            
            self.conn = psycopg2.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                database=self.db_config['database'],
                user=self.db_config['user'],
                password=self.db_config['password'],
                sslmode=self.db_config['sslmode'],
                connect_timeout=10
            )
            
            self.conn.autocommit = True
            
            # Test connection
            with self.conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            log_error("✅ Database connection successful!")
            return True
            
        except Exception as e:
            log_error(f"❌ DATABASE CONNECTION ERROR: {e}")
            log_error(f"CONNECTION TYPE: {type(e).__name__}")
            self.conn = None
            return False
    
    def init_tables(self):
        """Auto-create tables"""
        if not self.conn:
            log_error("Cannot create tables - no database connection")
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
            
            log_error("✅ Tables initialized successfully")
            return True
            
        except Exception as e:
            log_error(f"❌ Failed to create tables: {e}")
            log_error(f"Traceback: {traceback.format_exc()}")
            return False
    
    def execute_query(self, query, params=None):
        """Execute query với psycopg2"""
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
                    
        except Exception as e:
            log_error(f"❌ Query error: {e}")
            log_error(f"Query: {query[:100]}...")
            log_error(f"Traceback: {traceback.format_exc()}")
            return None

# Initialize key system
try:
    log_error("=== STARTING DATABASE INITIALIZATION ===")
    key_system = NeonKeySystem()
    if key_system and key_system.conn:
        log_error("✅ Database connected successfully - Ready to execute queries")
    else:
        log_error("❌ Database connection failed")
except Exception as e:
    log_error(f"❌ Failed to initialize database: {e}")
    log_error(f"Traceback: {traceback.format_exc()}")
    key_system = None

@app.route('/api/test-db', methods=['GET'])
def test_database():
    """Test database connection"""
    try:
        if not key_system:
            return jsonify({'success': False, 'message': 'Key system not initialized'})
        
        result = key_system.execute_query("SELECT 1")
        if not result:
            return jsonify({'success': False, 'message': 'Database connection failed'})
        
        return jsonify({'success': True, 'message': 'Database connection successful'})
        
    except Exception as e:
        log_error(f"Database test error: {e}")
        return jsonify({'success': False, 'message': f'Database test failed: {str(e)}'})

@app.route('/api/check-service-keys', methods=['GET'])
def check_service_keys():
    """Check if service has active keys"""
    try:
        if not key_system:
            return jsonify({'hasKey': False, 'count': 0, 'nextExpiry': None})
        
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
        log_error(f"Service keys check error: {e}")
        return jsonify({'hasKey': False, 'count': 0, 'nextExpiry': None})

@app.route('/api/mark-session', methods=['POST'])
def mark_session():
    """Mark session trước khi chuyển trang"""
    try:
        if not key_system:
            return jsonify({'success': False, 'message': 'Key system not initialized'}), 500
        
        data = request.get_json()
        service_id = data.get('serviceId')
        random_id = data.get('randomId')
        ip_address = data.get('ipAddress', request.remote_addr)
        user_agent = data.get('userAgent', request.headers.get('User-Agent', ''))
        
        if not service_id or not random_id:
            return jsonify({'success': False, 'message': 'Missing serviceId or randomId'}), 400
        
        # Check if session already exists
        check_query = "SELECT id FROM user_sessions WHERE key = %s"
        result = key_system.execute_query(check_query, (random_id,))
        
        if result:
            return jsonify({'success': False, 'message': 'Session already exists'}), 400
        
        # Insert session marking
        insert_query = """
        INSERT INTO user_sessions (key, service, status, ip_address, expire_ts, hwid, cookies)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, expire_ts
        """
        
        session_expire_ts = int(time.time()) + 1800  # 30 minutes
        
        params = (
            random_id,
            service_id,
            'PENDING',
            ip_address,
            session_expire_ts,
            'PENDING_SESSION',
            json.dumps({'ua': user_agent, 'marked_at': time.time()})
        )
        
        result = key_system.execute_query(insert_query, params)
        
        if result:
            session_id = result[0][0]
            expire_ts = result[0][1]
            
            log_error(f"Session marked: {service_id}-{random_id} (ID: {session_id})")
            
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
        log_error(f"Session marking error: {e}")
        log_error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/check-key-status', methods=['GET'])
def check_key_status():
    """Kiểm tra trong Neon xem IP/User này đã có key chưa"""
    try:
        if not key_system:
            return jsonify({'hasKey': False, 'status': 'error'})
        
        service = request.args.get('service', 'lootlab')
        ip_address = request.remote_addr
        
        query = """
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE service = %s AND expire_ts > %s AND key LIKE 'KHOA-%'
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(query, (service, current_time))
        
        if result and result[0][0] > 0:
            return jsonify({
                'hasKey': True,
                'status': 'active',
                'count': result[0][0]
            })
        else:
            return jsonify({
                'hasKey': False,
                'status': 'none',
                'count': 0
            })
            
    except Exception as e:
        log_error(f"Key status check error: {e}")
        return jsonify({'hasKey': False, 'status': 'error'})

@app.route('/api/check-session-mark', methods=['POST'])
def check_session_mark():
    """Check session validity cho TimeSelectionPage"""
    try:
        if not key_system:
            return jsonify({'success': False, 'message': 'Key system not initialized'}), 500
        
        data = request.get_json()
        random_id = data.get('randomId')
        
        if not random_id:
            return jsonify({'success': False, 'message': 'Missing randomId'}), 400
        
        check_query = """
        SELECT service, status, expire_ts FROM user_sessions 
        WHERE key = %s AND expire_ts > %s
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(check_query, (random_id, current_time))
        
        if result:
            row = result[0]
            return jsonify({
                'success': True,
                'exists': True,
                'service': row[0],
                'status': row[1],
                'expireTs': row[2],
                'timeLeft': row[2] - current_time,
                'message': 'Session found and valid'
            })
        else:
            return jsonify({
                'success': True,
                'exists': False,
                'message': 'Session not found or expired'
            })
            
    except Exception as e:
        log_error(f"Session check error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        if not key_system:
            return jsonify({'status': 'unhealthy', 'error': 'Key system not initialized'}), 500
        
        result = key_system.execute_query("SELECT 1")
        db_status = "connected" if result is not None else "disconnected"
        
        return jsonify({
            'status': 'healthy',
            'database': db_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        log_error(f"Health check error: {e}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

# PythonAnywhere compatible - chỉ chạy app.run() khi local
if __name__ == '__main__':
    print("[FLASK_APP] 🚀 Starting Flask Application...")
    print(f"[FLASK_APP] 📊 DATABASE_URL configured: {'Yes' if NEON_DB_URL else 'No'}")
    
    if key_system and key_system.conn:
        print("[FLASK_APP] ✅ Database test passed - Ready to serve!")
    else:
        print("[FLASK_APP] ❌ Database test failed - Check configuration")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
