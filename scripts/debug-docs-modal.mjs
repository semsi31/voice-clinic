import { chromium } from "playwright";

const email = process.env.MEASURE_EMAIL;
const password = process.env.MEASURE_PASSWORD;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto("https://voice-clinic-sage.vercel.app/login", {
  waitUntil: "domcontentloaded",
});
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await Promise.all([
  page.waitForURL(/\/panel\//, { timeout: 45000 }),
  page.click('button[type="submit"]'),
]);
await page.goto("https://voice-clinic-sage.vercel.app/panel/documents", {
  waitUntil: "networkidle",
});
const buttons = await page.getByRole("button").allTextContents();
console.log(
  "buttons",
  buttons.filter((t) => /Belge|Yükle|Ekle|Sil/i.test(t)),
);
const belgeler = page.getByRole("button", { name: "Belge Yükle" });
console.log("count", await belgeler.count());
await belgeler.first().click({ force: true });
await page.waitForTimeout(1500);
console.log("dialog", await page.getByRole("dialog").count());
console.log(
  "dialog text",
  await page
    .getByRole("dialog")
    .first()
    .textContent()
    .catch(() => null),
);
console.log("title inputs", await page.locator('input[name="title"]').count());
await page.screenshot({
  path: "scripts/prod-bench-out/docs-debug.png",
  fullPage: true,
});
await browser.close();
