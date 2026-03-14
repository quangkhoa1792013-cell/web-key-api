from flask import Flask, request, jsonify
from taokey import KeySystemLogic
import time

app = Flask(__name__)
logic = KeySystemLogic()

@app.route('/verify', methods=['GET'])
def verify():
    key_in = request.args.get('key')
    hwid_in = request.args.get('hwid')
    
    db = logic.get_db()
    if not key_in or key_in not in db: 
        return "INVALID"
    
    item = db[key_in]
    now = time.time()
    
    # Kiểm tra hết hạn
    if now >= item['expire_ts']: 
        return "EXPIRED"
    
    # Khóa HWID nếu lần đầu nhập
    if item['HWID'] == "NOT_LINKED":
        item['HWID'] = hwid_in
        logic.save_db(db)
    
    # Kiểm tra mã máy
    if item['HWID'] != hwid_in: 
        return "WRONG_DEVICE"
    
    # Trả về thành công và số giây còn lại
    return f"SUCCESS|{int(item['expire_ts'] - now)}"

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