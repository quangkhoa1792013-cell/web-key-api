import psycopg2
import os
import json
import time
import secrets
import string
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Neon Database connection
NEON_DB_URL = os.environ.get('NEON_DATABASE_URL', 
    'postgresql://neondb_owner:npg_yXhAo4sZaKb5@ep-patient-pond-a1virzy2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')

class NeonKeySystem:
    def __init__(self):
        self.conn = None
        self.connect_db()
    
    def connect_db(self):
        try:
            self.conn = psycopg2.connect(NEON_DB_URL)
            self.conn.autocommit = True
            print("Connected to Neon Database")
        except Exception as e:
            print(f"Database connection error: {e}")
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
            print(f"Query error: {e}")
            return None
    
    def create_key(self, service, duration_hours, hwid=None, ip_address=None, cookies=None):
        """Create new key in Neon database"""
        query = """
        SELECT * FROM create_new_key(%s, %s, %s, %s, %s)
        """
        params = (service, duration_hours, hwid, ip_address, cookies)
        
        result = self.execute_query(query, params)
        
        if result and len(result) > 0:
            row = result[0]
            return {
                'success': row[0],
                'key': row[1],
                'expire_ts': row[2],
                'message': row[3]
            }
        return {'success': False, 'message': 'Database error'}
    
    def validate_and_bind_key(self, key, hwid, ip_address=None, cookies=None):
        """Validate key and bind to HWID"""
        query = """
        SELECT * FROM validate_and_bind_key(%s, %s, %s, %s)
        """
        params = (key, hwid, ip_address, cookies)
        
        result = self.execute_query(query, params)
        
        if result and len(result) > 0:
            row = result[0]
            return {
                'success': row[0],
                'message': row[1],
                'expire_ts': row[2]
            }
        return {'success': False, 'message': 'Database error'}
    
    def check_heartbeat(self, key, hwid):
        """Check key validity for script heartbeat"""
        query = """
        SELECT * FROM check_heartbeat(%s, %s)
        """
        params = (key, hwid)
        
        result = self.execute_query(query, params)
        
        if result and len(result) > 0:
            row = result[0]
            return {
                'success': row[0],
                'message': row[1],
                'expire_ts': row[2]
            }
        return {'success': False, 'message': 'Database error'}
    
    def get_key_info(self, key):
        """Get detailed key information"""
        query = """
        SELECT * FROM get_key_info(%s)
        """
        params = (key,)
        
        result = self.execute_query(query, params)
        
        if result and len(result) > 0:
            row = result[0]
            return {
                'key': row[0],
                'hwid': row[1],
                'ip_address': str(row[2]) if row[2] else None,
                'expire_ts': row[3],
                'service': row[4],
                'is_valid': row[5]
            }
        return None
    
    def cleanup_expired_keys(self):
        """Clean up expired keys"""
        query = "SELECT cleanup_expired_keys()"
        result = self.execute_query(query)
        return result[0][0] if result else 0

# Initialize key system
key_system = NeonKeySystem()

# API Routes
@app.route('/api/create-key', methods=['POST'])
def create_key():
    try:
        data = request.get_json()
        service = data.get('service', 'lootlab')
        duration = data.get('duration', 3600)  # seconds
        hwid = data.get('hwid')
        ip_address = request.remote_addr
        cookies = json.dumps(dict(request.cookies)) if request.cookies else None
        
        # Convert duration to hours
        duration_hours = duration // 3600
        
        result = key_system.create_key(service, duration_hours, hwid, ip_address, cookies)
        
        if result['success']:
            return jsonify({
                'success': True,
                'key': result['key'],
                'duration': duration,
                'expire_ts': result['expire_ts']
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/generate-link', methods=['POST'])
def generate_link():
    """Generate random link for service"""
    try:
        data = request.get_json()
        service = data.get('service', 'lootlab')
        
        # Generate random ID
        import random
        import string
        random_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        
        return jsonify({
            'success': True,
            'serviceId': service,
            'randomId': random_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/validate-key', methods=['POST'])
def validate_key():
    try:
        data = request.get_json()
        key = data.get('key')
        hwid = data.get('hwid')
        ip_address = request.remote_addr
        cookies = json.dumps(dict(request.cookies)) if request.cookies else None
        
        result = key_system.validate_and_bind_key(key, hwid, ip_address, cookies)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': result['message'],
                'expire_ts': result['expire_ts']
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/heartbeat', methods=['POST'])
def heartbeat():
    """Script heartbeat endpoint"""
    try:
        data = request.get_json()
        key = data.get('key')
        hwid = data.get('hwid')
        
        result = key_system.check_heartbeat(key, hwid)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': result['message'],
                'expire_ts': result['expire_ts']
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/key-info/<key>', methods=['GET'])
def get_key_info(key):
    try:
        result = key_system.get_key_info(key)
        
        if result:
            return jsonify({
                'success': True,
                'data': result
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Key not found'
            }), 404
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cleanup', methods=['POST'])
def cleanup_expired():
    try:
        deleted_count = key_system.cleanup_expired_keys()
        return jsonify({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'Cleaned up {deleted_count} expired keys'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Legacy endpoints for backward compatibility
@app.route('/api/keys', methods=['GET'])
def get_all_keys():
    try:
        # Return empty for now - dashboard not used in new flow
        return jsonify({
            'success': True,
            'data': []
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/keys/<int:key_id>', methods=['PUT'])
def update_key(key_id):
    try:
        # Not used in new flow
        return jsonify({
            'success': False,
            'message': 'Key renewal not supported in new system'
        }), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/delete-key/<int:key_id>', methods=['DELETE'])
def delete_key(key_id):
    try:
        # Not used in new flow
        return jsonify({
            'success': False,
            'message': 'Key deletion not supported in new system'
        }), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
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
    # Run cleanup every hour
    def periodic_cleanup():
        while True:
            try:
                key_system.cleanup_expired_keys()
                print("Periodic cleanup completed")
            except Exception as e:
                print(f"Cleanup error: {e}")
            time.sleep(3600)  # 1 hour
    
    import threading
    cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
    cleanup_thread.start()
    
    app.run(host='0.0.0.0', port=5000, debug=True)
