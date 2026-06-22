# Ticket Price Checker

Dockerized Baleària price scraper. Checks two Alcúdia ↔ Ciutadella round trips (2 residents + 1 motorcycle >50cc) and records the price for the 08:30 / 20:00 sailings.

Runs daily at **08:00** (configurable via `TZ` and `CRON_SCHEDULE`).

## Quick start

```bash
cp .env.example .env
docker compose build
docker compose up -d scheduler          # daily schedule
docker compose --profile manual run --rm scrape   # run once now
```

## Output

- Prices: `data/prices.txt`
- Failure screenshots: `data/screenshots/`

## Config

Edit searches in `src/searches.ts`. Environment variables are documented in `.env.example`.

## Portainer

Deploy `docker-compose.yml` as a stack and mount `./data` for persistent output.
