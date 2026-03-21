import requests
import json

def test_hwid_extraction():
    """Test HWID extraction with different methods"""
    base_url = "http://127.0.0.1:7860"
    
    print("=== TESTING HWID EXTRACTION ===\n")
    
    # Test 1: HWID in header (preferred method)
    print("1. Testing HWID in X-HWID header:")
    headers = {
        'Content-Type': 'application/json',
        'X-HWID': 'HWID_TEST_HEADER_123',
        'User-Agent': 'Test-Agent'
    }
    response = requests.get(f"{base_url}/api/check-key-status?service=lootlab", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    print()
    
    # Test 2: HWID in query parameter
    print("2. Testing HWID in query parameter:")
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Agent'
    }
    response = requests.get(f"{base_url}/api/check-key-status?service=lootlab&hwid=HWID_QUERY_PARAM_456", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    print()
    
    # Test 3: HWID in JSON body (POST)
    print("3. Testing HWID in JSON body:")
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Agent'
    }
    data = {
        'serviceId': 'lootlab',
        'randomId': 'test789',
        'hwid': 'HWID_JSON_BODY_789'
    }
    response = requests.post(f"{base_url}/api/mark-session", headers=headers, json=data)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    print()
    
    # Test 4: No HWID (fallback generation)
    print("4. Testing fallback HWID generation:")
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Fallback-Test-Agent'
    }
    response = requests.get(f"{base_url}/api/check-key-status?service=lootlab", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    print()
    
    print("=== END OF TEST ===")

if __name__ == "__main__":
    test_hwid_extraction()
