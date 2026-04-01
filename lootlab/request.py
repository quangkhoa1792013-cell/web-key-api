"""
 * @file: request.py
 * @path: roblox/lootlab/request.py
 * @purpose: LootLabs API request script cho content locker
 * @functionality: Send requests to LootLabs API, read API token from file
 * @connections: Kết nối đến creators.lootlabs.gg API endpoint
"""
import requests

with open('api.txt', 'r', encoding='utf-8') as file:
    api_token = file.readline()
# API Endpoint
url = "https://creators.lootlabs.gg/api/public/content_locker"

# Replace 'YOUR_API_TOKEN' with your actual API token
headers = {
    "Authorization": f"Bearer {api_token}"
}

# Request body data
data = {
    "title": "hello",
    "url": "https://yourlinkhere.com",
    "tier_id": 1,
    "number_of_tasks": 3,
    "theme": 3,
    "thumbnail": "https://example.com/thumbnail.jpg"
}

# Send POST request
response = requests.post(url, headers=headers, json=data)

# Print response
print(response.json())