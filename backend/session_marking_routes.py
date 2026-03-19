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
            
            print(f"[SessionMarking] Session marked: {service_id}-{random_id} (ID: {session_id})")
            
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
        print(f"[SessionMarking] Error: {e}")
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
        print(f"[CheckSessionMark] Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
