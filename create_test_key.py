#!/usr/bin/env python3
"""
Script tạo Key test trong database Neon
Key: KHOA-TEST-123
Expire: 24h từ thời điểm hiện tại
"""

import os
import sys
import time
import psycopg2
from datetime import datetime, timedelta

def create_test_key():
    """Tạo key test trong database"""
    
    # Database URL từ .env
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL không tìm thấy trong environment variables!")
        print("📝 Vui lòng thiết lập DATABASE_URL trong file .env")
        return False
    
    try:
        print(f"🔗 Kết nối đến database...")
        print(f"📝 Database URL: {database_url[:50]}...")
        
        # Kết nối đến database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("✅ Kết nối database thành công!")
        
        # Tính thời gian hết hạn (24h từ now)
        expire_time = int(time.time()) + (24 * 60 * 60)  # 24 hours in seconds
        expire_datetime = datetime.now() + timedelta(hours=24)
        
        # SQL để tạo key test
        insert_query = """
        INSERT INTO user_sessions (key, service, status, ip_address, expire_ts, hwid, cookies)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, key, expire_ts
        """
        
        params = (
            'KHOA-TEST-123',  # Key test
            'test',           # Service
            'ACTIVE',         # Status
            '127.0.0.1',      # IP address
            expire_time,      # Expire timestamp
            'TEST_HWID',      # HWID
            '{"test": true, "created_at": "' + datetime.now().isoformat() + '"}'  # Cookies JSON
        )
        
        print("🔑 Tạo key test...")
        print(f"📋 Key: KHOA-TEST-123")
        print(f"⏰ Expire Timestamp: {expire_time}")
        print(f"📅 Expire DateTime: {expire_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Thực thi query
        cursor.execute(insert_query, params)
        result = cursor.fetchone()
        
        # Commit transaction
        conn.commit()
        
        # Hiển thị kết quả
        if result:
            print("✅ ĐÃ TẠO KEY TEST THÀNH CÔNG!")
            print(f"🔑 Key: {result[1]}")
            print(f"🆔 ID: {result[0]}")
            print(f"⏰ Expire Timestamp: {result[2]}")
            print(f"📅 Expire DateTime: {expire_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
            print("🌐 Database: Neon PostgreSQL")
            print("\n📝 Key sẽ hết hạn sau 24 giờ.")
            print("🔍 Dùng key này để test giao diện Key Dashboard.")
            return True
        else:
            print("❌ Không thể tạo key test")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi khi tạo key test: {e}")
        print(f"📝 Chi tiết lỗi: {str(e)}")
        return False
        
    finally:
        # Đóng kết nối
        if 'conn' in locals() and conn:
            conn.close()
            print("🔌 Đóng kết nối database")
        if 'cursor' in locals() and cursor:
            cursor.close()
            print("🔌 Đóng cursor")

if __name__ == "__main__":
    print("🚀 Bắt đầu tạo Key test...")
    print("=" * 50)
    success = create_test_key()
    print("=" * 50)
    if success:
        print("✨ Hoàn thành! Key test đã sẵn sàng để sử dụng.")
        print("🌐 Truy cập: http://localhost:5173/k/KHOA-TEST-123")
    else:
        print("❌ Thất bại! Không thể tạo key test.")
        sys.exit(1)
