"""
 * @file: get_request.py
 * @path: roblox/lootlab/get_request.py
 * @purpose: LootLabs GET request script cho content locker data
 * @functionality: Send GET requests to LootLabs API với query parameters
 * @connections: Kết nối đến creators.lootlabs.gg API với API token
"""
import requests

# API Endpoint with query parameters
with open('api.txt', 'r', encoding='utf-8') as file:
    api_token = file.readline() # Replace with your actual API token
url = f"https://creators.lootlabs.gg/api/public/content_locker?api_token={api_token}&title=title&url=url.com&tier_id=3&number_of_tasks=3&theme=1&thumbnail=https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Send GET request
response = requests.get(url)

# Print response
print(response.json())