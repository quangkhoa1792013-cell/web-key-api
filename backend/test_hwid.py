import random
import string
import json
from datetime import datetime

def generate_hwid():
    """Generate HWID for frontend testing"""
    hwid = 'HWID_' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
    return hwid

def test_api_calls():
    """Test API calls with proper HWID"""
    import requests
    
    base_url = "http://127.0.0.1:7860"
    hwid = generate_hwid()
    
    headers = {
        'Content-Type': 'application/json',
        'X-HWID': hwid,
        'User-Agent': 'Test-Agent'
    }
    
    print(f"Generated HWID: {hwid}")
    
    # Test check-key-status with HWID
    response = requests.get(f"{base_url}/api/check-key-status?service=lootlab", headers=headers)
    print(f"Check Key Status: {response.status_code} - {response.json()}")
    
    # Test mark-session with HWID
    data = {
        'serviceId': 'lootlab',
        'randomId': 'test123',
        'hwid': hwid
    }
    response = requests.post(f"{base_url}/api/mark-session", headers=headers, json=data)
    print(f"Mark Session: {response.status_code} - {response.json()}")

if __name__ == "__main__":
    test_api_calls()
