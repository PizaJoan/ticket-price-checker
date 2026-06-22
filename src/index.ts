import { Cron } from "croner";
import { env } from "./env.ts";
import { runScraper } from "./scraper.ts";

const DEFAULT_CRON = "0 8 * * *";
const cronSchedule = env("CRON_SCHEDULE", DEFAULT_CRON);
const runOnStart = env("RUN_ON_START") === "true";

async function executeJob(trigger: string): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting scraper (${trigger})`);
  try {
    const results = await runScraper();
    const failures = results.filter((result) => result.status !== "success");
    console.log(`[${new Date().toISOString()}] Scraper finished. Failures: ${failures.length}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Scraper failed:`, error);
  }
}

console.log(`Ticket price checker started. Schedule: ${cronSchedule} (${env("TZ", "system timezone")})`);

if (runOnStart) {
  void executeJob("startup");
}

new Cron(cronSchedule, () => {
  void executeJob("cron");
});
