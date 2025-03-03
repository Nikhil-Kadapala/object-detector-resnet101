# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.12.9
FROM python:${PYTHON_VERSION}-slim AS base

# Prevents Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Set working directory
WORKDIR /app

# Create a non-privileged user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Install system dependencies required for PyTorch & PIL
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libjpeg-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies with caching
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# Copy the source code and model files into the container
COPY . .

# Create and ensure correct permissions on upload directory
RUN mkdir -p /app/tmp && chown -R appuser:appuser /app/tmp

# Switch to non-privileged user
USER appuser

# Expose the port
EXPOSE 5000

# Command to run the application with gunicorn for better performance
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
