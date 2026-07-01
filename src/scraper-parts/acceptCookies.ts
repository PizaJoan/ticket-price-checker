import type { Page } from "playwright";
import { SELECTORS } from "../selectors";

const CLICK_TIMEOUT = 4_000;

async function clickFirstVisible(page: Page, selectors: readonly string[]): Promise<boolean> {
  await page.waitForTimeout(3_000);
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await locator.click({ timeout: CLICK_TIMEOUT });
      return true;
    }
  }
  return false;
}

export async function acceptCookies(page: Page): Promise<void> {
  await clickFirstVisible(page, SELECTORS.cookieAccept);
}
