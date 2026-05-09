# STAGE 1: Builder
FROM python:3.12-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# STAGE 2: Runner
FROM python:3.12-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create user first
RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 --gid 1001 app

# This line ONLY works if "AS builder" is defined above in this same file
COPY --from=builder /root/.local /home/app/.local

ENV PATH=/home/app/.local/bin:$PATH
ENV PYTHONPATH=/home/app/.local/lib/python3.12/site-packages

COPY . .
RUN chown -R app:app /home/app/.local /app

USER app
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${BACKEND_WORKERS:-4}"]
