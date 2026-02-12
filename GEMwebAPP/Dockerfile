FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN groupadd --system appgroup && useradd --system --group appgroup appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--capture-output", "--log-level", "debug", "main:app"]