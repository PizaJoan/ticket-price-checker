import type { Page } from "playwright";

const ACTION_TIMEOUT = 30_000;
const CLOUDFLARE_CHALLENGE_TIMEOUT = 60_000;

async function isSiteReady(page: Page): Promise<boolean> {
  return page
    .getByText(/Selecciona fechas|Buscar/i)
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);
}

async function clickTurnstileWidget(page: Page): Promise<boolean> {
  const frame = page.frameLocator('iframe[src*="challenges.cloudflare.com"]').first();
  const clickTargets = [
    frame.locator('input[type="checkbox"]'),
    frame.locator("label"),
    frame.locator('[role="checkbox"]'),
    frame.locator("body"),
  ];

  for (const target of clickTargets) {
    const locator = target.first();
    if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
      await locator.click({ force: true, timeout: ACTION_TIMEOUT }).catch(() => undefined);
      return true;
    }
  }

  return false;
}

export async function passCloudflareVerification(page: Page): Promise<void> {
  const deadline = Date.now() + CLOUDFLARE_CHALLENGE_TIMEOUT;

  while (Date.now() < deadline) {
    if (await isSiteReady(page)) {
      return;
    }

    await clickTurnstileWidget(page);
    await page.waitForTimeout(1_500);
  }

  throw new Error("Cloudflare human verification did not complete in time");
}
