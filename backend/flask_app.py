"""
 * @file: flask_app.py
 * @path: roblox/backend/flask_app.py
 * @purpose: Flask application chính cho Roblox Key System backend
 * @functionality: API endpoints, database operations, key generation, validation, logging
 * @connections: Kết nối đến PostgreSQL database, Neon service, Telegram logging
"""
import psycopg2
import os
import json
import time
import traceback
import random
import string
import logging
import sys
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template_string, redirect
from flask_cors import CORS
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

# Cấu hình logging để ghi ra console (sys.stdout)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

app = Flask(__name__)

# Cấu hình CORS cho phép frontend từ nhiều domain
CORS(app, 
     origins=[
         'http://localhost:5173', 
         'http://localhost:3000',
         'https://khoablabla2013.pythonanywhere.com',
         'https://khoablabla2013.netlify.app',
         'https://khoablabla-backend.hf.space',  # Hugging Face Space
         r'^https://[a-zA-Z0-9-]+\.netlify\.app$',  # Regex cho tất cả netlify subdomains
         r'^https://[a-zA-Z0-9-]+\.hf\.space$',    # Regex cho tất cả Hugging Face Spaces
         r'^https://[a-zA-Z0-9-]+\.pages\.dev$',    # Regex cho Cloudflare Pages
         '*'  # Tạm thời cho phép tất cả origins trong development
     ],
     methods=['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
     allow_headers=[
         'Content-Type', 
         'Authorization', 
         'x-user-agent', 
         'x-timestamp',
         'X-HWID',
         'X-Session-ID',
         'X-Forwarded-For',
         'CF-Connecting-IP'  # Cloudflare headers
     ],
     supports_credentials=True)

def log_info(message):
    """Universal logging function with intelligent level detection"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Check if message contains success/starting indicators
    success_keywords = ['successful', 'Starting', 'Ready', '✅', 'started', 'completed', 'created', 'added', 'initialized']
    error_keywords = ['❌', 'Failed', 'Error', 'Exception', 'Traceback', 'failed', 'error', 'exception']
    traceback_keywords = ['Traceback', 'traceback', 'Exception', 'exception']
    
    message_lower = message.lower()
    
    if any(keyword.lower() in message_lower for keyword in traceback_keywords):
        # Always use info cho Traceback/Exception
        logging.info(f"[{timestamp}] INFO: {message}")
    elif any(keyword.lower() in message_lower for keyword in success_keywords):
        logging.info(f"[{timestamp}] INFO: {message}")
    elif any(keyword.lower() in message_lower for keyword in error_keywords):
        logging.info(f"[{timestamp}] INFO: {message}")
    else:
        # Default to info cho general messages
        logging.info(f"[{timestamp}] INFO: {message}")

def log_recon(recon_message):
    """Ghi bản tin trinh sát ra console với format nhất quán"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] RECON: {recon_message}")
    # Không dùng logging module để tránh hiển thị ERROR level

def log_radar(radar_message):
    """Ghi radar log ra console với format nhất quán"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] RADAR: {radar_message}")
    # Không dùng logging module để tránh hiển thị ERROR level

def extract_hwid():
    """Extract HWID from multiple sources with flexible fallback"""
    # 1. Try header first (most reliable)
    hwid = request.headers.get('X-HWID')
    if hwid and hwid != 'UNKNOWN':
        return hwid
    
    # 2. Try alternative header formats
    hwid = request.headers.get('X-hwid')
    if hwid and hwid != 'UNKNOWN':
        return hwid
    
    hwid = request.headers.get('hwid')
    if hwid and hwid != 'UNKNOWN':
        return hwid
    
    # 3. Try query parameters
    hwid = request.args.get('hwid')
    if hwid and hwid != 'UNKNOWN':
        return hwid
    
    # 4. Try JSON body for POST requests
    if request.is_json:
        data = request.get_json(silent=True)
        if data and isinstance(data, dict):
            hwid = data.get('hwid')
            if hwid and hwid != 'UNKNOWN':
                return hwid
    
    # 5. Try cookies
    hwid = request.cookies.get('hwid')
    if hwid and hwid != 'UNKNOWN':
        return hwid
    
    # 6. Flexible fallback for UNKNOWN HWID
    # Use IP-based temporary identifier to avoid blocking legitimate users
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    user_agent = request.headers.get('User-Agent', 'Unknown')
    
    # Create consistent temporary HWID from IP + User-Agent hash
    import hashlib
    hwid_seed = f"{ip}_{user_agent}"
    hwid_hash = hashlib.md5(hwid_seed.encode()).hexdigest()[:8].upper()
    temp_hwid = f"TEMP_{hwid_hash}"
    
    log_info(f"🔄 Using temporary HWID for unknown device: {temp_hwid} (IP: {ip})")
    
    return temp_hwid

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
                log_info("DATABASE_URL not found in environment variables")
                return None
            
            # Chuyển postgres:// thành postgresql:// cho psycopg2
            if db_url.startswith('postgres://'):
                db_url = db_url.replace('postgres://', 'postgresql://', 1)
                log_info(f"Converted postgres:// to postgresql:// for psycopg2 compatibility")
            
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
            log_info(f"DATABASE CONFIG: {safe_config}")
            log_info(f"DATABASE_URL from env: {db_url[:50]}...")
            return config
            
        except Exception as e:
            log_info(f"Failed to parse DATABASE_URL: {e}")
            return None
    
    def connect_db(self):
        """Kết nối đến Neon Database với psycopg2 với enhanced timeout và retry"""
        if not self.db_config:
            log_info("No database configuration available")
            return False
        
        max_connection_attempts = 3
        for attempt in range(max_connection_attempts):
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
                    connect_timeout=15,  # Increased timeout
                    application_name='roblox_key_system',
                    keepalives=1,  # Enable TCP keepalives
                    keepalives_idle=30,  # 30 seconds idle before keepalive
                    keepalives_interval=10,  # 10 seconds between keepalives
                    keepalives_count=3  # 3 keepalive attempts
                )
                
                self.conn.autocommit = True
                
                # Test connection with simple query
                with self.conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
                
                log_info("✅ Database connection successful!")
                return True
                
            except psycopg2.OperationalError as e:
                if "SSL connection has been closed unexpectedly" in str(e):
                    log_info(f"🔄 SSL connection issue on attempt {attempt + 1}/{max_connection_attempts}, retrying...")
                else:
                    log_info(f"❌ DATABASE CONNECTION ERROR (Attempt {attempt + 1}/{max_connection_attempts}): {e}")
                
                if attempt == max_connection_attempts - 1:
                    log_info(f"❌ Failed to connect after {max_connection_attempts} attempts")
                    self.conn = None
                    return False
                
                time.sleep(2 ** attempt)  # Exponential backoff
                
            except Exception as e:
                log_info(f"❌ DATABASE CONNECTION ERROR (Attempt {attempt + 1}/{max_connection_attempts}): {e}")
                log_info(f"CONNECTION TYPE: {type(e).__name__}")
                
                if attempt == max_connection_attempts - 1:
                    self.conn = None
                    return False
                
                time.sleep(2 ** attempt)  # Exponential backoff
        
        return False
    
    def init_tables(self):
        """Auto-create tables with anti-skipping columns"""
        if not self.conn:
            log_info("Cannot create tables - no database connection")
            return False
        
        try:
            # Create main table
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
                process_completed BOOLEAN DEFAULT FALSE,
                verification_steps INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                -- Anti-sharing fields
                session_ip_hwid VARCHAR(255),  -- Store IP+HWID combination for this session
                session_locked BOOLEAN DEFAULT FALSE  -- Lock session to prevent sharing
            );
            """
            
            with self.conn.cursor() as cursor:
                cursor.execute(create_table_query)
            
            # Check and add missing columns for existing tables
            self.add_missing_columns()
            
            # Create indexes for performance
            self.create_indexes()
            
            log_info("✅ Tables initialized successfully")
            return True
            
        except Exception as e:
            log_info(f"❌ Failed to create tables: {e}")
            log_info(f"Traceback: {traceback.format_exc()}")
            return False
    
    def add_missing_columns(self):
        """Add missing columns to existing user_sessions table"""
        try:
            with self.conn.cursor() as cursor:
                # Add process_completed column directly with IF NOT EXISTS
                cursor.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS process_completed BOOLEAN DEFAULT FALSE")
                log_info("✅ Added process_completed column if not exists")
                
                # Check existing columns for other columns
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'user_sessions' 
                    AND table_schema = current_schema()
                """)
                existing_columns = [row[0] for row in cursor.fetchall()]
                
                # Add other missing columns
                columns_to_add = {
                    'verification_steps': 'INTEGER DEFAULT 0',
                    'session_ip_hwid': 'VARCHAR(255)',
                    'session_locked': 'BOOLEAN DEFAULT FALSE',
                    'session_token': 'VARCHAR(255)'
                }
                
                for column_name, column_def in columns_to_add.items():
                    if column_name not in existing_columns:
                        alter_query = f"ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS {column_name} {column_def}"
                        cursor.execute(alter_query)
                        log_info(f"✅ Added missing column: {column_name}")
                
                # Commit changes
                self.conn.commit()
                
        except Exception as e:
            log_info(f"❌ Failed to add missing columns: {e}")
            # Don't return False here, as table might already exist
    
    def create_indexes(self):
        """Create indexes for performance"""
        try:
            with self.conn.cursor() as cursor:
                index_queries = [
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_key ON user_sessions(key);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_expire_ts ON user_sessions(expire_ts);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_hwid ON user_sessions(hwid);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_service ON user_sessions(service);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_process_completed ON user_sessions(process_completed);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_session_ip_hwid ON user_sessions(session_ip_hwid);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_session_locked ON user_sessions(session_locked);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_verification_steps ON user_sessions(verification_steps);",
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);"
                ]
                
                for query in index_queries:
                    cursor.execute(query)
                
                self.conn.commit()
                log_info("✅ Database indexes created successfully")
                
        except Exception as e:
            log_info(f"❌ Failed to create indexes: {e}")
            # Don't return False here, as indexes might already exist
    
    def execute_query(self, query, params=None, max_retries=3):
        """Execute query với robust retry mechanism"""
        for attempt in range(max_retries):
            try:
                # Kiểm tra kết nối database
                if not self.conn or (hasattr(self.conn, 'closed') and self.conn.closed != 0):
                    log_info(f"🔄 Database connection lost, attempting to reconnect... (Attempt {attempt + 1}/{max_retries})")
                    if not self.connect_db():
                        log_info(f"❌ Failed to reconnect to database (Attempt {attempt + 1}/{max_retries})")
                        if attempt == max_retries - 1:
                            return None
                        time.sleep(1)  # Wait before retry
                        continue
                
                with self.conn.cursor() as cursor:
                    if params:
                        # Ensure params is always a tuple for psycopg2
                        if not isinstance(params, tuple):
                            params = tuple(params) if isinstance(params, (list, tuple)) else (params,)
                        cursor.execute(query, params)
                    else:
                        cursor.execute(query)
                    
                    if query.strip().upper().startswith('SELECT') or 'RETURNING' in query.upper():
                        result = cursor.fetchall()
                        return result
                    else:
                        return cursor.rowcount
                        
            except psycopg2.OperationalError as e:
                if "SSL connection has been closed unexpectedly" in str(e):
                    log_info(f"🔄 SSL connection closed, attempting to reconnect... (Attempt {attempt + 1}/{max_retries})")
                    self.conn = None
                    if attempt == max_retries - 1:
                        log_info(f"❌ Failed to reconnect after SSL connection closed (Attempt {attempt + 1}/{max_retries})")
                        return None
                    time.sleep(2)  # Wait longer for SSL issues
                    continue
                else:
                    log_info(f"❌ OperationalError: {e}")
                    if attempt == max_retries - 1:
                        return None
                    time.sleep(1)
                    continue
                    
            except psycopg2.InterfaceError as e:
                log_info(f"🔄 InterfaceError detected: {e} (Attempt {attempt + 1}/{max_retries})")
                log_info(f"🔄 Attempting to reconnect...")
                self.conn = None
                if self.connect_db():
                    log_info(f"✅ Reconnected successfully, retrying query... (Attempt {attempt + 1}/{max_retries})")
                    continue
                else:
                    log_info(f"❌ Failed to reconnect after InterfaceError (Attempt {attempt + 1}/{max_retries})")
                    if attempt == max_retries - 1:
                        return None
                    time.sleep(1)
                    continue
                    
            except psycopg2.DatabaseError as e:
                log_info(f"❌ DatabaseError: {e}")
                if attempt == max_retries - 1:
                    return None
                time.sleep(1)
                continue
                
            except Exception as e:
                log_info(f"❌ Unexpected error in execute_query: {e}")
                log_info(f"Traceback: {traceback.format_exc()}")
                if attempt == max_retries - 1:
                    return None
                time.sleep(1)
                continue
        
        return None

def auto_generate_key(service, ip_address):
    """Tự động tạo key mới khi user chưa có key"""
    try:
        if not key_system:
            return None
        
        # Tạo random string cho key
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
        new_key = f"KHOA-{random_part}"
        
        # Tính thời gian hết hạn (24h từ now)
        expire_ts = int(time.time()) + (24 * 60 * 60)
        
        # Insert key mới vào database
        insert_query = """
        INSERT INTO user_sessions (key, service, status, ip_address, expire_ts, hwid, cookies)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING key
        """
        
        params = (
            new_key,
            service,
            'ACTIVE',
            ip_address,
            expire_ts,
            'AUTO_GENERATED',
            json.dumps({'auto_generated': True, 'created_at': datetime.now().isoformat()})
        )
        
        result = key_system.execute_query(insert_query, params)
        
        if result and len(result) > 0:
            created_key = result[0][0]
            log_info(f"✅ Auto-generated key: {created_key} for service: {service}")
            return created_key
        else:
            log_info(f"❌ Failed to auto-generate key for service: {service}")
            return None
            
    except Exception as e:
        log_info(f"❌ Auto-generate key error: {e}")
        return None

# Initialize key system
try:
    log_info("=== STARTING DATABASE INITIALIZATION ===")
    key_system = NeonKeySystem()
    if key_system and key_system.conn:
        log_info("✅ Database connected successfully - Ready to execute queries")
    else:
        log_info("❌ Database connection failed")
except Exception as e:
    log_info(f"❌ Failed to initialize database: {e}")

# Add radar logging before request handling
@app.before_request
def radar_logging():
    """Log all incoming requests with HWID tracking"""
    try:
        # Đọc HWID từ Header - VIẾT HOA
        hwid = request.headers.get('X-HWID') or request.headers.get('x-hwid') or 'UNKNOWN'
        method = request.method
        path = request.path
        ip = request.remote_addr or 'unknown'
        
        # Only log API requests - Đảm bảo tiền tố [RADAR]
        if path.startswith('/api'):
            log_radar(f"[RADAR] {method} | {path} | HWID: {hwid} | IP: {ip}")
            
            # Luôn lưu HWID vào Database khi có thể (kể cả UNKNOWN)
            try:
                # Tìm session đang pending để cập nhật HWID
                update_query = """
                UPDATE user_sessions 
                SET hwid = %s, status = %s 
                WHERE hwid = 'UNKNOWN' OR hwid IS NULL
                AND key LIKE 'KHOA-%%'
                """
                
                params = (hwid, 'ACTIVE')
                key_system.execute_query(update_query, params)
                log_info(f"[RADAR] ✅ Updated HWID for pending sessions: {hwid}")
            except Exception as e:
                log_info(f"[RADAR] ❌ Failed to update HWID: {e}")
    except Exception as e:
        log_info(f"[RADAR] Logging error: {e}")

# Register radar function
app.before_request(radar_logging)

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
        log_info(f"Database test error: {e}")
        return jsonify({'success': False, 'message': f'Database test failed: {str(e)}'})

@app.route('/api/check-service-keys', methods=['GET'])
def check_service_keys():
    """Check if service has active keys"""
    try:
        if not key_system:
            return jsonify({'hasKey': False, 'count': 0, 'nextExpiry': None})
        
        service = request.args.get('service', 'lootlab')
        
        query = """
        SELECT COUNT(*) as count
        FROM user_sessions 
        WHERE service = %s AND expire_ts > %s AND key LIKE 'KHOA-%%'
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(query, (service, current_time))
        
        if result and len(result) > 0:
            row = result[0]
            count = row[0] if len(row) > 0 else 0
            
            return jsonify({
                'hasKey': count > 0,
                'count': count,
                'nextExpiry': None
            })
        else:
            return jsonify({
                'hasKey': False,
                'count': 0,
                'nextExpiry': None
            })
            
    except Exception as e:
        log_info(f"Service keys check error: {e}")
        return jsonify({'hasKey': False, 'count': 0, 'nextExpiry': None})

@app.route('/api/mark-session', methods=['POST'])
def mark_session():
    """Mark session trước khi chuyển trang - chỉ dùng IP và HWID để định danh"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Invalid JSON data'}), 400
        
        # Lấy user_agent
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # Lấy IP từ X-Forwarded-For hoặc remote_addr
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
            
        service_id = data.get('serviceId')
        
        # Lấy HWID từ nhiều nguồn
        hwid = extract_hwid()
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Tạo session identifier từ IP + HWID
        session_ip_hwid = f"{ip_address}_{hwid}"
        import hashlib
        import time
        session_seed = f"{service_id}_{ip_address}_{hwid}_{int(time.time())}"
        session_hash = hashlib.md5(session_seed.encode()).hexdigest()[:16].upper()
        session_key = f"MARK_{session_hash}"
        
        # Log bản tin trinh sát
        log_recon(f"[RECON] | IP: {ip_address} | HWID: {hwid} | ACTION: MARK_SESSION | SERVICE: {service_id} | URL: {target_url}")
        
        # Validate data
        if not service_id:
            return jsonify({'success': False, 'error': 'Missing service ID'}), 400
        
        # Insert session marking
        try:
            insert_query = """
            INSERT INTO user_sessions (key, service, status, ip_address, expire_ts, hwid, cookies, session_ip_hwid, session_locked)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, expire_ts
            """
            
            session_expire_ts = int(time.time()) + 1800  # 30 minutes
            
            params = (
                session_key,
                service_id,
                'PENDING',
                ip_address,
                session_expire_ts,
                hwid,
                json.dumps({'ua': user_agent, 'marked_at': time.time()}),
                session_ip_hwid,
                True
            )
            
            result = key_system.execute_query(insert_query, params)
            
            if result:
                session_id = result[0][0]
                expire_ts = result[0][1]
                
                # Log bản tin trinh sát khi thành công
                log_recon(f"[RECON] | IP: {ip_address} | ACTION: MARKED_SUCCESS | TOKEN: {session_id} | TARGET_URL: {target_url}")
                
                return jsonify({
                    'success': True,
                    'sessionId': session_id,
                    'serviceId': service_id,
                    'expireTs': expire_ts,
                    'message': 'Session marked successfully'
                })
            else:
                return jsonify({'success': False, 'error': 'Failed to mark session - database returned none'}), 500
                
        except Exception as db_error:
            log_info(f"Database insert error: {db_error}")
            return jsonify({'success': False, 'error': 'Database insert failed'}), 500
            
    except ValueError as ve:
        log_info(f"Value error in mark_session: {ve}")
        return jsonify({'success': False, 'error': f'Invalid data format: {str(ve)}'}), 400
    except json.JSONDecodeError as je:
        log_info(f"JSON decode error in mark_session: {je}")
        return jsonify({'success': False, 'error': 'Invalid JSON format'}), 400
    except Exception as e:
        log_info(f"Unexpected error in mark_session: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/check-key-status', methods=['GET'])
def check_key_status():
    """Kiểm tra trong Neon xem IP/User này đã có key chưa"""
    try:
        if not key_system:
            return jsonify({'hasKey': False, 'status': 'error'})
        
        # Lấy user_agent
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # Lấy IP từ X-Forwarded-For hoặc remote_addr
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        service = request.args.get('service', 'lootlab')
        # Lấy HWID từ nhiều nguồn
        request_hwid = extract_hwid()
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Log bản tin trinh sát
        log_recon(f"[RECON] | IP: {ip_address} | HWID: {request_hwid} | ACTION: CHECK_KEY | SERVICE: {service} | URL: {target_url}")
        
        # Kiểm tra key cho service cụ thể - lấy thông tin chi tiết
        query = """
        SELECT key, expire_ts, status, service, hwid
        FROM user_sessions 
        WHERE service = %s AND key LIKE 'KHOA-%%'
        ORDER BY expire_ts DESC
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(query, (service,))
        
        if result and len(result) > 0:
            # Kiểm tra key còn hạn không
            for row in result:
                key_value = row[0]
                expire_ts = row[1]
                status = row[2]
                key_service = row[3]
                db_hwid = row[4]
                
                # Kiểm tra HWID đã có giá trị chưa
                if db_hwid and db_hwid != 'UNKNOWN' and db_hwid != request_hwid:
                    # Nếu trong DB là AUTO_GENERATED, ghi log và báo cho frontend
                    if db_hwid == "AUTO_GENERATED":
                        return jsonify({
                            'hasKey': True,
                            'status': 'hwid_required',
                            'key': key_value,
                            'expireTs': expire_ts,
                            'service': key_service,
                            'currentTime': current_time,
                            'message': 'HWID verification required - Please update on client side'
                        })
                    else:
                        return jsonify({
                            'hasKey': False,
                            'status': 'device_mismatch',
                            'error': 'Thiết bị không hợp lệ. Mỗi ID chỉ dành cho 1 người dùng.'
                        })
                
                # Nếu request_hwid là UNKNOWN, ghi log và báo cho frontend
                if request_hwid == 'UNKNOWN':
                    return jsonify({
                        'hasKey': True,
                        'status': 'hwid_unknown',
                        'key': key_value,
                        'expireTs': expire_ts,
                        'service': key_service,
                        'currentTime': current_time,
                        'message': 'Unknown HWID - Please check client configuration'
                    })
                
                # Nếu key còn hạn và status active
                if expire_ts > current_time and status == 'ACTIVE':
                    # Tạo session token
                    session_token = f"session_{key_value}_{int(time.time())}"
                    
                    return jsonify({
                        'hasKey': True,
                        'status': 'active',
                        'key': key_value,
                        'expireTs': expire_ts,
                        'service': key_service,
                        'sessionToken': session_token,
                        'timeLeft': expire_ts - current_time,
                        'currentTime': current_time,
                        'message': 'Key is valid'
                    })
                # Nếu key đã hết hạn nhưng vẫn tồn tại trong DB
                elif expire_ts <= current_time and status == 'ACTIVE':
                    return jsonify({
                        'hasKey': True,
                        'status': 'expired',
                        'key': key_value,
                        'expireTs': expire_ts,
                        'service': key_service,
                        'currentTime': current_time,
                        'timeExpired': current_time - expire_ts,
                        'message': 'Key has expired - Please contact admin'
                    })

            # Không có key nào hợp lệ
            return jsonify({
                'hasKey': False,
                'status': 'inactive',
                'currentTime': current_time,
                'message': 'No valid keys found'
            })
        else:
            return jsonify({
                'hasKey': False,
                'status': 'no_keys',
                'currentTime': current_time,
                'message': 'No keys found for this service'
            })
            
    except Exception as e:
        log_info(f"Key status check error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'hasKey': False, 'status': 'error', 'error': str(e)})

@app.route('/api/verify-session', methods=['POST'])
def verify_session():
    """Verify session token"""
    try:
        if not key_system:
            return jsonify({'valid': False, 'error': 'Key system not initialized'})
        
        # Lấy user_agent
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # Lấy IP từ X-Forwarded-For hoặc remote_addr
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        data = request.get_json()
        session_token = data.get('sessionToken')
        
        if not session_token:
            return jsonify({'valid': False, 'error': 'Missing session token'})
        
        # Parse session token: session_{key}_{timestamp}
        parts = session_token.split('_')
        if len(parts) < 3 or parts[0] != 'session':
            return jsonify({'valid': False, 'error': 'Invalid session token format'})
        
        key_value = parts[1]
        timestamp = parts[2]
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Log bản tin trinh sát
        log_recon(f"[RECON] | IP: {ip_address} | HWID: {request.headers.get('X-HWID', 'UNKNOWN')} | ACTION: VERIFY_SESSION | URL: {target_url}")
        
        # Kiểm tra key trong database
        query = """
        SELECT key, expire_ts, status, service 
        FROM user_sessions 
        WHERE key = %s
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(query, (key_value,))
        
        if result and len(result) > 0:
            row = result[0]
            db_key = row[0]
            expire_ts = row[1]
            status = row[2]
            service = row[3]
            
            if expire_ts > current_time and status == 'ACTIVE':
                return jsonify({
                    'valid': True,
                    'key': db_key,
                    'expireTs': expire_ts,
                    'service': service,
                    'timeLeft': expire_ts - current_time,
                    'currentTime': current_time,
                    'message': 'Session is valid'
                })
            elif expire_ts <= current_time and status == 'ACTIVE':
                # Key hết hạn nhưng vẫn trả về thông tin
                return jsonify({
                    'valid': True,
                    'key': db_key,
                    'expireTs': expire_ts,
                    'service': service,
                    'timeLeft': 0,
                    'currentTime': current_time,
                    'status': 'expired',
                    'message': 'Key has expired but still exists'
                })
            else:
                return jsonify({
                    'valid': False,
                    'error': 'Key expired or inactive',
                    'currentTime': current_time,
                    'expireTs': expire_ts,
                    'status': status
                })
        else:
            return jsonify({
                'valid': False,
                'error': 'Key not found',
                'currentTime': current_time
            })
            
    except Exception as e:
        log_info(f"Session verification error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'valid': False, 'error': str(e)})

@app.route('/api/get-key', methods=['GET'])
def get_key():
    """Lấy thông tin key theo ID"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        # Lấy user_agent
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # Lấy IP từ X-Forwarded-For hoặc remote_addr
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        key_id = request.args.get('id')
        if not key_id:
            return jsonify({'success': False, 'error': 'Missing key ID'}), 400
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Log bản tin trinh sát
        log_recon(f"[RECON] | IP: {ip_address} | HWID: {request.headers.get('X-HWID', 'UNKNOWN')} | ACTION: GET_KEY | URL: {target_url}")
        
        # Tìm key trong database
        query = """
        SELECT key, expire_ts, status, service, hwid, ip_address, cookies, created_at
        FROM user_sessions 
        WHERE key = %s
        """
        
        result = key_system.execute_query(query, (key_id,))
        
        if result and len(result) > 0:
            row = result[0]
            key_data = {
                'key': row[0],
                'expire_ts': row[1],
                'status': row[2],
                'service': row[3],
                'hwid': row[4],
                'ip_address': row[5],
                'cookies': row[6],
                'created_at': row[7].isoformat() if row[7] else None
            }
            
            log_info(f"✅ Key found: {key_id}")
            return jsonify({
                'success': True,
                'key': key_data
            })
        else:
            log_info(f"❌ Key not found: {key_id}")
            return jsonify({
                'success': False,
                'error': 'Key not found'
            }), 404
            
    except Exception as e:
        log_info(f"Get key error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/check-status', methods=['POST'])
def check_status():
    """Kiểm tra trạng thái processing theo stage và session"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        # Lấy dữ liệu từ request
        data = request.get_json()
        stage = data.get('stage')
        session_id = data.get('sessionId')
        
        if not stage or not session_id:
            return jsonify({'success': False, 'error': 'Missing stage or sessionId'}), 400
        
        # Lấy IP và HWID từ headers
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        hwid = request.headers.get('X-HWID', 'unknown')
        
        log_info(f"🔄 Status check - Stage: {stage}, Session: {session_id[:8]}..., IP: {ip_address}")
        
        # Query database for real session status
        check_query = """
        SELECT id, service, status, process_completed, verification_steps, expire_ts, created_at
        FROM user_sessions 
        WHERE key = %s OR id = %s
        """
        
        result = key_system.execute_query(check_query, (session_id, session_id), fetch_one=True)
        
        if not result:
            log_info(f"❌ Session not found: {session_id[:8]}...")
            return jsonify({
                'success': False,
                'status': 'failed',
                'error': 'Session not found',
                'stage': stage,
                'sessionId': session_id
            }), 404
        
        db_id, service, status, process_completed, verification_steps, expire_ts, created_at = result
        current_time = int(time.time())
        
        # Check if session has expired
        if expire_ts <= current_time:
            log_info(f"❌ Session expired: {session_id[:8]}...")
            return jsonify({
                'success': False,
                'status': 'failed',
                'error': 'Session has expired',
                'stage': stage,
                'sessionId': session_id,
                'expiredAt': expire_ts
            }), 403
        
        # Determine status based on verification steps and process completion
        if process_completed:
            response_status = 'completed'
            message = f'All stages completed successfully for {service}'
        elif verification_steps >= 4:  # Assuming 4 verification steps
            response_status = 'completed'
            message = f'Verification completed for {service}'
        elif verification_steps >= int(stage):
            response_status = 'completed'
            message = f'Stage {stage} completed successfully'
        else:
            response_status = 'processing'
            message = f'Stage {stage} in progress'
        
        response_data = {
            'success': True,
            'status': response_status,
            'message': message,
            'stage': stage,
            'sessionId': session_id,
            'service': service,
            'verificationSteps': verification_steps,
            'processCompleted': process_completed,
            'expireTs': expire_ts,
            'timeLeft': expire_ts - current_time,
            'timestamp': datetime.now().isoformat()
        }
        
        log_info(f"✅ Status check - {response_status}: Stage {stage}, Session: {session_id[:8]}...")
        return jsonify(response_data)
        
    except Exception as e:
        log_info(f"Check status error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False, 
            'status': 'failed',
            'error': str(e)
        }), 500

@app.route('/api/delete-session', methods=['POST'])
def delete_session():
    """Xóa session/key theo ID và HWID"""
    try:
        log_radar(f"[RADAR] DELETE SESSION REQUEST RECEIVED")
        
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        # Lấy user_agent
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # Lấy IP từ X-Forwarded-For hoặc remote_addr
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        data = request.get_json()
        session_id = data.get('sessionId')
        hwid = data.get('hwid')
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Log bản tin trinh sát
        log_recon(f"[RECON] | IP: {ip_address} | HWID: {hwid or 'UNKNOWN'} | ACTION: DELETE_SESSION | URL: {target_url}")
        
        if not session_id:
            return jsonify({'success': False, 'error': 'Missing session ID'}), 400
        
        # Kiểm tra HWID trước khi xóa (security)
        check_query = """
        SELECT hwid, ip_address 
        FROM user_sessions 
        WHERE key = %s
        """
        
        check_result = key_system.execute_query(check_query, (session_id,))
        
        if check_result and len(check_result) > 0:
            stored_hwid = check_result[0][0]
            stored_ip = check_result[0][1]
            
            log_radar(f"[RADAR] Deleting session {session_id}")
            log_radar(f"[RADAR] Stored HWID: {stored_hwid}")
            log_radar(f"[RADAR] Request HWID: {hwid}")
            log_radar(f"[RADAR] Stored IP: {stored_ip}")
            log_radar(f"[RADAR] Request IP: {request.remote_addr}")
            
            # Cho phép xóa nếu HWID khớp hoặc là UNKNOWN (cho trường hợp test)
            if stored_hwid == hwid or hwid == 'UNKNOWN':
                # Xóa session
                delete_query = "DELETE FROM user_sessions WHERE key = %s"
                delete_result = key_system.execute_query(delete_query, (session_id,))
                
                if delete_result is not None:
                    log_radar(f"[RADAR] Session deleted successfully: {session_id}")
                    return jsonify({
                        'success': True,
                        'message': 'Session deleted successfully'
                    })
                else:
                    log_radar(f"[RADAR] Failed to delete session: {session_id}")
                    return jsonify({
                        'success': False,
                        'error': 'Failed to delete session'
                    }), 500
            else:
                log_radar(f"[RADAR] HWID mismatch for session {session_id}")
                return jsonify({
                    'success': False,
                    'error': 'HWID mismatch - unauthorized'
                }), 403
        else:
            log_radar(f"[RADAR] Session not found for deletion: {session_id}")
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
            
    except Exception as e:
        log_info(f"[RADAR] Delete session error: {e}")
        log_info(f"[RADAR] Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/<path:service_path>', methods=['GET'])
def handle_service_redirect(service_path):
    """Handle service redirects with anti-skipping protection - chỉ dùng service name"""
    try:
        # Extract service name from path
        service_name = service_path.split('-')[0] if '-' in service_path else service_path
        
        # Lấy user_agent
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # Lấy IP từ X-Forwarded-For hoặc remote_addr
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        # Lấy HWID từ nhiều nguồn
        hwid = extract_hwid()
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Log bản tin trinh sát cho service access
        log_recon(f"[RECON] | IP: {ip_address} | HWID: {hwid} | ACTION: SERVICE_ACCESS | SERVICE: {service_name} | URL: {target_url} | PATH: /{service_path}")
        
        # ANTI-SKIPPING: Check if this is a direct key access attempt
        if service_path.startswith('key-'):
            # This is a direct key access attempt - validate authorization
            key_id = service_path[4:]  # Remove 'key-' prefix
            return validate_key_access(key_id, service_name, hwid, ip_address, target_url)
        
        # Check if user has valid key for this service
        if not key_system:
            return jsonify({
                'error': 'Service temporarily unavailable',
                'message': 'Please try again later'
            }), 503
        
        # Check key status for this service
        check_query = """
        SELECT key, expire_ts, status, hwid, process_completed, verification_steps
        FROM user_sessions 
        WHERE service = %s AND key LIKE 'KHOA-%%' AND expire_ts > %s
        ORDER BY expire_ts DESC
        LIMIT 1
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(check_query, (service_name, current_time))
        
        if result and len(result) > 0:
            row = result[0]
            key_value = row[0]
            expire_ts = row[1]
            status = row[2]
            db_hwid = row[3]
            process_completed = row[4] if len(row) > 4 else False
            verification_steps = row[5] if len(row) > 5 else 0
            
            # ANTI-SKIPPING: Check if verification process is completed
            if not process_completed:
                log_info(f"🚫 Anti-Skipping: User {hwid} trying to access key without completing verification for service {service_name}")
                return jsonify({
                    'status': 'verification_required',
                    'message': 'Please complete the verification process first',
                    'service': service_name,
                    'currentStep': verification_steps,
                    'requiredSteps': 4  # Total verification steps required
                }), 403
            
            # Check HWID compatibility
            if db_hwid and db_hwid != 'UNKNOWN' and db_hwid != hwid:
                if db_hwid == "AUTO_GENERATED":
                    return jsonify({
                        'status': 'hwid_required',
                        'message': 'HWID verification required',
                        'service': service_name,
                        'key': key_value,
                        'expireTs': expire_ts,
                        'currentTime': current_time
                    }), 200
                else:
                    log_info(f"🚫 Anti-Skipping: HWID mismatch for service {service_name}. DB: {db_hwid}, Request: {hwid}")
                    return jsonify({
                        'status': 'device_mismatch',
                        'message': 'Device not authorized for this service',
                        'service': service_name
                    }), 403
            
            # Valid key found and process completed - create session
            session_token = f"session_{key_value}_{int(time.time())}"
            
            # Redirect to frontend with session info
            frontend_url = f"http://localhost:5173/{service_path}?session={session_token}&service={service_name}"
            
            return redirect(frontend_url)
            
        else:
            # No valid key found - redirect to service selection to start process
            log_info(f"🚫 Anti-Skipping: No valid key found for {service_name}, redirecting to start process")
            return redirect(f"/{service_name}")
            
    except Exception as e:
        log_info(f"Service redirect error for /{service_path}: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Service access failed',
            'message': 'Please try again later'
        }), 500

def validate_key_access(key_id, service_name, hwid, ip_address, target_url):
    """Validate direct key access with anti-skipping protection"""
    try:
        # Check if key exists and belongs to this user
        check_query = """
        SELECT key, expire_ts, status, hwid, process_completed, created_at, session_ip_hwid
        FROM user_sessions 
        WHERE key = %s AND service = %s
        """
        
        result = key_system.execute_query(check_query, (key_id, service_name))
        
        if not result or len(result) == 0:
            log_info(f"🚫 Anti-Skipping: Key {key_id} not found for service {service_name}")
            return jsonify({
                'status': 'key_not_found',
                'message': 'Invalid key or service',
                'action': 'start_process'
            }), 404
        
        row = result[0]
        key_value = row[0]
        expire_ts = row[1]
        status = row[2]
        db_hwid = row[3]
        process_completed = row[4] if len(row) > 4 else False
        created_at = row[5] if len(row) > 5 else None
        db_session_ip_hwid = row[6] if len(row) > 6 else None
        
        # ANTI-SKIPPING: Check if verification process was completed
        if not process_completed:
            log_info(f"🚫 Anti-Skipping: Key {key_id} accessed without completing verification. HWID: {hwid}, Created: {created_at}")
            
            # DELETE the incomplete session to prevent further access
            delete_query = "DELETE FROM user_sessions WHERE key = %s"
            key_system.execute_query(delete_query, (key_id,))
            log_info(f"🗑️ Anti-Skipping: Deleted incomplete session for key {key_id}")
            
            return jsonify({
                'status': 'verification_incomplete',
                'message': 'Please complete the verification process before accessing the key',
                'service': service_name,
                'key': key_id,
                'created_at': created_at,
                'action': 'return_home'
            }), 403
        
        # ANTI-SKIPPING: Check if this IP+HWID has completed process for this service
        current_session_ip_hwid = f"{ip_address}_{hwid}"
        check_completion_query = """
        SELECT COUNT(*) as completed_count
        FROM user_sessions 
        WHERE service = %s AND hwid = %s AND process_completed = TRUE
        """
        
        completion_result = key_system.execute_query(check_completion_query, (service_name, hwid))
        completed_count = completion_result[0][0] if completion_result else 0
        
        if completed_count == 0:
            log_info(f"🚫 Anti-Skipping: User {hwid} trying to access key {key_id} without completing any process for service {service_name}")
            
            # DELETE the key session to prevent further access
            delete_query = "DELETE FROM user_sessions WHERE key = %s"
            key_system.execute_query(delete_query, (key_id,))
            log_info(f"🗑️ Anti-Skipping: Deleted key session {key_id} due to no completed process")
            
            return jsonify({
                'status': 'process_not_completed',
                'message': 'You must complete the verification process first',
                'service': service_name,
                'action': 'return_home'
            }), 403
        
        # ANTI-SKIPPING: Check HWID match
        if db_hwid and db_hwid != 'UNKNOWN' and db_hwid != hwid:
            log_info(f"🚫 Anti-Skipping: HWID mismatch for key {key_id}. DB: {db_hwid}, Request: {hwid}")
            return jsonify({
                'status': 'hwid_mismatch',
                'message': 'This key is tied to a different device',
                'service': service_name,
                'action': 'use_correct_device'
            }), 403
        
        # ANTI-SKIPPING: Check if key is expired
        current_time = int(time.time())
        if expire_ts <= current_time:
            log_info(f"🚫 Anti-Skipping: Expired key {key_id} access attempted. Expired: {expire_ts}, Current: {current_time}")
            return jsonify({
                'status': 'key_expired',
                'message': 'This key has expired',
                'service': service_name,
                'expired_at': expire_ts,
                'current_time': current_time,
                'action': 'create_new_key'
            }), 403
        
        # All checks passed - allow access
        log_info(f"✅ Anti-Skipping: Valid key access approved for {key_id}. HWID: {hwid}, Service: {service_name}")
        return redirect(f"/{service_name}/key-{key_id}")
        
    except Exception as e:
        log_info(f"Key validation error: {e}")
        return jsonify({
            'status': 'validation_error',
            'message': 'Key validation failed',
            'service': service_name
        }), 500

@app.route('/api/start-process', methods=['POST'])
def start_verification_process():
    """Start verification process and lock session to prevent sharing"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        data = request.get_json()
        service_name = data.get('service')
        duration = data.get('duration')
        
        if not service_name or not duration:
            return jsonify({'success': False, 'error': 'Missing service or duration'}), 400
        
        # Lấy user info
        user_agent = request.headers.get('User-Agent', 'Unknown')
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        hwid = extract_hwid()
        
        # Tạo session identifier duy nhất cho tiến trình này
        import hashlib
        import time
        session_seed = f"{service_name}_{duration}_{ip_address}_{hwid}_{int(time.time())}"
        session_hash = hashlib.md5(session_seed.encode()).hexdigest()[:16].upper()
        session_ip_hwid = f"{ip_address}_{hwid}"
        
        # Lưu session với anti-sharing protection
        insert_query = """
        INSERT INTO user_sessions (
            key, service, status, ip_address, expire_ts, hwid, 
            cookies, process_completed, verification_steps, 
            session_ip_hwid, session_locked, created_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
        )
        """
        
        # Tính thời gian hết hạn tạm thời (2 giờ cho process)
        current_time = int(time.time())
        process_expire_ts = current_time + (2 * 60 * 60)  # 2 hours
        
        params = (
            f"PROCESS_{session_hash}",  # Temporary process key
            service_name,
            'PROCESSING',
            ip_address,
            process_expire_ts,
            hwid,
            json.dumps({
                'process_start': current_time,
                'service': service_name,
                'duration': duration,
                'user_agent': user_agent
            }),
            0,  # verification_steps
            False,  # process_completed
            session_ip_hwid,
            True,  # session_locked
        )
        
        result = key_system.execute_query(insert_query, params)
        
        if result:
            process_id = f"PROCESS_{session_hash}"
            log_info(f"🔒 Anti-Sharing: Started verification process for {service_name}. Session ID: {process_id}, IP+HWID: {session_ip_hwid}")
            
            return jsonify({
                'success': True,
                'processId': process_id,
                'service': service_name,
                'duration': duration,
                'expireTs': process_expire_ts,
                'message': 'Verification process started successfully'
            })
        else:
            log_info(f"❌ Failed to start verification process for {service_name}")
            return jsonify({'success': False, 'error': 'Failed to start process'}), 500
            
    except Exception as e:
        log_info(f"Start process error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/complete-process', methods=['POST'])
def complete_verification_process():
    """Complete verification process and generate final key"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        data = request.get_json()
        service_name = data.get('service')
        duration = data.get('duration')
        process_id = data.get('processId')
        
        if not all([service_name, duration, process_id]):
            return jsonify({'success': False, 'error': 'Missing required parameters'}), 400
        
        # Lấy user info
        user_agent = request.headers.get('User-Agent', 'Unknown')
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        hwid = extract_hwid()
        session_ip_hwid = f"{ip_address}_{hwid}"
        
        # Kiểm tra session có tồn tại và không bị lock
        check_query = """
        SELECT id, key, hwid, ip_address, session_ip_hwid, session_locked, verification_steps
        FROM user_sessions 
        WHERE key = %s AND service = %s AND status = 'PROCESSING'
        """
        
        result = key_system.execute_query(check_query, (process_id, service_name))
        
        if not result or len(result) == 0:
            log_info(f"🚫 Anti-Sharing: Process {process_id} not found or invalid for service {service_name}")
            return jsonify({'success': False, 'error': 'Invalid process session'}), 404
        
        row = result[0]
        db_id = row[0]
        db_key = row[1]
        db_hwid = row[2]
        db_ip = row[3]
        db_session_ip_hwid = row[4]
        session_locked = row[5]
        verification_steps = row[6] if len(row) > 6 else 0
        
        # ANTI-SHARING: Kiểm tra IP+HWID khớp
        if db_session_ip_hwid != session_ip_hwid:
            log_info(f"🚫 Anti-Sharing: Process {process_id} access denied. DB IP+HWID: {db_session_ip_hwid}, Request: {session_ip_hwid}")
            
            # Xóa session này và tất cả sessions của IP+HWID này
            delete_sessions_query = """
            DELETE FROM user_sessions 
            WHERE session_ip_hwid = %s OR (ip_address = %s AND hwid = %s)
            """
            
            key_system.execute_query(delete_sessions_query, (db_session_ip_hwid, ip_address, hwid))
            
            return jsonify({
                'success': False,
                'error': 'Phát hiện nhảy cóc hoặc thay đổi thiết bị/mạng. Tiến trình đã bị hủy.',
                'code': 'SESSION_SHARING_DETECTED',
                'action': 'redirect_home'
            }), 403
        
        # ANTI-SHARING: Kiểm tra session bị lock
        if session_locked:
            log_info(f"🚫 Anti-Sharing: Process {process_id} is locked. Current HWID: {hwid}")
            return jsonify({
                'success': False,
                'error': 'This session is locked. Please start a new process.',
                'code': 'SESSION_LOCKED'
            }), 403
        
        # Cập nhật session thành completed
        update_query = """
        UPDATE user_sessions 
        SET process_completed = TRUE, verification_steps = 4, status = 'COMPLETED',
        updated_at = NOW()
        WHERE id = %s
        """
        
        key_system.execute_query(update_query, (db_id,))
        
        log_info(f"✅ Anti-Sharing: Process {process_id} completed successfully for {service_name}. HWID: {hwid}")
        
        return jsonify({
            'success': True,
            'processId': process_id,
            'service': service_name,
            'duration': duration,
            'message': 'Verification process completed. You can now get your key.'
        })
        
    except Exception as e:
        log_info(f"Complete process error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generate-key', methods=['POST'])
def generate_final_key():
    """Generate final key after process completion"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        data = request.get_json()
        service_name = data.get('service')
        duration = data.get('duration')
        
        if not service_name or not duration:
            return jsonify({'success': False, 'error': 'Missing service or duration'}), 400
        
        # Lấy user info
        user_agent = request.headers.get('User-Agent', 'Unknown')
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        hwid = extract_hwid()
        session_ip_hwid = f"{ip_address}_{hwid}"
        
        # Kiểm tra process đã hoàn thành
        check_query = """
        SELECT id, session_ip_hwid, process_completed, verification_steps
        FROM user_sessions 
        WHERE service = %s AND status = 'COMPLETED' AND hwid = %s
        ORDER BY created_at DESC
        LIMIT 1
        """
        
        result = key_system.execute_query(check_query, (service_name, hwid))
        
        if not result or len(result) == 0:
            log_info(f"🚫 Anti-Sharing: No completed process found for {service_name}, HWID: {hwid}")
            return jsonify({'success': False, 'error': 'No completed verification process found'}), 404
        
        row = result[0]
        db_id = row[0]
        db_session_ip_hwid = row[1]
        process_completed = row[2]
        verification_steps = row[3] if len(row) > 3 else 0
        
        # ANTI-SHARING: Kiểm tra IP+HWID khớp
        if db_session_ip_hwid != session_ip_hwid:
            log_info(f"🚫 Anti-Sharing: Key generation denied for {service_name}. DB IP+HWID: {db_session_ip_hwid}, Request: {session_ip_hwid}")
            
            # Xóa tất cả sessions của IP+HWID này
            delete_sessions_query = """
            DELETE FROM user_sessions 
            WHERE session_ip_hwid = %s OR (ip_address = %s AND hwid = %s)
            """
            
            key_system.execute_query(delete_sessions_query, (db_session_ip_hwid, ip_address, hwid))
            
            return jsonify({
                'success': False,
                'error': 'Phát hiện nhảy cóc hoặc thay đổi thiết bị/mạng. Tiến trình đã bị hủy.',
                'code': 'SESSION_SHARING_DETECTED',
                'action': 'redirect_home'
            }), 403
        
        if not process_completed:
            log_info(f"🚫 Anti-Sharing: Process not completed for {service_name}, HWID: {hwid}")
            return jsonify({'success': False, 'error': 'Verification process not completed'}), 403
        
        # Tạo key cuối cùng
        import random
        import string
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
        final_key = f"KHOA-{random_part}"
        
        # Tính thời gian hết hạn theo duration
        current_time = int(time.time())
        if duration == '2h':
            expire_ts = current_time + (2 * 60 * 60)
        elif duration == '24h':
            expire_ts = current_time + (24 * 60 * 60)
        elif duration == '7d':
            expire_ts = current_time + (7 * 24 * 60 * 60)
        else:
            expire_ts = current_time + (24 * 60 * 60)  # Default 24h
        
        # Cập nhật session với key cuối cùng
        update_query = """
        UPDATE user_sessions 
        SET key = %s, status = 'ACTIVE', expire_ts = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        key_system.execute_query(update_query, (final_key, expire_ts, db_id))
        
        log_info(f"✅ Anti-Sharing: Final key generated for {service_name}. Key: {final_key}, HWID: {hwid}")
        
        return jsonify({
            'success': True,
            'keyId': final_key,
            'key': final_key,
            'service': service_name,
            'duration': duration,
            'expireTs': expire_ts,
            'message': 'Key generated successfully'
        })
        
    except Exception as e:
        log_info(f"Generate key error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/track-service-access', methods=['POST'])
def track_service_access():
    """Track service access when frontend loads"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        # Lấy user_agent
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # Lấy IP từ X-Forwarded-For hoặc remote_addr
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        # Lấy HWID từ nhiều nguồn
        hwid = extract_hwid()
        
        data = request.get_json()
        service_name = data.get('service')
        path = data.get('path')
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Log bản tin trinh sát
        log_recon(f"[RECON] | IP: {ip_address} | HWID: {hwid} | ACTION: FRONTEND_LOADED | SERVICE: {service_name} | URL: {target_url} | PATH: {path}")
        
        return jsonify({
            'success': True,
            'message': 'Service access tracked',
            'service': service_name,
            'hwid': hwid
        })
        
    except Exception as e:
        log_info(f"Track service access error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/check-session-mark', methods=['POST'])
def check_session_mark():
    """Check session validity cho TimeSelectionPage - chỉ dùng IP + HWID"""
    try:
        if not key_system:
            return jsonify({'success': False, 'message': 'Key system not initialized'}), 500
        
        data = request.get_json()
        service_id = data.get('serviceId')
        
        if not service_id:
            return jsonify({'success': False, 'message': 'Missing service ID'}), 400
        
        # Lấy IP và HWID
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        hwid = extract_hwid()
        session_ip_hwid = f"{ip_address}_{hwid}"
        
        check_query = """
        SELECT service, status, expire_ts FROM user_sessions 
        WHERE session_ip_hwid = %s AND service = %s AND expire_ts > %s
        ORDER BY created_at DESC LIMIT 1
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(check_query, (session_ip_hwid, service_id, current_time))
        
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
        log_info(f"Session check error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/anti-cheat-check', methods=['POST'])
def anti_cheat_check():
    """Anti-cheat time validation"""
    try:
        data = request.get_json()
        client_time = data.get('client_time', int(time.time()))
        key = data.get('key', 'demo-key')
        
        server_time = int(time.time() * 1000)  # milliseconds like JavaScript
        
        # Skip anti-cheat in development
        if 'localhost' in request.headers.get('Host', '') or '127.0.0.1' in request.headers.get('Host', ''):
            return jsonify({
                'success': True,
                'server_time': server_time,
                'message': 'Development mode - anti-cheat disabled'
            })
        
        # Calculate time drift (allow 5 minutes tolerance)
        time_drift = abs(client_time - server_time)
        
        if time_drift > 300000:  # 5 minutes in milliseconds
            return jsonify({
                'success': False,
                'message': 'ANTI_CHEAT_DETECTED',
                'server_time': server_time,
                'drift': time_drift
            })
        
        return jsonify({
            'success': True,
            'server_time': server_time,
            'drift': time_drift
        })
        
    except Exception as e:
        log_info(f"Anti-cheat check error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    """Trang chủ - trả về trạng thái hệ thống"""
    try:
        return jsonify({
            'status': 'running',
            'service': 'Backend Web Key API',
            'version': '1.0.0',
            'database': 'connected' if key_system and key_system.conn else 'disconnected',
            'endpoints': [
                '/api/health',
                '/api/test-db',
                '/api/mark-session',
                '/api/check-key-status',
                '/api/check-session-mark',
                '/api/anti-cheat-check'
            ],
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/validate-key', methods=['POST'])
def validate_key():
    """Validate key for Roblox script - checks user_sessions table"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        data = request.get_json()
        key_value = data.get('key')
        hwid = data.get('hwid')
        
        if not key_value or not hwid:
            return jsonify({'success': False, 'error': 'Missing key or hwid'}), 400
        
        # Get IP from request
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        log_info(f"🔑 Roblox Key Validation - Key: {key_value[:8]}..., HWID: {hwid[:16]}..., IP: {ip_address}")
        
        # Check if key exists in user_sessions table
        check_query = """
        SELECT id, service, status, ip_address, hwid, expire_ts, process_completed
        FROM user_sessions 
        WHERE key = %s AND status = 'ACTIVE' AND expire_ts > %s
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(check_query, (key_value, current_time), fetch_one=True)
        
        if not result:
            log_info(f"❌ Roblox Key Validation Failed - Key not found or expired: {key_value[:8]}...")
            return jsonify({
                'success': False,
                'error': 'Key không hợp lệ hoặc đã hết hạn',
                'code': 'KEY_INVALID'
            }), 403
        
        session_id, service, status, stored_ip, stored_hwid, expire_ts, process_completed = result
        
        # Check HWID match
        if stored_hwid != hwid:
            log_info(f"❌ Roblox HWID Mismatch - Expected: {stored_hwid[:16]}..., Got: {hwid[:16]}...")
            return jsonify({
                'success': False,
                'error': 'HWID không khớp',
                'code': 'HWID_MISMATCH'
            }), 403
        
        log_info(f"✅ Roblox Key Validation Success - Key: {key_value[:8]}..., Service: {service}")
        return jsonify({
            'success': True,
            'service': service,
            'expireTs': expire_ts,
            'message': 'Key hợp lệ'
        })
        
    except Exception as e:
        log_info(f"Roblox validate key error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/heartbeat', methods=['POST'])
def heartbeat():
    """Heartbeat endpoint for Roblox script to maintain session"""
    try:
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        data = request.get_json()
        key_value = data.get('key')
        hwid = data.get('hwid')
        
        if not key_value or not hwid:
            return jsonify({'success': False, 'error': 'Missing key or hwid'}), 400
        
        # Get IP from request
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        log_info(f"💓 Roblox Heartbeat - Key: {key_value[:8]}..., HWID: {hwid[:16]}...")
        
        # Check if session exists and is active
        check_query = """
        SELECT id, service, status, expire_ts, last_heartbeat
        FROM user_sessions 
        WHERE key = %s AND status = 'ACTIVE' AND expire_ts > %s
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(check_query, (key_value, current_time), fetch_one=True)
        
        if not result:
            return jsonify({
                'success': False,
                'error': 'Session không tồn tại hoặc đã hết hạn',
                'code': 'SESSION_EXPIRED'
            }), 403
        
        session_id, service, status, expire_ts, last_heartbeat = result
        
        # Update last heartbeat
        update_query = """
        UPDATE user_sessions 
        SET last_heartbeat = %s 
        WHERE id = %s
        """
        
        key_system.execute_query(update_query, (current_time, session_id))
        
        log_info(f"💓 Roblox Heartbeat Updated - Key: {key_value[:8]}..., Service: {service}")
        return jsonify({
            'success': True,
            'service': service,
            'expireTs': expire_ts,
            'timestamp': current_time,
            'message': 'Heartbeat received'
        })
        
    except Exception as e:
        log_info(f"Roblox heartbeat error: {e}")
        log_info(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': int(time.time()),
        'database': 'connected' if key_system and key_system.conn else 'disconnected'
    })

@app.route('/api/routes', methods=['GET'])
def list_routes():
    """List all available routes"""
    routes = [
        '/api/health',
        '/api/test-db',
        '/api/get-key',
        '/api/delete-session',
        '/api/check-key-status',
        '/api/verify-session',
        '/api/mark-session',
        '/api/check-session-mark',
        '/api/check-service-keys',
        '/api/anti-cheat-check',
        '/api/validate-key',
        '/api/heartbeat'
    ]
    return jsonify({
        'routes': routes,
        'count': len(routes)
    })

# PythonAnywhere compatible - chỉ chạy app.run() khi local
if __name__ == '__main__':
    logging.info("🚀 Starting Flask Application...")
    logging.info(f"📊 DATABASE_URL configured: {'Yes' if os.environ.get('DATABASE_URL') else 'No'}")
    
    if key_system and key_system.conn:
        logging.info("✅ Database test passed - Ready to serve!")
    else:
        logging.info("❌ Database test failed - Check configuration")
    
    app.run(host='0.0.0.0', port=7860, debug=False)

# Force rebuild comment - Line added for Hugging Face rebuild
