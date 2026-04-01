"""
 * @file: telegram_logger.py
 * @path: roblox/backend/telegram_logger.py
 * @purpose: Telegram logging service cho notifications và alerts
 * @functionality: Send messages to Telegram bot, error logging, system alerts
 * @connections: Được sử dụng bởi flask_app.py để gửi notifications
"""
import requests
import os
import time
from datetime import datetime

class TelegramLogger:
    def __init__(self):
        self.bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        self.chat_id = os.environ.get('TELEGRAM_CHAT_ID')
        self.enabled = bool(self.bot_token and self.chat_id)
        
        if self.enabled:
            print("[TelegramLogger] Telegram logging enabled")
        else:
            print("[TelegramLogger] Telegram logging disabled (missing credentials)")
    
    def send_message(self, message, parse_mode='Markdown'):
        """Send message to Telegram"""
        if not self.enabled:
            return False
        
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            data = {
                'chat_id': self.chat_id,
                'text': message,
                'parse_mode': parse_mode
            }
            
            response = requests.post(url, json=data, timeout=10)
            
            if response.status_code == 200:
                print("[TelegramLogger] Message sent successfully")
                return True
            else:
                print(f"[TelegramLogger] Failed to send message: {response.text}")
                return False
                
        except Exception as e:
            print(f"[TelegramLogger] Error sending message: {e}")
            return False
    
    def log_key_created(self, key, hwid, ip, user_agent, service, duration_hours):
        """Log key creation event"""
        if not self.enabled:
            return
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        message = f"""
🔑 *NEW KEY CREATED*

📅 *Time:* `{timestamp}`
🔑 *Key:* `{key}`
🖥️ *HWID:* `{hwid[:20]}...` if len(hwid) > 20 else f"`{hwid}`"
🌐 *IP:* `{ip}`
🔧 *Service:* `{service}`
⏰ *Duration:* `{duration_hours}h`
📱 *User Agent:* `{user_agent[:50]}...` if len(user_agent) > 50 else f"`{user_agent}`"
        """
        
        self.send_message(message)
    
    def log_key_expired(self, key, hwid, ip, reason="EXPIRED"):
        """Log key expiration event"""
        if not self.enabled:
            return
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        message = f"""
⏰ *KEY EXPIRED*

📅 *Time:* `{timestamp}`
🔑 *Key:* `{key}`
🖥️ *HWID:* `{hwid[:20]}...` if len(hwid) > 20 else f"`{hwid}`"
🌐 *IP:* `{ip}`
🚫 *Reason:* `{reason}`
        """
        
        self.send_message(message)
    
    def log_suspicious_activity(self, key, hwid, ip, activity):
        """Log suspicious activity"""
        if not self.enabled:
            return
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        message = f"""
🚨 *SUSPICIOUS ACTIVITY*

📅 *Time:* `{timestamp}`
🔑 *Key:* `{key}`
🖥️ *HWID:* `{hwid[:20]}...` if len(hwid) > 20 else f"`{hwid}`"
🌐 *IP:* `{ip}`
⚠️ *Activity:* `{activity}`
        """
        
        self.send_message(message)

# Global instance
telegram_logger = TelegramLogger()
