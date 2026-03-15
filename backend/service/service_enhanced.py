import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from taokey import KeySystemLogic
from telegram_logger import telegram_logger
import os

app = Flask(__name__)
# Enable CORS for all domains (Netlify frontend)
CORS(app, origins=["*"])

logic = KeySystemLogic()

@app.route('/api/anti-cheat-check', methods=['POST'])
def anti_cheat_check():
    """Check for time manipulation"""
    try:
        data = request.get_json()
        client_time = data.get('client_time')
        key = data.get('key')
        
        if not client_time or not key:
            return jsonify({
                'success': False,
                'message': 'Missing parameters'
            }), 400
        
        # Get server time
        server_time = int(time.time())
        
        # Check time difference (allow 5 minutes tolerance)
        time_diff = abs(client_time - server_time)
        
        if time_diff > 300:  # 5 minutes
            # Log suspicious activity
            ip = request.remote_addr
            user_agent = request.headers.get('User-Agent', '')
            
            # Get key info for logging
            key_info = logic.get_key_info(key)
            hwid = key_info.get('hwid', 'Unknown') if key_info else 'Unknown'
            
            telegram_logger.log_suspicious_activity(
                key=key,
                hwid=hwid,
                ip=ip,
                activity=f"Time manipulation detected! Client time: {client_time}, Server time: {server_time}, Diff: {time_diff}s"
            )
            
            return jsonify({
                'success': False,
                'message': 'ANTI_CHEAT_DETECTED',
                'server_time': server_time
            }), 403
        
        return jsonify({
            'success': True,
            'message': 'Time check passed',
            'server_time': server_time
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/verify', methods=['GET'])
def verify():
    key_in = request.args.get('key')
    hwid_in = request.args.get('hwid')
    
    # Get user information from request
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')
    cookies = dict(request.cookies) if request.cookies else {}
    
    # Verify key using Neon database
    success, message = logic.verify_key(
        key=key_in, 
        hwid=hwid_in, 
        ip=ip_address, 
        user_agent=user_agent, 
        cookies=str(cookies)
    )
    
    if not success:
        if "EXPIRED" in message:
            # Log key expiration
            key_info = logic.get_key_info(key_in)
            hwid = key_info.get('hwid', hwid_in) if key_info else hwid_in
            
            telegram_logger.log_key_expired(
                key=key_in,
                hwid=hwid,
                ip=ip_address,
                reason="Key expired during verification"
            )
            
            return "EXPIRED"
        elif "NOT_FOUND" in message:
            return "INVALID"
        elif "ALREADY_BOUND" in message:
            return "WRONG_DEVICE"
        else:
            return "INVALID"
    
    # Get key info for remaining time
    key_info = logic.get_key_info(key_in)
    if key_info:
        now = int(time.time())
        time_left = int(key_info['expire_ts'] - now)
        return f"SUCCESS|{time_left}"
    
    return "INVALID"

@app.route('/api/create-key', methods=['POST'])
def api_create_key():
    """API để tạo key mới với Telegram logging"""
    try:
        data = request.get_json()
        duration = data.get('duration', 3600)  # Default 1 hour
        service = data.get('service', 'lootlab')
        hwid = data.get('hwid')
        
        # Convert duration to hours
        duration_hours = duration // 3600
        
        # Create key
        key_result, status = logic.create_key(
            duration_hours=duration_hours,
            hwid=hwid,
            ip=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            cookies=str(dict(request.cookies)) if request.cookies else None
        )
        
        if status == "SUCCESS":
            # Log key creation to Telegram
            telegram_logger.log_key_created(
                key=key_result[0],
                hwid=hwid or 'NOT_LINKED',
                ip=request.remote_addr,
                user_agent=request.headers.get('User-Agent', ''),
                service=service,
                duration_hours=duration_hours
            )
            
            return jsonify({
                'success': True,
                'key': key_result[0],
                'duration': duration,
                'expire_ts': key_result[1]
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': status
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/session-check/<randomId>', methods=['GET'])
def session_check(randomId):
    """API để kiểm tra tính hợp lệ của phiên làm việc"""
    try:
        # Check session validity using Neon database
        success, message = logic.check_session_valid(randomId)
        
        return jsonify({
            'success': success,
            'message': message,
            'randomId': randomId
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Keep existing routes for backward compatibility
@app.route('/api/keys', methods=['GET'])
def get_all_keys():
    """API để lấy tất cả keys cho Dashboard"""
    try:
        keys_list = logic.get_all_keys()
        return jsonify({
            'success': True,
            'data': keys_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/keys/<key_id>', methods=['PUT'])
def update_key(key_id):
    """API để cập nhật key (renew)"""
    try:
        data = request.get_json()
        
        return jsonify({
            'success': False,
            'error': 'Key renewal not supported in new system'
        }), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete-key/<key_id>', methods=['DELETE'])
def delete_key(key_id):
    """API để xóa key"""
    try:
        return jsonify({
            'success': False,
            'error': 'Key deletion not supported in new system'
        }), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete-key/<key_id>', methods=['DELETE'])
def api_delete_key(key_id):
    """Alternative delete endpoint for compatibility"""
    return delete_key(key_id)

@app.route('/config', methods=['GET'])
def get_config():
    """API để frontend lấy cấu hình"""
    try:
        conf = logic.load_conf()
        return jsonify({
            'success': True,
            'data': {
                'app_name': conf['app_name'],
                'max_slots': conf['max_slots'],
                'test_duration': conf['test_duration']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/create-key', methods=['POST'])
def create_key():
    """API để frontend tạo key mới"""
    try:
        data = request.get_json()
        duration = data.get('duration', 30) # Default 30s
        service = data.get('service', 'lootlab')
        hwid = data.get('hwid')
        
        # Convert duration to hours
        duration_hours = duration // 3600
        
        # Create key
        key_result, status = logic.create_key(
            duration_hours=duration_hours,
            hwid=hwid,
            ip=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            cookies=str(dict(request.cookies)) if request.cookies else None
        )
        
        if status == "SUCCESS":
            # Log key creation to Telegram
            telegram_logger.log_key_created(
                key=key_result[0],
                hwid=hwid or 'NOT_LINKED',
                ip=request.remote_addr,
                user_agent=request.headers.get('User-Agent', ''),
                service=service,
                duration_hours=duration_hours
            )
            
            return jsonify({
                'success': True,
                'key': key_result[0],
                'duration': duration
            })
        else:
            return jsonify({
                'success': False,
                'error': status
            })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == "__main__":
    conf = logic.load_conf()
    print(f"Server dang chay tai port: {conf['api_port']}")
    app.run(host="0.0.0.0", port=conf['api_port'], threaded=True)
