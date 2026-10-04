# RiskLens API. Build from the repository root (it needs ai_phase*/ and zk/):
#   docker build -f backend/Dockerfile -t risklens-api .
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Barretenberg CLI, used to verify identity proofs. Must match the bb.js
# version the frontend proves with (risklens-frontend/package.json).
ARG BB_VERSION=5.0.0-nightly.20260522
ARG BB_SHA256=d207ec90fbfa2fba24d7a47b7a75892ee052b7984252b866a4a0c1b5296e1571
RUN curl -fsSL -o /tmp/bb.tar.gz \
        "https://github.com/AztecProtocol/barretenberg/releases/download/v${BB_VERSION}/barretenberg-amd64-linux.tar.gz" \
    && echo "${BB_SHA256}  /tmp/bb.tar.gz" | sha256sum -c - \
    && tar xzf /tmp/bb.tar.gz -C /usr/local/bin bb \
    && rm /tmp/bb.tar.gz \
    && bb --version

WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install -r backend/requirements.txt

COPY ai_phase1 ai_phase1
COPY ai_phase2 ai_phase2
COPY ai_phase3 ai_phase3
COPY zk/risklens_kyc_circuit/vk zk/risklens_kyc_circuit/vk
COPY backend backend

# Run as a non-root user; the market-data cache lives in ai_phase2/.cache
RUN useradd --create-home app \
    && mkdir -p ai_phase2/.cache \
    && chown -R app:app /app
USER app

WORKDIR /app/backend
EXPOSE 8000
# Render sets $PORT. Trust its proxy headers so rate limiting sees client IPs.
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
