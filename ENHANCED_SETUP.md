# Enhanced Backend Setup Guide

## 1. Environment Variables (PythonAnywhere)

Set these in your PythonAnywhere dashboard:

```bash
# Neon Database
NEON_DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## 2. Install Dependencies

```bash
pip install psycopg2-binary flask flask-cors requests python-dotenv
```

## 3. Deploy Enhanced Backend

Replace `service.py` with `service_enhanced.py`:

```bash
# Upload service_enhanced.py to PythonAnywhere
# Update WSGI configuration to use service_enhanced
```

## 4. Frontend Integration

### Add Anti-Cheat Provider

Wrap your App with AntiCheatProvider:

```jsx
import AntiCheatProvider from './components/AntiCheatProvider';

function App() {
  return (
    <AntiCheatProvider>
      <Router>
        <Routes>
          {/* your routes */}
        </Routes>
      </Router>
    </AntiCheatProvider>
  );
}
```

### Update KeyDashboard

KeyDashboard already updated with:
- ✅ `setInterval` every 1 second
- ✅ `Math.floor(Date.now() / 1000)` comparison
- ✅ `navigate('/expired', { replace: true })`
- ✅ Windows-compatible paths with forward slashes
- ✅ `import.meta.env.VITE_API_BASE_URL`

## 5. New Features

### Anti-Cheat System
- **Time Detection**: Client vs Server time comparison
- **Tolerance**: 5 minutes allowed drift
- **Action**: Instant redirect to `/expired` page
- **Logging**: Suspicious activity logged to Telegram

### Telegram Logging
- **Key Creation**: Logs every new key with IP, HWID, User Agent
- **Key Expiration**: Logs when keys expire
- **Suspicious Activity**: Logs time manipulation attempts
- **Format**: Rich Markdown with emojis

### Enhanced Security
- **HWID Binding**: Keys locked to specific devices
- **Session Tracking**: Random ID validation
- **IP Logging**: Track user IP addresses
- **User Agent**: Browser fingerprinting

## 6. API Endpoints

### New Endpoints
- `POST /api/anti-cheat-check` - Time validation
- `GET /api/session-check/<randomId>` - Session validation

### Enhanced Endpoints
- `GET /verify` - Now logs to Neon + Telegram
- `POST /api/create-key` - Now logs to Telegram

### Backward Compatibility
- All existing endpoints still work
- JSON file support maintained as fallback

## 7. Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    hwid VARCHAR(255),
    ip INET,
    user_agent TEXT,
    cookies TEXT,
    token VARCHAR(255),
    expire_ts BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 8. Testing

### Test Anti-Cheat
```javascript
// In browser console
// Change system time and try to use app
// Should redirect to /expired page
```

### Test Telegram
```bash
# Create a key and check Telegram
curl -X POST https://your-domain.com/api/create-key \
  -H "Content-Type: application/json" \
  -d '{"duration": 3600, "service": "test"}'
```

### Test Session Check
```bash
# Check session validity
curl https://your-domain.com/api/session-check/random123
```

## 9. Monitoring

### Health Check
```bash
curl https://your-domain.com/api/health
```

### Cleanup Expired Keys
```bash
curl -X POST https://your-domain.com/api/cleanup
```

## 10. Security Notes

### Time Manipulation Protection
- Server validates client time every 30s
- 5-minute tolerance for clock skew
- Instant ban on detection

### Telegram Integration
- All sensitive actions logged
- Real-time notifications
- IP and HWID tracking

### Database Security
- All data in Neon (encrypted)
- No local file storage
- Automatic cleanup

## 11. Deployment Checklist

- [ ] Set Neon database URL
- [ ] Set Telegram credentials (optional)
- [ ] Upload enhanced service.py
- [ ] Update frontend with AntiCheatProvider
- [ ] Test all endpoints
- [ ] Verify Telegram notifications
- [ ] Test anti-cheat functionality

## 12. Troubleshooting

### Common Issues
1. **Database Connection**: Check NEON_DATABASE_URL
2. **Telegram Not Working**: Verify bot token and chat ID
3. **Anti-Cheat False Positives**: Check server time sync
4. **Key Creation Fails**: Check Neon database permissions

### Debug Mode
Set environment variable:
```bash
DEBUG=true
```

This enables detailed logging for troubleshooting.
