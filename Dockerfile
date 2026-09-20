FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=7860

# Set working directory
WORKDIR /app

# Install system dependencies needed for image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Ensure storage directories exist with write permissions
RUN mkdir -p uploads results && chmod -R 777 uploads results

# Expose port (7860 for Hugging Face Spaces, or dynamic $PORT on Render/Railway)
EXPOSE 7860

# Run production server
CMD ["sh", "-c", "gunicorn --workers 1 --threads 4 --timeout 180 --bind 0.0.0.0:${PORT:-7860} app:app"]
