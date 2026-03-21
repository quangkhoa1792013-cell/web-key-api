import psycopg2
import time
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseConnectionTester:
    def __init__(self):
        self.db_url = os.environ.get('DATABASE_URL')
        self.config = self.parse_db_url()
    
    def parse_db_url(self):
        """Parse DATABASE_URL"""
        from urllib.parse import urlparse
        
        if self.db_url.startswith('postgres://'):
            self.db_url = self.db_url.replace('postgres://', 'postgresql://', 1)
        
        parsed = urlparse(self.db_url)
        return {
            'host': parsed.hostname,
            'port': parsed.port or 5432,
            'database': parsed.path.lstrip('/'),
            'user': parsed.username,
            'password': parsed.password,
            'sslmode': 'require'
        }
    
    def test_connection_robustness(self):
        """Test database connection with various scenarios"""
        print("=== DATABASE CONNECTION ROBUSTNESS TEST ===\n")
        
        # Test 1: Normal connection
        print("1. Testing normal connection...")
        try:
            conn = psycopg2.connect(
                host=self.config['host'],
                port=self.config['port'],
                database=self.config['database'],
                user=self.config['user'],
                password=self.config['password'],
                sslmode=self.config['sslmode'],
                connect_timeout=15,
                application_name='roblox_key_system',
                keepalives=1,
                keepalives_idle=30,
                keepalives_interval=10,
                keepalives_count=3
            )
            
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                print(f"   ✅ Normal connection successful: {result}")
            
            conn.close()
            
        except Exception as e:
            print(f"   ❌ Normal connection failed: {e}")
        
        print()
        
        # Test 2: Multiple rapid connections
        print("2. Testing multiple rapid connections...")
        success_count = 0
        for i in range(5):
            try:
                conn = psycopg2.connect(
                    host=self.config['host'],
                    port=self.config['port'],
                    database=self.config['database'],
                    user=self.config['user'],
                    password=self.config['password'],
                    sslmode=self.config['sslmode'],
                    connect_timeout=10,
                    application_name='roblox_key_system'
                )
                
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                
                conn.close()
                success_count += 1
                print(f"   ✅ Connection {i+1}: Success")
                
            except Exception as e:
                print(f"   ❌ Connection {i+1}: Failed - {e}")
            
            time.sleep(0.1)  # Small delay between connections
        
        print(f"   Result: {success_count}/5 connections successful")
        print()
        
        # Test 3: Connection timeout simulation
        print("3. Testing connection with short timeout...")
        try:
            conn = psycopg2.connect(
                host=self.config['host'],
                port=self.config['port'],
                database=self.config['database'],
                user=self.config['user'],
                password=self.config['password'],
                sslmode=self.config['sslmode'],
                connect_timeout=1,  # Very short timeout
                application_name='roblox_key_system'
            )
            
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            
            conn.close()
            print(f"   ✅ Short timeout connection successful: {result}")
            
        except Exception as e:
            print(f"   ❌ Short timeout connection failed (expected): {e}")
        
        print()
        
        # Test 4: Long-running query simulation
        print("4. Testing long-running query...")
        try:
            conn = psycopg2.connect(
                host=self.config['host'],
                port=self.config['port'],
                database=self.config['database'],
                user=self.config['user'],
                password=self.config['password'],
                sslmode=self.config['sslmode'],
                connect_timeout=15,
                application_name='roblox_key_system'
            )
            
            with conn.cursor() as cursor:
                # Simulate a longer query
                cursor.execute("SELECT pg_sleep(2), 1")
                result = cursor.fetchone()
                print(f"   ✅ Long-running query successful: {result}")
            
            conn.close()
            
        except Exception as e:
            print(f"   ❌ Long-running query failed: {e}")
        
        print("\n=== END OF TEST ===")

if __name__ == "__main__":
    tester = DatabaseConnectionTester()
    tester.test_connection_robustness()
