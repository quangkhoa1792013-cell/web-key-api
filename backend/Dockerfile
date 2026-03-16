FROM python:3.11-slim

# Tạo user để bảo mật theo quy định của HF
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy code vào server
COPY --chown=user . .

# Cài đặt thư viện
RUN pip install --no-cache-dir -r requirements.txt

# Chạy bằng Gunicorn (Chuẩn server chuyên nghiệp)
# Lưu ý: backend.flask_app:app có nghĩa là file flask_app.py nằm trong folder backend
# Nếu bạn đã ở TRONG folder backend rồi thì đổi thành flask_app:app
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "flask_app:app"]