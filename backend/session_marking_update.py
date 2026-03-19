# Backend Update - Add Session Marking Route

## Thêm vào neon_service_signature.py:

@app.route('/api/mark-session', methods=['POST'])
def mark_session():
    """Đánh dấu phiên trong Database TRƯỚC KHI cho phép navigate"""
    try:
        data = request.get_json()
        service_id = data.get('serviceId')
        random_id = data.get('randomId')
        
        if not service_id or not random_id:
            return jsonify({
                'success': False, 
                'message': 'Missing serviceId or randomId'
            }), 400
        
        # Kiểm tra xem session đã tồn tại chưa
        check_query = """
        SELECT id FROM user_sessions 
        WHERE key = %s
        """
        
        result = key_system.execute_query(check_query, (random_id,))
        
        if result:
            return jsonify({
                'success': False, 
                'message': 'Session ID already exists'
            }), 400
        
        # INSERT session marking vào database - "Giữ chỗ"
        insert_query = """
        INSERT INTO user_sessions (key, service, status, expire_ts, hwid, ip_address, cookies)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, expire_ts
        """
        
        # Session expires in 30 phút (1800 giây) để giữ chỗ
        session_expire_ts = int(time.time()) + 1800
        
        params = (
            random_id,           # key = randomId để đánh dấu
            service_id,          # service
            'PENDING',           # status = PENDING (đang chờ)
            session_expire_ts,   # expire_ts (30 phút giữ chỗ)
            'PENDING_SESSION',  # hwid = PENDING_SESSION
            request.remote_addr, # ip_address
            json.dumps({         # cookies với thông tin marking
                'marked_at': time.time(),
                'user_agent': request.headers.get('User-Agent', ''),
                'service': service_id
            })
        )
        
        result = key_system.execute_query(insert_query, params)
        
        if result:
            session_id = result[0][0]
            expire_ts = result[0][1]
            
            print(f"[SessionMarking] Session marked: {service_id}-{randomId} (ID: {session_id})")
            
            return jsonify({
                'success': True,
                'sessionId': session_id,
                'randomId': random_id,
                'serviceId': service_id,
                'expireTs': expire_ts,
                'message': 'Session marked successfully in database'
            })
        else:
            return jsonify({
                'success': False, 
                'message': 'Failed to mark session in database'
            }), 500
            
    except Exception as e:
        print(f"[SessionMarking] Database error: {e}")
        return jsonify({
            'success': False, 
            'message': f'Database connection error: {str(e)}'
        }), 500

@app.route('/api/check-session-mark', methods=['POST'])
def check_session_mark():
    """Kiểm tra xem session ID có được đánh dấu trong Database không"""
    try:
        data = request.get_json()
        random_id = data.get('randomId')
        
        if not random_id:
            return jsonify({
                'success': False, 
                'message': 'Missing randomId'
            }), 400
        
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
                'message': 'Session found and valid in database'
            })
        else:
            return jsonify({
                'success': True,
                'exists': False,
                'message': 'Session not found or expired in database'
            })
            
    except Exception as e:
        print(f"[CheckSessionMark] Error: {e}")
        return jsonify({
            'success': False, 
            'message': f'Database error: {str(e)}'
        }), 500

