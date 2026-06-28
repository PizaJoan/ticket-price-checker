.PHONY: start dev install bash sh

COMPOSE := docker compose
SERVICE := scraper

start:
	$(COMPOSE) build

dev:
	$(COMPOSE) run --rm $(SERVICE) bun run scrape

install:
	$(COMPOSE) run --rm $(SERVICE) bun install

bash:
	$(COMPOSE) run --rm $(SERVICE) bash