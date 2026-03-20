#!/usr/bin/env python3
"""
Script to update expire_ts for all keys to a very large number
and update HWID logic in flask_app.py
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def update_expire_ts():
    """Update expire_ts for all keys to prevent expiration"""
    try:
        # Connect to Neon database
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if not DATABASE_URL:
            print("❌ DATABASE_URL not found in environment variables")
            return False
            
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Update expire_ts to year 2033 (very large number)
        new_expire_ts = 2000000000  # This is approximately May 2033
        
        update_query = """
        UPDATE user_sessions 
        SET expire_ts = %s 
        WHERE expire_ts IS NOT NULL
        """
        
        cursor.execute(update_query, (new_expire_ts,))
        
        # Check how many rows were updated
        updated_count = cursor.rowcount
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Successfully updated {updated_count} keys with new expire_ts: {new_expire_ts}")
        print(f"✅ Keys will not expire until approximately May 2033")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating expire_ts: {e}")
        return False

def check_current_keys():
    """Check current status of keys in database"""
    try:
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if not DATABASE_URL:
            print("❌ DATABASE_URL not found")
            return
            
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check current keys
        check_query = """
        SELECT key, expire_ts, status, hwid 
        FROM user_sessions 
        ORDER BY expire_ts DESC 
        LIMIT 10
        """
        
        cursor.execute(check_query)
        results = cursor.fetchall()
        
        print(f"\n📊 Current keys status (showing top 10):")
        print(f"{'Key':<20} {'Expire_TS':<15} {'Status':<10} {'HWID':<15}")
        print("-" * 65)
        
        for row in results:
            key_val, expire_ts, status, hwid = row
            print(f"{key_val:<20} {expire_ts:<15} {status:<10} {hwid or 'NULL':<15}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking keys: {e}")

if __name__ == "__main__":
    print("🔧 Starting database fix script...")
    print("=" * 50)
    
    # Check current status first
    print("\n📋 Checking current keys status...")
    check_current_keys()
    
    # Update expire_ts
    print("\n🔄 Updating expire_ts for all keys...")
    if update_expire_ts():
        print("\n✅ Database update completed successfully!")
        
        # Check status after update
        print("\n📋 Checking keys status after update...")
        check_current_keys()
    else:
        print("\n❌ Database update failed!")
    
    print("\n" + "=" * 50)
    print("🎯 Script completed!")
