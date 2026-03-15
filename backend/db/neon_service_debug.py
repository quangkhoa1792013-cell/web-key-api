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

app = Flask(__name__)
CORS(app)

# Neon Database connection with proper SSL configuration
NEON_DB_URL = os.environ.get('DATABASE_URL', 
    'postgresql://neondb_owner:npg_yXhAo4sZaKb5@ep-patient-pond-a1virzy2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')

class NeonKeySystem:
    def __init__(self):
        self.conn = None
        self.connect_db()
    
    def connect_db(self):
        try:
            # Parse DATABASE_URL and ensure SSL mode
            db_url = NEON_DB_URL
            
            # Add sslmode if not present
            if 'sslmode=' not in db_url:
                if '?' in db_url:
                    db_url += '&sslmode=require'
                else:
                    db_url += '?sslmode=require'
            
            print(f"[NeonKeySystem] Connecting to: {db_url.split('@')[1] if '@' in db_url else 'hidden'}")
            
            self.conn = psycopg2.connect(db_url)
            self.conn.autocommit = True
            print("[NeonKeySystem] ✅ Connected to Neon Database with SSL")
        except Exception as e:
            print(f"[NeonKeySystem] ❌ Database connection error: {e}")
            print(f"[NeonKeySystem] Error type: {type(e).__name__}")
            self.conn = None
    
    def execute_query(self, query, params=None):
        if not self.conn:
            self.connect_db()
        
        if not self.conn:
            print("[NeonKeySystem] ❌ No database connection")
            return None
        
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
            print(f"[NeonKeySystem] ❌ Query error: {e}")
            print(f"[NeonKeySystem] Query: {query[:100]}...")
            return None

# Initialize key system
key_system = NeonKeySystem()

# Test database connection on startup
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
            
            print(f"[SessionMarking] ✅ Session marked: {service_id}-{random_id} (ID: {session_id})")
            
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
        print(f"[SessionMarking] ❌ Error: {e}")
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
        print(f"[CheckSessionMark] ❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

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
    print("[NeonKeySystem] 🚀 Starting Enhanced Session Marking System...")
    print(f"[NeonKeySystem] 📊 DATABASE_URL configured: {'Yes' if NEON_DB_URL else 'No'}")
    
    # Test database on startup
    test_result = key_system.execute_query("SELECT 1")
    if test_result:
        print("[NeonKeySystem] ✅ Database test passed")
    else:
        print("[NeonKeySystem] ❌ Database test failed")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
