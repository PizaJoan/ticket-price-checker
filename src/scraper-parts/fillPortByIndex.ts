import type { Page } from "playwright";
import { SELECTORS } from "../selectors";

export async function fillPortByIndex(
  page: Page,
  index: number,
  portName: string,
  escapedPortName: string,
): Promise<void> {
  const dropdownTrigger = page.locator(SELECTORS.port.dropdownTrigger[index]);
  const port = page.locator(`[data-${index === 0 ? "origin" : "destination"}="${escapedPortName}"]`);

  await dropdownTrigger.click();
  await port.click();

  await page.waitForTimeout(1_000);
}
