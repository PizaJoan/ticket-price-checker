import { chromium, type Browser, type Locator, type Page } from "playwright";
import { env, envBool } from "./env.ts";
import { appendResults, getScreenshotPath } from "./output.ts";
import { SEARCHES } from "./searches.ts";
import { SELECTORS } from "./selectors.ts";
import type { ScrapeResult, SearchConfig } from "./types.ts";

const BASE_URL = "https://www.balearia.com/es";
const NAVIGATION_TIMEOUT = 60_000;
const ACTION_TIMEOUT = 30_000;

function timestamp(): string {
  return new Date().toISOString();
}

async function clickFirstVisible(page: Page, selectors: readonly string[]): Promise<boolean> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await locator.click({ timeout: ACTION_TIMEOUT });
      return true;
    }
  }
  return false;
}

async function acceptCookies(page: Page): Promise<void> {
  await clickFirstVisible(page, SELECTORS.cookieAccept);
}

async function fillPortByIndex(page: Page, index: number, portName: string): Promise<void> {
  const inputs = page.getByPlaceholder(SELECTORS.portPlaceholder);
  const input = inputs.nth(index);
  await input.waitFor({ state: "visible", timeout: ACTION_TIMEOUT });
  await input.click();
  await input.fill(portName);
  await page.waitForTimeout(800);

  const option = page.getByRole("option", { name: new RegExp(portName, "i") }).first();
  if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await option.click();
    return;
  }

  const fallback = page.locator(`li:has-text("${portName}"), button:has-text("${portName}")`).first();
  if (await fallback.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await fallback.click();
    return;
  }

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
}

function parseDate(date: string): { day: number; month: number; year: number } {
  const [day, month, year] = date.split("/").map(Number);
  return { day: day!, month: month!, year: year! };
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

async function getVisibleMonthLabel(page: Page): Promise<string> {
  const calendarHeader = page.locator('[class*="calendar"], [role="dialog"]').locator("text=/\\w+\\s+\\d{4}/").first();
  if (await calendarHeader.isVisible({ timeout: 2_000 }).catch(() => false)) {
    return (await calendarHeader.innerText()).trim().toLowerCase();
  }
  return "";
}

async function navigateCalendarTo(page: Page, month: number, year: number): Promise<void> {
  const target = `${monthName(month)} ${year}`;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const current = await getVisibleMonthLabel(page);
    if (current.includes(monthName(month)) && current.includes(String(year))) {
      return;
    }
    const moved = await clickFirstVisible(page, SELECTORS.searchForm.calendarNext);
    if (!moved) {
      throw new Error(`Could not navigate calendar to ${target}`);
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`Calendar did not reach ${target}`);
}

async function clickCalendarDay(page: Page, day: number): Promise<void> {
  const dayRegex = new RegExp(`^${day}$`);
  const candidates = [
    page.getByRole("button", { name: dayRegex }),
    page.locator(`[data-day$="-${String(day).padStart(2, "0")}"]`),
    page.locator(`button:has-text("${day}")`),
  ];

  for (const candidate of candidates) {
    const locator = candidate.first();
    if (await locator.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await locator.click({ timeout: ACTION_TIMEOUT });
      return;
    }
  }

  throw new Error(`Could not select calendar day ${day}`);
}

async function selectDates(page: Page, outboundDate: string, returnDate: string): Promise<void> {
  const opened = await clickFirstVisible(page, SELECTORS.searchForm.datesTrigger);
  if (!opened) {
    throw new Error("Could not open date picker");
  }

  await page.waitForTimeout(500);

  const outbound = parseDate(outboundDate);
  await navigateCalendarTo(page, outbound.month, outbound.year);
  await clickCalendarDay(page, outbound.day);
  await page.waitForTimeout(300);

  const returning = parseDate(returnDate);
  await navigateCalendarTo(page, returning.month, returning.year);
  await clickCalendarDay(page, returning.day);

  await clickFirstVisible(page, SELECTORS.searchForm.calendarConfirm);
}

async function setPassengers(page: Page, count: number): Promise<void> {
  const opened = await clickFirstVisible(page, SELECTORS.searchForm.passengersTrigger);
  if (!opened) {
    throw new Error("Could not open passengers selector");
  }

  await page.waitForTimeout(500);

  const adultRow = page.locator(':text("Adulto"), :text("adulto")').first();
  const container = (await adultRow.isVisible({ timeout: 2_000 }).catch(() => false))
    ? adultRow.locator("xpath=ancestor::*[contains(@class,'passenger') or contains(@class,'counter')][1]")
    : page.locator("body");

  for (let current = 1; current < count; current += 1) {
    const plus = container.locator('button:has-text("+"), button[aria-label*="Aumentar"], button[aria-label*="Incrementar"]').first();
    if (!(await plus.isVisible({ timeout: 2_000 }).catch(() => false))) {
      throw new Error("Could not increment passenger count");
    }
    await plus.click();
    await page.waitForTimeout(200);
  }

  await clickFirstVisible(page, SELECTORS.searchForm.calendarConfirm);
}

async function setMotorcycle(page: Page): Promise<void> {
  const opened = await clickFirstVisible(page, SELECTORS.searchForm.vehiclesTrigger);
  if (!opened) {
    throw new Error("Could not open vehicle selector");
  }

  await page.waitForTimeout(500);

  if (!(await clickFirstVisible(page, SELECTORS.vehicle.motorcycle))) {
    throw new Error("Could not select motorcycle vehicle type");
  }

  await clickFirstVisible(page, SELECTORS.vehicle.over50cc);
  await clickFirstVisible(page, [...SELECTORS.searchForm.calendarConfirm, 'button:has-text("Añadir")']);
}

async function submitSearch(page: Page): Promise<void> {
  const clicked = await clickFirstVisible(page, SELECTORS.searchForm.searchButton);
  if (!clicked) {
    throw new Error("Could not click search button");
  }

  await page.waitForLoadState("networkidle", { timeout: NAVIGATION_TIMEOUT }).catch(() => undefined);
  await page.waitForTimeout(3_000);
}

async function enableResident(page: Page): Promise<void> {
  if (await clickFirstVisible(page, SELECTORS.resident)) {
    await page.waitForTimeout(1_500);
    return;
  }

  const residentText = page.getByText("Residente", { exact: false }).first();
  if (await residentText.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await residentText.click({ timeout: ACTION_TIMEOUT });
    await page.waitForTimeout(1_500);
    return;
  }

  throw new Error("Could not enable Residente option");
}

function normalizeTime(value: string): string {
  return value.replace(/\s/g, "").replace(".", ":").slice(0, 5);
}

async function findSailingByTime(page: Page, time: string): Promise<Locator | null> {
  const normalizedTarget = normalizeTime(time);
  const timePattern = new RegExp(`\\b${time.replace(":", "[:.]")}\\b`);

  const rows = page.locator("button, a, tr, li, [role='row'], [class*='sailing'], [class*='trip']").filter({ hasText: timePattern });
  const count = await rows.count();

  for (let i = 0; i < Math.min(count, 40); i += 1) {
    const row = rows.nth(i);
    const text = (await row.innerText().catch(() => "")).replace(/\s+/g, " ");
    const match = text.match(/\b(\d{1,2}[:.]\d{2})\b/);
    if (match && normalizeTime(match[1]!) === normalizedTarget) {
      return row;
    }
  }

  return null;
}

async function selectSailingPair(
  page: Page,
  outboundTime: string,
  returnTime: string,
): Promise<{ outboundFound: boolean; returnFound: boolean }> {
  const outbound = await findSailingByTime(page, outboundTime);
  let outboundFound = false;
  if (outbound) {
    await outbound.click({ timeout: ACTION_TIMEOUT });
    outboundFound = true;
    await page.waitForTimeout(2_000);
  }

  const returnSailing = await findSailingByTime(page, returnTime);
  let returnFound = false;
  if (returnSailing) {
    await returnSailing.click({ timeout: ACTION_TIMEOUT });
    returnFound = true;
    await page.waitForTimeout(2_000);
  }

  return { outboundFound, returnFound };
}

async function extractPrice(page: Page): Promise<{ price: string; currency: string } | null> {
  const totalCandidates = [
    page.getByText(/Total/i),
    page.locator('[class*="total"]'),
    page.locator('[class*="price"]'),
  ];

  for (const candidate of totalCandidates) {
    const locator = candidate.last();
    if (await locator.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const text = await locator.innerText();
      const match = text.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(€|EUR)?/i);
      if (match) {
        return { price: match[1]!, currency: match[2] ?? "€" };
      }
    }
  }

  const bodyText = await page.locator("body").innerText();
  const matches = [...bodyText.matchAll(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(€|EUR)/gi)];
  if (matches.length === 0) {
    return null;
  }

  const last = matches[matches.length - 1]!;
  return {
    price: last[1]!,
    currency: last[2] ?? "€",
  };
}

async function fillSearchForm(page: Page, search: SearchConfig): Promise<void> {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT });
  await acceptCookies(page);
  await page.waitForTimeout(1_000);

  await fillPortByIndex(page, 0, search.origin);
  await fillPortByIndex(page, 1, search.destination);
  await selectDates(page, search.outboundDate, search.returnDate);
  await setPassengers(page, search.passengers);
  await setMotorcycle(page);
  await submitSearch(page);
}

async function scrapeSearch(page: Page, search: SearchConfig): Promise<ScrapeResult> {
  const baseResult: ScrapeResult = {
    searchId: search.id,
    label: search.label,
    status: "error",
    timestamp: timestamp(),
  };

  try {
    await fillSearchForm(page, search);

    if (search.resident) {
      await enableResident(page);
    }

    const { outboundFound, returnFound } = await selectSailingPair(
      page,
      search.targetSailings.outboundTime,
      search.targetSailings.returnTime,
    );

    if (!outboundFound || !returnFound) {
      const screenshotPath = getScreenshotPath(search.id);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        ...baseResult,
        status: "sailing_not_found",
        outboundTime: outboundFound ? search.targetSailings.outboundTime : undefined,
        returnTime: returnFound ? search.targetSailings.returnTime : undefined,
        message: `Missing sailings: outbound ${outboundFound ? "found" : "not found"}, return ${returnFound ? "found" : "not found"}`,
        screenshotPath,
      };
    }

    const priceData = await extractPrice(page);
    if (!priceData) {
      const screenshotPath = getScreenshotPath(search.id);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        ...baseResult,
        status: "error",
        outboundTime: search.targetSailings.outboundTime,
        returnTime: search.targetSailings.returnTime,
        message: "Sailings selected but price could not be extracted",
        screenshotPath,
      };
    }

    return {
      ...baseResult,
      status: "success",
      outboundTime: search.targetSailings.outboundTime,
      returnTime: search.targetSailings.returnTime,
      price: priceData.price,
      currency: priceData.currency,
    };
  } catch (error) {
    const screenshotPath = getScreenshotPath(search.id);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);

    return {
      ...baseResult,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      screenshotPath,
    };
  }
}

export async function runScraper(browser?: Browser): Promise<ScrapeResult[]> {
  const ownsBrowser = !browser;
  const activeBrowser =
    browser ??
    (await chromium.launch({
      headless: envBool("HEADLESS", true),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    }));

  const context = await activeBrowser.newContext({
    locale: "es-ES",
    timezoneId: env("TZ", "Europe/Madrid"),
    viewport: { width: 1440, height: 1200 },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(ACTION_TIMEOUT);

  const results: ScrapeResult[] = [];

  try {
    for (const search of SEARCHES) {
      console.log(`Running search: ${search.label}`);
      const result = await scrapeSearch(page, search);
      results.push(result);
      console.log(`Result: ${result.status}${result.price ? ` - ${result.price} ${result.currency}` : ""}`);
    }
  } finally {
    await context.close();
    if (ownsBrowser) {
      await activeBrowser.close();
    }
  }

  await appendResults(results);
  return results;
}

if (import.meta.main) {
  runScraper()
    .then((results) => {
      const failures = results.filter((result) => result.status !== "success");
      if (failures.length > 0) {
        console.error(`Completed with ${failures.length} non-success result(s).`);
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
