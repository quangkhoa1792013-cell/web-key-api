FROM python:3.11-slim

# Cài đặt thư viện hệ thống cho psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Tạo user để bảo mật theo quy định của HF
RUN useradd -m -u 1000 user

ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy code vào server
COPY --chown=user . .

# Cài đặt thư viện Python
RUN pip install --no-cache-dir -r requirements.txt

# Chuyển sang user thường
USER user

# Chạy bằng Gunicorn (Chuẩn server chuyên nghiệp)
# Lưu ý: backend.flask_app:app có nghĩa là file flask_app.py nằm trong folder backend
# Nếu bạn đã ở TRONG folder backend rồi thì đổi thành flask_app:app
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "flask_app:app"]