#!/usr/bin/env python3
"""
Script tạo Key test trong database Neon
Key: KHOA-TEST-123
Expire: 24h từ thời điểm hiện tại
"""

import os
import time
import psycopg2
from datetime import datetime, timedelta

def create_test_key():
    """Tạo key test trong database"""
    
    # Database URL từ .env
    database_url = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_QYUiysc38zPX@ep-delicate-waterfall-a19loa07-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require')
    
    try:
        # Kết nối đến database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Tính thời gian hết hạn (24h từ now)
        expire_time = int(time.time()) + (24 * 60 * 60)  # 24 hours in seconds
        expire_datetime = datetime.now() + timedelta(hours=24)
        
        # SQL để tạo key test
        insert_query = """
        INSERT INTO user_sessions (key, service, status, ip_address, expire_ts, hwid, cookies)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
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
            print(f"🌐 Database: Neon PostgreSQL")
            print("\n📝 Key sẽ hết hạn sau 24 giờ.")
            print("🔍 Dùng key này để test giao diện Key Dashboard.")
        else:
            print("❌ Không thể tạo key test")
            
    except Exception as e:
        print(f"❌ Lỗi khi tạo key test: {e}")
        print(f"📝 Chi tiết lỗi: {str(e)}")
        
    finally:
        # Đóng kết nối
        if 'conn' in locals():
            conn.close()
        if 'cursor' in locals():
            cursor.close()

if __name__ == "__main__":
    print("🚀 Bắt đầu tạo Key test...")
    print("=" * 50)
    create_test_key()
    print("=" * 50)
    print("✨ Hoàn thành!")
