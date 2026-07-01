import type { Page } from "playwright";
import { isVisible } from "../isVisible";
import { SELECTORS } from "../selectors";

const ACTION_TIMEOUT = 30_000;

function parseDate(date: string): { day: number; month: number; year: number } {
  const [day, month, year] = date.split("/").map(Number);
  return { day: day!, month: month!, year: year! };
}

function parseDateStamp(year: number, month: number, day: number): number {
  return Math.floor(Number(new Date(year, month - 1, day - 1)));
}

function monthName(month: number): string {
  const names = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return names[month - 1] ?? "";
}

async function navigateCalendarTo(page: Page, month: number, year: number): Promise<void> {
  for (let i = 0; i < 6; i += 1) {
    const monthEl = page.getByText(monthName(month), { exact: true }).first();
    const yearEl = page.getByText(String(year), { exact: true }).first();

    if (await isVisible(monthEl) && await isVisible(yearEl)) {
      return;
    }

    const nextButton = page.locator(SELECTORS.searchForm.calendarNext).filter({ visible: true }).first();
    await nextButton.click();

    await page.waitForTimeout(500);
  }
}

async function clickCalendarDay(page: Page, day: number): Promise<void> {
  const dayLocator = page.locator(`[data-time="${day}"]`);

  if (await isVisible(dayLocator)) {
    await dayLocator.click({ timeout: ACTION_TIMEOUT });
    return;
  }

  throw new Error(`Could not select calendar day ${day}`);
}

export async function selectDates(page: Page, outboundDate: string, returnDate: string): Promise<void> {
  const opened = await isVisible(page.locator(SELECTORS.searchForm.datesTrigger).first(), 3_000);
  if (!opened) {
    throw new Error("Could not open date picker");
  }

  // Click outbound date
  const outbound = parseDate(outboundDate);
  await navigateCalendarTo(page, outbound.month, outbound.year);
  await clickCalendarDay(page, parseDateStamp(outbound.year, outbound.month, outbound.day));

  // Click return date
  const returning = parseDate(returnDate);
  await navigateCalendarTo(page, returning.month, returning.year);
  await clickCalendarDay(page, parseDateStamp(returning.year, returning.month, returning.day));
}
