# Hugging Face Deployment Commands

## Push to Hugging Face Spaces

### Method 1: Using Git (Recommended)
```bash
# Add Hugging Face remote
git remote add huggingface https://huggingface.co/spaces/your-username/your-space-name

# Push to Hugging Face
git push hugging-face hugging-face-deploy:main
```

### Method 2: Using Hugging Face CLI
```bash
# Install huggingface_hub if not installed
pip install huggingface_hub

# Login to Hugging Face
huggingface-cli login

# Push to Spaces
huggingface-cli upload your-space-name .
```

### Method 3: Direct Git with HF Token
```bash
# Set HF token
git remote set-url huggingface https://user:hf_xxx@huggingface.co/spaces/your-username/your-space-name

# Push
git push huggingface hugging-face-deploy:main
```

## Important Notes

1. **Branch**: Use `hugging-face-deploy` branch (no secrets)
2. **Environment Variables**: Set `DATABASE_URL` in Hugging Face Space settings
3. **Requirements**: Ensure `requirements.txt` contains all dependencies
4. **Logging**: All logs now go to console (Docker compatible)

## Files Fixed for Hugging Face

✅ **flask_app.py**: 
- Removed `/home/khoablabla2013/` hardcoded paths
- Changed logging to console output (sys.stdout)
- Uses environment variable DATABASE_URL

✅ **key/taokey.py**:
- Added `load_conf()` function with relative paths
- Uses `key/setting.json` and `key/khoadz_database.json`
- No more absolute paths

✅ **requirements.txt**:
- Contains: flask, flask-cors, psycopg2-binary, python-dotenv, requests, gunicorn

## Deployment Steps

1. Create Hugging Face Space
2. Set DATABASE_URL environment variable
3. Push using one of the methods above
4. Space will auto-build and deploy
