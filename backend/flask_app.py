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
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

# Cấu hình logging để ghi ra console (sys.stdout)
logging.basicConfig(
    level=logging.DEBUG,
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
         'https://khoablabla-backend.hf.space',
         'https://khoablabla.netlify.app',
         r'^https://[a-zA-Z0-9-]+\.netlify\.app$'  # Regex cho tất cả netlify subdomains
     ],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

def log_error(error_message):
    """Ghi lỗi ra console"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {error_message}")
    logging.error(error_message)

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
            
            # Chuyển postgres:// thành postgresql:// cho psycopg2
            if db_url.startswith('postgres://'):
                db_url = db_url.replace('postgres://', 'postgresql://', 1)
                log_error(f"Converted postgres:// to postgresql:// for psycopg2 compatibility")
            
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
            # Kiểm tra kết nối database
            if not self.conn or (hasattr(self.conn, 'closed') and self.conn.closed != 0):
                log_error(f"🔄 Database connection lost, attempting to reconnect...")
                if not self.connect_db():
                    log_error(f"❌ Failed to reconnect to database")
                    return None
            
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
                    
        except psycopg2.InterfaceError as e:
            log_error(f"🔄 InterfaceError detected: {e}")
            log_error(f"🔄 Attempting to reconnect...")
            self.conn = None
            if self.connect_db():
                log_error(f"✅ Reconnected successfully, retrying query...")
                return self.execute_query(query, params)  # Retry query after reconnection
            else:
                log_error(f"❌ Failed to reconnect after InterfaceError")
                return None
        except Exception as e:
            log_error(f"❌ Query error: {e}")
            log_error(f"Query: {query[:100]}...")
            log_error(f"Traceback: {traceback.format_exc()}")
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
            log_error(f"✅ Auto-generated key: {created_key} for service: {service}")
            return created_key
        else:
            log_error(f"❌ Failed to auto-generate key for service: {service}")
            return None
            
    except Exception as e:
        log_error(f"❌ Auto-generate key error: {e}")
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
            log_error(f"[RADAR] {method} | {path} | HWID: {hwid} | IP: {ip}")
            
            # Nếu nhận được HWID thì lưu ngay vào Database Neon
            if hwid and hwid != 'UNKNOWN':
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
                    log_error(f"[RADAR] ✅ Updated HWID for pending sessions: {hwid}")
                except Exception as e:
                    log_error(f"[RADAR] ❌ Failed to update HWID: {e}")
    except Exception as e:
        log_error(f"[RADAR] Logging error: {e}")

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
        log_error(f"Service keys check error: {e}")
        return jsonify({'hasKey': False, 'count': 0, 'nextExpiry': None})

@app.route('/api/mark-session', methods=['POST'])
def mark_session():
    """Mark session trước khi chuyển trang"""
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
        random_id = data.get('randomId')
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Log bản tin trinh sát
        log_error(f"[RECON] | IP: {ip_address} | HWID: {data.get('hwid', 'UNKNOWN')} | ACTION: MARK_SESSION | SERVICE: {service_id} | URL: {target_url}")
        
        # Validate data
        if not service_id or not random_id:
            return jsonify({'success': False, 'error': 'Missing service or random ID'}), 400
        
        # Kiểm tra xem key có tồn tại không - chỉ dùng cột hiện có trong DB
        check_query = """
        SELECT key, expire_ts, status, service 
        FROM user_sessions 
        WHERE key = %s AND service = %s
        """
        
        result = key_system.execute_query(check_query, (service_id + '-' + random_id, service_id))
        
        # Insert session marking
        try:
            insert_query = """
            INSERT INTO user_sessions (key, service, status, ip_address, expire_ts, hwid, cookies)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, expire_ts
            """
            
            session_expire_ts = int(time.time()) + 1800  # 30 minutes
            
            params = (
                service_id + '-' + random_id,
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
                
                # Log bản tin trinh sát khi thành công
                log_error(f"[RECON] | IP: {ip_address} | ACTION: MARKED_SUCCESS | TOKEN: {session_id} | TARGET_URL: {target_url}")
                
                return jsonify({
                    'success': True,
                    'sessionId': session_id,
                    'randomId': random_id,
                    'serviceId': service_id,
                    'expireTs': expire_ts,
                    'message': 'Session marked successfully'
                })
            else:
                return jsonify({'success': False, 'error': 'Failed to mark session - database returned none'}), 500
                
        except Exception as db_error:
            log_error(f"Database insert error: {db_error}")
            return jsonify({'success': False, 'error': 'Database insert failed'}), 500
            
    except ValueError as ve:
        log_error(f"Value error in mark_session: {ve}")
        return jsonify({'success': False, 'error': f'Invalid data format: {str(ve)}'}), 400
    except json.JSONDecodeError as je:
        log_error(f"JSON decode error in mark_session: {je}")
        return jsonify({'success': False, 'error': 'Invalid JSON format'}), 400
    except Exception as e:
        log_error(f"Unexpected error in mark_session: {e}")
        log_error(f"Traceback: {traceback.format_exc()}")
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
        request_hwid = request.headers.get('X-HWID', 'UNKNOWN')
        
        # Lấy URL từ request.referrer hoặc origin
        target_url = request.referrer or request.headers.get('Origin') or 'DIRECT_ACCESS'
        
        # Log bản tin trinh sát
        log_error(f"[RECON] | IP: {ip_address} | HWID: {request_hwid} | ACTION: CHECK_KEY | SERVICE: {service} | URL: {target_url}")
        
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
        log_error(f"Key status check error: {e}")
        log_error(f"Traceback: {traceback.format_exc()}")
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
        log_error(f"[RECON] | IP: {ip_address} | HWID: {request.headers.get('X-HWID', 'UNKNOWN')} | ACTION: VERIFY_SESSION | URL: {target_url}")
        
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
        log_error(f"Session verification error: {e}")
        log_error(f"Traceback: {traceback.format_exc()}")
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
        log_error(f"[RECON] | IP: {ip_address} | HWID: {request.headers.get('X-HWID', 'UNKNOWN')} | ACTION: GET_KEY | URL: {target_url}")
        
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
            
            log_error(f"✅ Key found: {key_id}")
            return jsonify({
                'success': True,
                'key': key_data
            })
        else:
            log_error(f"❌ Key not found: {key_id}")
            return jsonify({
                'success': False,
                'error': 'Key not found'
            }), 404
            
    except Exception as e:
        log_error(f"Get key error: {e}")
        log_error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500
def delete_session():
    """Xóa session/key theo ID và HWID"""
    try:
        log_error(f"[RADAR] DELETE SESSION REQUEST RECEIVED")
        
        if not key_system:
            return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
        
        data = request.get_json()
        session_id = data.get('sessionId')
        hwid = data.get('hwid')
        
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
            
            log_error(f"[RADAR] Deleting session {session_id}")
            log_error(f"[RADAR] Stored HWID: {stored_hwid}")
            log_error(f"[RADAR] Request HWID: {hwid}")
            log_error(f"[RADAR] Stored IP: {stored_ip}")
            log_error(f"[RADAR] Request IP: {request.remote_addr}")
            
            # Cho phép xóa nếu HWID khớp hoặc là UNKNOWN (cho trường hợp test)
            if stored_hwid == hwid or hwid == 'UNKNOWN':
                # Xóa session
                delete_query = "DELETE FROM user_sessions WHERE key = %s"
                delete_result = key_system.execute_query(delete_query, (session_id,))
                
                if delete_result is not None:
                    log_error(f"[RADAR] Session deleted successfully: {session_id}")
                    return jsonify({
                        'success': True,
                        'message': 'Session deleted successfully'
                    })
                else:
                    log_error(f"[RADAR] Failed to delete session: {session_id}")
                    return jsonify({
                        'success': False,
                        'error': 'Failed to delete session'
                    }), 500
            else:
                log_error(f"[RADAR] HWID mismatch for session {session_id}")
                return jsonify({
                    'success': False,
                    'error': 'HWID mismatch - unauthorized'
                }), 403
        else:
            log_error(f"[RADAR] Session not found for deletion: {session_id}")
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
            
    except Exception as e:
        log_error(f"[RADAR] Delete session error: {e}")
        log_error(f"[RADAR] Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

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
        log_error(f"Anti-cheat check error: {e}")
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
        '/api/anti-cheat-check'
    ]
    return jsonify({
        'routes': routes,
        'count': len(routes)
    })

# PythonAnywhere compatible - chỉ chạy app.run() khi local
if __name__ == '__main__':
    log_error("🚀 Starting Flask Application...")
    log_error(f"📊 DATABASE_URL configured: {'Yes' if os.environ.get('DATABASE_URL') else 'No'}")
    
    if key_system and key_system.conn:
        log_error("✅ Database test passed - Ready to serve!")
    else:
        log_error("❌ Database test failed - Check configuration")
    
    app.run(host='0.0.0.0', port=7860, debug=False)

# Force rebuild comment - Line added for Hugging Face rebuild
