import type { ScrapeResult } from "./types.ts";

const PRICES_FILE = `${import.meta.dir}/../data/prices.txt`;
const SCREENSHOTS_DIR = `${import.meta.dir}/../data/screenshots`;

export async function ensureDataDirs(): Promise<void> {
  await Bun.write(`${SCREENSHOTS_DIR}/.gitkeep`, "", { createPath: true });
}

export function getScreenshotPath(searchId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${SCREENSHOTS_DIR}/${searchId}-${timestamp}.png`;
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
  await appendResults([result]);
}

export async function appendResults(results: ScrapeResult[]): Promise<void> {
  if (results.length === 0) return;

  await ensureDataDirs();

  const file = Bun.file(PRICES_FILE);
  const existing = (await file.exists()) ? await file.text() : "";
  const blocks = results.map((result) => `${formatResult(result)}\n\n`).join("");

  await Bun.write(PRICES_FILE, existing + blocks, { createPath: true });
}
