import sys
import os

# Set DATABASE_URL cho PythonAnywhere
os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_yXhAo4sZaKb5@ep-patient-pond-a1virzy2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

# add your project directory to sys.path
project_home = '/home/khoablabla/web-key-api/backend'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# import flask app but need to call it "application" for WSGI to work
from flask_app import app as application  # noqa

# Log để debug
print("[WSGI] 🚀 WSGI Configuration loaded")
print(f"[WSGI] 📁 Project path: {project_home}")
print(f"[WSGI] 🗄️ DATABASE_URL set: {'Yes' if os.environ.get('DATABASE_URL') else 'No'}")
print("[WSGI] ✅ Ready to serve Flask application")
