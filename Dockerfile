FROM oven/bun:1.2.18-debian

WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN bun install

RUN bunx playwright install --with-deps chromium

COPY tsconfig.json ./
COPY src ./src

RUN mkdir -p /app/data/screenshots

ENV TZ=Europe/Madrid
ENV HEADLESS=true
ENV CRON_SCHEDULE="0 8 * * *"
ENV RUN_ON_START=false

CMD ["bun", "run", "start"]
