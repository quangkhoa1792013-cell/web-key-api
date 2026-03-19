from flask import Flask, request, jsonify
from flask_cors import CORS
from taokey import KeySystemLogic
import time

app = Flask(__name__)
# Enable CORS for all domains (Netlify frontend)
CORS(app, origins=["*"])

logic = KeySystemLogic()

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

@app.route('/api/keys', methods=['GET'])
def get_all_keys():
    """API để lấy tất cả keys cho Dashboard"""
    try:
        db = logic.get_db()
        now = time.time()
        
        # Convert dict to list with calculated fields
        keys_list = []
        for key_id, key_data in db.items():
            expire_ts = key_data.get('expire_ts', 0)
            time_left = max(0, int(expire_ts - now))
            status = 'ACTIVE' if expire_ts > now else 'EXPIRED'
            
            keys_list.append({
                'id': key_id,
                'key': key_data.get('KEY', key_id),
                'hwid': key_data.get('HWID', 'NOT_LINKED'),
                'expire_ts': expire_ts,
                'timeLeft': time_left,
                'status': status
            })
        
        return jsonify({
            'success': True,
            'data': keys_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/keys', methods=['POST'])
def api_create_key():
    """API để tạo key mới (REST format)"""
    try:
        data = request.get_json()
        duration = data.get('duration', 3600)  # Default 1 hour
        
        # Temporarily override duration in config
        conf = logic.load_conf()
        original_duration = conf['test_duration']
        conf['test_duration'] = duration
        
        # Save config temporarily
        import json
        with open(logic.conf_file, 'w', encoding='utf-8') as f:
            json.dump(conf, f, indent=4, ensure_ascii=False)
        
        # Create key
        key, status = logic.create_key()
        
        # Restore original duration
        conf['test_duration'] = original_duration
        with open(logic.conf_file, 'w', encoding='utf-8') as f:
            json.dump(conf, f, indent=4, ensure_ascii=False)
        
        if status == "SUCCESS":
            return jsonify({
                'success': True,
                'key': key,
                'duration': duration
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': status
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/keys/<key_id>', methods=['DELETE'])
def delete_key(key_id):
    """API để xóa key"""
    try:
        db = logic.get_db()
        if key_id in db:
            del db[key_id]
            logic.save_db(db)
            return jsonify({
                'success': True,
                'message': f'Key {key_id} deleted'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Key not found'
            }), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/keys/<key_id>', methods=['PUT'])
def update_key(key_id):
    """API để cập nhật key (renew)"""
    try:
        data = request.get_json()
        db = logic.get_db()
        
        if key_id not in db:
            return jsonify({
                'success': False,
                'error': 'Key not found'
            }), 404
        
        # Update expire_ts
        additional_duration = data.get('duration', 86400)  # Default +24h
        db[key_id]['expire_ts'] = time.time() + additional_duration
        logic.save_db(db)
        
        return jsonify({
            'success': True,
            'message': 'Key renewed successfully',
            'new_expire_ts': db[key_id]['expire_ts']
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete-key/<key_id>', methods=['DELETE'])
def api_delete_key(key_id):
    """Alternative delete endpoint for compatibility"""
    return delete_key(key_id)

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
        
        # Tạm thởi override duration trong config
        original_duration = logic.load_conf()['test_duration']
        
        # Cập nhật tạm thởi duration
        conf = logic.load_conf()
        conf['test_duration'] = duration
        
        # Lưu config tạm thởi
        import json
        with open(logic.conf_file, 'w', encoding='utf-8') as f:
            json.dump(conf, f, indent=4, ensure_ascii=False)
        
        # Tạo key
        key, status = logic.create_key()
        
        # Restore original duration
        conf['test_duration'] = original_duration
        with open(logic.conf_file, 'w', encoding='utf-8') as f:
            json.dump(conf, f, indent=4, ensure_ascii=False)
        
        if status == "SUCCESS":
            return jsonify({
                'success': True,
                'key': key,
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