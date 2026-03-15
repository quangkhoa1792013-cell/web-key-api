# Neon Database Setup for KhoaDz Key System

## 1. Setup Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project
3. Get connection string from Dashboard
4. Set environment variable: `NEON_DATABASE_URL`

## 2. Deploy Schema

Run the schema file to create tables and functions:

```bash
psql $NEON_DATABASE_URL -f neon_schema.sql
```

## 3. Update Backend

Replace `service.py` with `neon_service.py`:

```bash
# Install new requirements
pip install -r requirements_neon.txt

# Run new service
python neon_service.py
```

## 4. Environment Variables

Set these in PythonAnywhere dashboard:

```
NEON_DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

## 5. Key Features

### Database Schema
- `user_sessions` table stores all key data
- Automatic cleanup of expired keys
- HWID binding for security
- IP and cookie tracking

### API Endpoints
- `POST /api/create-key` - Create new key
- `POST /api/validate-key` - Validate and bind key to HWID
- `POST /api/heartbeat` - Script heartbeat check
- `GET /api/key-info/<key>` - Get key information
- `POST /api/cleanup` - Manual cleanup expired keys

### Security Features
- Keys automatically expire based on `expire_ts`
- HWID binding prevents key sharing
- Heartbeat system for real-time validation
- Automatic cleanup of expired data

## 6. Integration

### Frontend Integration
- Frontend already updated with new URL structure
- Key format: `KHOA-{hours}-{25 random chars}`
- Automatic redirect to expired page

### Roblox Script Integration
- Heartbeat every 60 seconds
- Auto-destroy when key expires
- HWID generation and validation
- Network retry logic

## 7. Migration Steps

1. **Backup existing data**:
   ```bash
   cp khoadz_database.json khoadz_database_backup.json
   ```

2. **Deploy Neon schema**:
   ```bash
   psql $NEON_DATABASE_URL -f neon_schema.sql
   ```

3. **Update backend**:
   ```bash
   # On PythonAnywhere
   pip install -r requirements_neon.txt
   # Upload neon_service.py
   # Update WSGI configuration
   ```

4. **Test endpoints**:
   ```bash
   curl -X POST https://khoablabla.pythonanywhere.com/api/health
   ```

## 8. Monitoring

### Health Check
```bash
curl https://khoablabla.pythonanywhere.com/api/health
```

### Cleanup Stats
```bash
curl -X POST https://khoablabla.pythonanywhere.com/api/cleanup
```

## 9. URL Structure (Unchanged)

Frontend URLs remain the same:
- `123.com/` - Service selection
- `123.com/{service}/{randomId}` - Time selection & link skip
- `123.com/key/{service}/{randomId}` - Key display

Only backend logic changes to use Neon instead of JSON files.

## 10. Security Notes

- All sensitive data stored in Neon (encrypted)
- No local file storage for keys
- Automatic cleanup prevents data buildup
- HWID prevents key sharing
- Heartbeat ensures real-time validation
