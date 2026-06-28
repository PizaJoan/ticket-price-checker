import { env, envBool } from "./env.ts";
import { runScraper } from "./scraper.ts";

const DEFAULT_CRON = "0 8 * * *";
const cronSchedule = env("CRON_SCHEDULE", DEFAULT_CRON) ?? DEFAULT_CRON;
const runOnStart = envBool("RUN_ON_START");

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

console.log(
  `Ticket price checker started. Schedule: ${cronSchedule} (UTC; TZ=${env("TZ", "system")} for scraper runtime)`,
);

if (runOnStart) {
  void executeJob("startup");
}

Bun.cron(cronSchedule, async () => {
  await executeJob("cron");
});
