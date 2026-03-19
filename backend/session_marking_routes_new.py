#!/usr/bin/env python3
"""
Session Marking Routes
Xử lý việc đánh dấu session và cập nhật HWID
"""

import os
import json
import time
from datetime import datetime
from flask import Flask, request, jsonify

def create_session_marking_routes(app, key_system):
    """Tạo các route cho việc đánh dấu session"""
    
    @app.route('/api/session-marking', methods=['POST'])
    def session_marking():
        """Đánh dấu session và cập nhật HWID"""
        try:
            if not key_system:
                return jsonify({'success': False, 'error': 'Key system not initialized'}), 500
            
            data = request.get_json()
            session_id = data.get('sessionId')
            hwid = request.headers.get('X-HWID', 'UNKNOWN')  # Lấy HWID từ header
            service = data.get('service', 'unknown')
            
            if not session_id:
                return jsonify({'success': False, 'error': 'Missing session ID'}), 400
            
            # Kiểm tra session tồn tại
            check_query = """
            SELECT id, hwid, status, expire_ts 
            FROM user_sessions 
            WHERE key = %s
            """
            
            result = key_system.execute_query(check_query, (session_id,))
            
            if result and len(result) > 0:
                session_data = result[0]
                stored_hwid = session_data[1]
                
                print(f"[SESSION_MARKING] Checking session: {session_id}")
                print(f"[SESSION_MARKING] Stored HWID: {stored_hwid}")
                print(f"[SESSION_MARKING] Request HWID: {hwid}")
                
                # Kiểm tra HWID
                if stored_hwid == 'UNKNOWN' or stored_hwid is None:
                    # HWID chưa được set, cho phép cập nhật
                    update_query = """
                    UPDATE user_sessions 
                    SET hwid = %s, status = %s 
                    WHERE key = %s
                    """
                    
                    params = (hwid, 'ACTIVE', session_id)
                    key_system.execute_query(update_query, params)
                    
                    print(f"[SESSION_MARKING] ✅ HWID updated: {hwid} for session: {session_id}")
                    
                    return jsonify({
                        'success': True,
                        'message': 'HWID updated successfully',
                        'hwid': hwid,
                        'sessionId': session_id
                    })
                elif stored_hwid == hwid:
                    # HWID khớp, cho phép truy cập
                    print(f"[SESSION_MARKING] ✅ HWID verified: {hwid} for session: {session_id}")
                    
                    return jsonify({
                        'success': True,
                        'message': 'HWID verified successfully',
                        'hwid': stored_hwid,
                        'sessionId': session_id,
                        'status': session_data[2],
                        'expire_ts': session_data[3]
                    })
                else:
                    # HWID không khớp
                    print(f"[SESSION_MARKING] ❌ HWID mismatch: stored={stored_hwid}, request={hwid}")
                    
                    return jsonify({
                        'success': False,
                        'error': 'Thiết bị không hợp lệ. Mỗi ID chỉ dành cho 1 người dùng.',
                        'stored_hwid': stored_hwid,
                        'request_hwid': hwid
                    }), 403
            else:
                print(f"[SESSION_MARKING] ❌ Session not found: {session_id}")
                return jsonify({
                    'success': False,
                    'error': 'Session not found'
                }), 404
                
        except Exception as e:
            print(f"[SESSION_MARKING] ❌ Error: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/session-status', methods=['GET'])
    def session_status():
        """Kiểm tra trạng thái session"""
        try:
            session_id = request.args.get('sessionId')
            
            if not session_id:
                return jsonify({'success': False, 'error': 'Missing session ID'}), 400
            
            # Kiểm tra session
            check_query = """
            SELECT id, hwid, status, expire_ts, service 
            FROM user_sessions 
            WHERE key = %s
            """
            
            result = key_system.execute_query(check_query, (session_id,))
            
            if result and len(result) > 0:
                session_data = result[0]
                return jsonify({
                    'success': True,
                    'session': {
                        'id': session_data[0],
                        'hwid': session_data[1],
                        'status': session_data[2],
                        'expire_ts': session_data[3],
                        'service': session_data[4]
                    }
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Session not found'
                }), 404
                
        except Exception as e:
            print(f"[SESSION_STATUS] ❌ Error: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/hwid-validate', methods=['POST'])
    def hwid_validate():
        """Validate HWID và cập nhật nếu cần"""
        try:
            data = request.get_json()
            session_id = data.get('sessionId')
            new_hwid = data.get('hwid')
            
            if not session_id or not new_hwid:
                return jsonify({'success': False, 'error': 'Missing session ID or HWID'}), 400
            
            # Kiểm tra session và cập nhật HWID
            check_query = """
            SELECT id, hwid 
            FROM user_sessions 
            WHERE key = %s
            """
            
            result = key_system.execute_query(check_query, (session_id,))
            
            if result and len(result) > 0:
                session_data = result[0]
                old_hwid = session_data[1]
                
                if old_hwid == 'PENDING_SESSION':
                    # Chỉ cập nhật nếu HWID đang là PENDING
                    update_query = """
                    UPDATE user_sessions 
                    SET hwid = %s, status = %s 
                    WHERE id = %s
                    """
                    
                    params = (new_hwid, 'ACTIVE', session_data[0])
                    key_system.execute_query(update_query, params)
                    
                    print(f"[HWID_VALIDATE] ✅ HWID set: {new_hwid} for session: {session_id}")
                    
                    return jsonify({
                        'success': True,
                        'message': 'HWID validated and set',
                        'hwid': new_hwid,
                        'sessionId': session_id
                    })
                else:
                    # HWID đã được set, chỉ validate
                    if old_hwid == new_hwid:
                        print(f"[HWID_VALIDATE] ✅ HWID validated: {new_hwid} for session: {session_id}")
                        return jsonify({
                            'success': True,
                            'message': 'HWID validated successfully',
                            'hwid': old_hwid,
                            'sessionId': session_id
                        })
                    else:
                        print(f"[HWID_VALIDATE] ❌ HWID mismatch: old={old_hwid}, new={new_hwid}")
                        return jsonify({
                            'success': False,
                            'error': 'HWID mismatch - device already registered',
                            'old_hwid': old_hwid,
                            'new_hwid': new_hwid
                        }), 403
            else:
                return jsonify({
                    'success': False,
                    'error': 'Session not found'
                }), 404
                
        except Exception as e:
            print(f"[HWID_VALIDATE] ❌ Error: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    print("✅ Session marking routes initialized successfully")
    return True
