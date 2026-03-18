FROM python:3.12-slim

WORKDIR /app

# Install system deps for Playwright Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    fonts-liberation fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium browser
RUN playwright install chromium

# Copy application code (includes app/ and templates/)
COPY app/ ./app/

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

# Run with uvicorn
# --timeout-keep-alive 120: prevent dropping connections during long uploads
# --log-level info: surface timing logs from upload path
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--timeout-keep-alive", "120", "--log-level", "info"]
