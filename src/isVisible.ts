import type { Locator } from "playwright";

export async function isVisible(locator: Locator, timeout: number = 2_000): Promise<boolean> {
  return await locator.isVisible({ timeout }).catch(() => false);
}
