# Test Logging Output Format

# Test with current logging functions
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask_app import log_info, log_error, log_recon, log_radar

print("=== TESTING LOGGING FORMATS ===\n")

# Test INFO (success messages)
log_info("✅ Database connection successful!")
log_info("✅ Tables initialized successfully")
log_info("✅ Auto-generated key: KHOA-ABC123 for service: lootlab")
log_info("✅ Key found: KHOA-ABC123")
log_info("✅ Reconnected successfully, retrying query...")

print("\n")

# Test ERROR (actual errors)
log_error("❌ DATABASE CONNECTION ERROR: connection failed")
log_error("❌ Failed to create tables: table does not exist")
log_error("❌ Query error: column does not exist")
log_error("❌ Failed to reconnect after InterfaceError")

print("\n")

# Test RECON (reconnaissance logs)
log_recon("[RECON] | IP: 192.168.1.100 | HWID: HWID_ABC123 | ACTION: CHECK_KEY | SERVICE: lootlab | URL: https://example.com")
log_recon("[RECON] | IP: 192.168.1.100 | HWID: HWID_ABC123 | ACTION: MARK_SESSION | SERVICE: lootlab | URL: https://example.com")
log_recon("[RECON] | IP: 192.168.1.100 | ACTION: MARKED_SUCCESS | TOKEN: 12345 | TARGET_URL: https://lootlab.com")

print("\n")

# Test RADAR (request tracking)
log_radar("[RADAR] GET | /api/check-key-status | HWID: HWID_ABC123 | IP: 192.168.1.100")
log_radar("[RADAR] POST | /api/mark-session | HWID: HWID_ABC123 | IP: 192.168.1.100")
log_radar("[RADAR] ✅ Updated HWID for pending sessions: HWID_ABC123")
log_radar("[RADAR] Deleting session 12345")
log_radar("[RADAR] Session deleted successfully: 12345")

print("\n=== END OF TEST ===")
