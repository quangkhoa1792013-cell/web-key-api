import requests
import json

def test_service_redirect():
    """Test service redirect endpoint"""
    base_url = "http://127.0.0.1:7860"
    
    print("=== TESTING SERVICE REDIRECT ===\n")
    
    # Test 1: Direct service path access
    print("1. Testing direct service path access:")
    try:
        response = requests.get(f"{base_url}/worklink-15ecz4e9", headers={
            'X-HWID': 'HWID_TEST_WORKLINK_123',
            'User-Agent': 'Test-Agent'
        }, allow_redirects=False)  # Don't follow redirects to see response
        
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Response: {response.text[:200]}...")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test 2: Track service access API
    print("2. Testing track service access API:")
    try:
        headers = {
            'Content-Type': 'application/json',
            'X-HWID': 'HWID_TEST_TRACK_456',
            'User-Agent': 'Test-Agent'
        }
        data = {
            'service': 'worklink',
            'path': '/worklink-15ecz4e9'
        }
        response = requests.post(f"{base_url}/api/track-service-access", headers=headers, json=data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test 3: Different service patterns
    print("3. Testing different service patterns:")
    service_patterns = [
        'lootlab-abc123',
        'pandas-def456',
        'linkvertise-ghi789',
        'worklink-jkl012'
    ]
    
    for pattern in service_patterns:
        try:
            response = requests.get(f"{base_url}/{pattern}", headers={
                'X-HWID': f'HWID_TEST_{pattern.upper()}',
                'User-Agent': 'Test-Agent'
            }, allow_redirects=False)
            
            print(f"   {pattern}: {response.status_code}")
            
        except Exception as e:
            print(f"   {pattern}: Error - {e}")
    
    print()
    
    # Test 4: No HWID fallback
    print("4. Testing without HWID (fallback generation):")
    try:
        response = requests.get(f"{base_url}/worklink-15ecz4e9", headers={
            'User-Agent': 'Fallback-Test-Agent'
        }, allow_redirects=False)
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n=== END OF TEST ===")

if __name__ == "__main__":
    test_service_redirect()
