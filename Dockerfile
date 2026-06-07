FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy all files
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Set working directory to backend for the app
WORKDIR /app/backend

# Environment variables
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

EXPOSE 5000

# Run with gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000"]
