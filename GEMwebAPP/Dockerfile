# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Create a non-root user and group
RUN groupadd --system appgroup && useradd --system --group appgroup appuser

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY --chown=appuser:appgroup . .

# Switch to the non-root user
USER appuser

# Command to run the app using Gunicorn with Uvicorn workers.
# Cloud Run provides the port via the PORT env var. Gunicorn will use it automatically.
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "main:app"]