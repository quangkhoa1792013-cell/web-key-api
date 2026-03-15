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

# Neon Database connection
NEON_DB_URL = os.environ.get('DATABASE_URL', 
    'postgresql://neondb_owner:npg_yXhAo4sZaKb5@ep-patient-pond-a1virzy2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')

class NeonKeySystem:
    def __init__(self):
        self.conn = None
        self.connect_db()
    
    def connect_db(self):
        try:
            self.conn = psycopg2.connect(NEON_DB_URL)
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

# Initialize key system
key_system = NeonKeySystem()

# API Routes for Dynamic Signature System

@app.route('/api/create-session', methods=['POST'])
def create_session():
    """Create new session with timestamp signature"""
    try:
        data = request.get_json()
        service = data.get('service', 'lootlab')
        
        # Generate random session ID
        random_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        
        # Insert session into database
        query = """
        INSERT INTO user_sessions (key, service, expire_ts, hwid)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """
        
        # Session expires in 24 hours (86400 seconds)
        session_expire_ts = int(time.time()) + 86400
        session_key = f"session_{service}_{random_id}"
        
        params = (session_key, service, session_expire_ts, 'NOT_LINKED')
        result = key_system.execute_query(query, params)
        
        if result:
            return jsonify({
                'success': True,
                'serviceId': service,
                'randomId': random_id,
                'sessionKey': session_key,
                'expireTs': session_expire_ts
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to create session'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/check-session', methods=['POST'])
def check_session():
    """Check if session is valid"""
    try:
        data = request.get_json()
        service_id = data.get('serviceId')
        random_id = data.get('randomId')
        
        session_key = f"session_{service_id}_{random_id}"
        
        query = """
        SELECT service, expire_ts FROM user_sessions 
        WHERE key = %s AND expire_ts > %s
        """
        
        current_time = int(time.time())
        params = (session_key, current_time)
        
        result = key_system.execute_query(query, params)
        
        if result:
            row = result[0]
            return jsonify({
                'success': True,
                'session': {
                    'service': row[0],
                    'expireTs': row[1],
                    'timeLeft': row[1] - current_time
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Session not found or expired'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/update-session-time', methods=['POST'])
def update_session_time():
    """Update session with time signature"""
    try:
        data = request.get_json()
        service_id = data.get('serviceId')
        random_id = data.get('randomId')
        duration_hours = data.get('durationHours')
        required_links = data.get('requiredLinks')
        
        session_key = f"session_{service_id}_{random_id}"
        
        # Update session with time signature
        query = """
        UPDATE user_sessions 
        SET service = service || '_' || %s,
            expire_ts = %s,
            updated_at = NOW()
        WHERE key = %s
        RETURNING expire_ts
        """
        
        # Calculate new expiration time
        new_expire_ts = int(time.time()) + (duration_hours * 3600)
        time_signature = f"{duration_hours}h"
        
        params = (time_signature, new_expire_ts, session_key)
        result = key_system.execute_query(query, params)
        
        if result:
            return jsonify({
                'success': True,
                'expireTs': result[0][0],
                'timeSignature': time_signature,
                'durationHours': duration_hours,
                'requiredLinks': required_links
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to update session'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/finalize-key', methods=['POST'])
def finalize_key():
    """Forge new key from session - THE KEY FORGING PROCESS"""
    try:
        data = request.get_json()
        service_id = data.get('serviceId')
        random_id = data.get('randomId')
        service_key = data.get('serviceKey')  # The key from URL query param
        ip = data.get('ip')
        user_agent = data.get('userAgent')
        
        session_key = f"session_{service_id}_{random_id}"
        
        # Get session info
        query = """
        SELECT service, expire_ts FROM user_sessions 
        WHERE key = %s
        """
        
        result = key_system.execute_query(query, (session_key,))
        
        if not result:
            return jsonify({'success': False, 'message': 'Session not found'}), 404
        
        session_info = result[0]
        service_with_time = session_info[0]
        session_expire_ts = session_info[1]
        
        # Extract duration from service (e.g., "lootlab_2h" -> 2)
        duration_hours = 2  # Default
        if '_' in service_with_time:
            time_part = service_with_time.split('_')[-1]
            if time_part.endswith('h'):
                duration_hours = int(time_part[:-1])
        
        # FORGE THE ACTUAL KEY
        chars = string.ascii_letters + string.digits
        random_part = ''.join(secrets.choice(chars) for _ in range(25))
        forged_key = f"KHOA-{duration_hours}-{random_part}"
        
        # Calculate key expiration
        key_expire_ts = int(time.time()) + (duration_hours * 3600)
        
        # Insert the forged key into database
        insert_query = """
        INSERT INTO user_sessions (key, service, expire_ts, hwid, ip_address, cookies)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """
        
        params = (forged_key, service_id, key_expire_ts, 'FORGED', ip, json.dumps({'ua': user_agent}))
        insert_result = key_system.execute_query(insert_query, params)
        
        if insert_result:
            # Delete the session to prevent reuse
            delete_query = "DELETE FROM user_sessions WHERE key = %s"
            key_system.execute_query(delete_query, (session_key,))
            
            return jsonify({
                'success': True,
                'key': forged_key,
                'duration': duration_hours * 3600,
                'expireTs': key_expire_ts,
                'service': service_id
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to forge key'}), 500
            
    except Exception as e:
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
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/validate-key', methods=['POST'])
def validate_key():
    """Validate key for script usage"""
    try:
        data = request.get_json()
        key = data.get('key')
        hwid = data.get('hwid')
        
        # Check if key exists and is valid
        query = """
        SELECT expire_ts, hwid, ip_address FROM user_sessions 
        WHERE key = %s AND expire_ts > %s
        FOR UPDATE
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(query, (key, current_time))
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'KEY_NOT_FOUND_OR_EXPIRED'
            })
        
        stored_expire_ts, stored_hwid, stored_ip = result[0]
        
        # Check HWID binding
        if stored_hwid and stored_hwid != 'FORGED' and stored_hwid != 'NOT_LINKED' and hwid and stored_hwid != hwid:
            return jsonify({
                'success': False,
                'message': 'HWID_MISMATCH'
            })
        
        # Update HWID if not bound
        if stored_hwid == 'FORGED' or stored_hwid == 'NOT_LINKED':
            update_query = """
            UPDATE user_sessions 
            SET hwid = %s, updated_at = NOW()
            WHERE key = %s
            """
            key_system.execute_query(update_query, (hwid, key))
        
        time_left = stored_expire_ts - current_time
        
        return jsonify({
            'success': True,
            'message': 'KEY_VALID',
            'expireTs': stored_expire_ts,
            'timeLeft': time_left
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/heartbeat', methods=['POST'])
def heartbeat():
    """Script heartbeat endpoint"""
    try:
        data = request.get_json()
        key = data.get('key')
        hwid = data.get('hwid')
        
        # Similar to validate but for heartbeat
        query = """
        SELECT expire_ts, hwid FROM user_sessions 
        WHERE key = %s AND expire_ts > %s
        """
        
        current_time = int(time.time())
        result = key_system.execute_query(query, (key, current_time))
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'KEY_EXPIRED'
            })
        
        stored_expire_ts, stored_hwid = result[0]
        
        if stored_hwid != hwid:
            return jsonify({
                'success': False,
                'message': 'HWID_MISMATCH'
            })
        
        return jsonify({
            'success': True,
            'message': 'HEARTBEAT_OK',
            'expireTs': stored_expire_ts,
            'timeLeft': stored_expire_ts - current_time
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cleanup', methods=['POST'])
def cleanup_expired():
    """Clean up expired keys"""
    try:
        query = "DELETE FROM user_sessions WHERE expire_ts <= %s"
        current_time = int(time.time())
        result = key_system.execute_query(query, (current_time,))
        
        deleted_count = result if result else 0
        
        return jsonify({
            'success': True,
            'deletedCount': deleted_count,
            'message': f'Cleaned up {deleted_count} expired keys'
        })
    except Exception as e:
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
    # Periodic cleanup every hour
    def periodic_cleanup():
        while True:
            try:
                cleanup_query = "DELETE FROM user_sessions WHERE expire_ts <= %s"
                current_time = int(time.time())
                key_system.execute_query(cleanup_query, (current_time,))
                print("[NeonKeySystem] Periodic cleanup completed")
            except Exception as e:
                print(f"[NeonKeySystem] Cleanup error: {e}")
            time.sleep(3600)  # 1 hour
    
    import threading
    cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
    cleanup_thread.start()
    
    print("[NeonKeySystem] Starting Dynamic Signature System...")
    app.run(host='0.0.0.0', port=5000, debug=True)
