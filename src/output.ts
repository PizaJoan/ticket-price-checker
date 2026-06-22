import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ScrapeResult } from "./types.ts";

const DATA_DIR = join(import.meta.dir, "..", "data");
const PRICES_FILE = join(DATA_DIR, "prices.txt");
const SCREENSHOTS_DIR = join(DATA_DIR, "screenshots");

export async function ensureDataDirs(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
}

export function getScreenshotPath(searchId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return join(SCREENSHOTS_DIR, `${searchId}-${timestamp}.png`);
}

function formatResult(result: ScrapeResult): string {
  const lines = [
    `[${result.timestamp}] ${result.label} (${result.searchId})`,
    `  Status: ${result.status}`,
  ];

  if (result.outboundTime && result.returnTime) {
    lines.push(`  Sailings: ${result.outboundTime} outbound, ${result.returnTime} return`);
  }

  if (result.price) {
    lines.push(`  Price: ${result.price}${result.currency ? ` ${result.currency}` : ""}`);
  }

  if (result.message) {
    lines.push(`  Message: ${result.message}`);
  }

  if (result.screenshotPath) {
    lines.push(`  Screenshot: ${result.screenshotPath}`);
  }

  return lines.join("\n");
}

export async function appendResult(result: ScrapeResult): Promise<void> {
  await ensureDataDirs();
  const block = `${formatResult(result)}\n\n`;
  await appendFile(PRICES_FILE, block, "utf8");
}

export async function appendResults(results: ScrapeResult[]): Promise<void> {
  for (const result of results) {
    await appendResult(result);
  }
}
