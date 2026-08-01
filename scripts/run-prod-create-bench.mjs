import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = "https://voice-clinic-sage.vercel.app";
const email = process.env.MEASURE_EMAIL;
const password = process.env.MEASURE_PASSWORD;
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join("scripts", "prod-bench-out", `create-${stamp}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const bridges = [];
page.on("console", (msg) => {
  const text = msg.text();
  if (text.includes("[mutation-perf-bridge]") || text.includes("[mutation-bench-id]")) {
    bridges.push(text);
  }
});

await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await Promise.all([
  page.waitForURL(/\/panel\//, { timeout: 45000 }),
  page.click('button[type="submit"]'),
]);

await page.goto(`${baseUrl}/panel/transactions/new`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('input[name="patient_name"]');
await page.evaluate(() => {
  const form = document.querySelector("form");
  if (!form) return;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "measure_return";
  input.value = "1";
  form.appendChild(input);
});

const t0 = performance.now();
await page.fill('input[name="patient_name"]', `Perf Bench ${stamp}`);
await page.fill('input[name="operation_description"]', "Perf bench işlem");
await page.fill('input[name="sale_amount"]', "1000");
const firstAmt = page.locator('input[name="first_payment_amount"]');
if (await firstAmt.count()) {
  await firstAmt.fill("100");
  const method = page.locator('select[name="first_payment_method"]');
  if (await method.count()) await method.selectOption("cash");
}
await page.getByRole("button", { name: "İşlemi Kaydet" }).click();
await page.waitForTimeout(5000);
const wallMs = Math.round(performance.now() - t0);

const report = { wallMs, bridges, url: page.url() };
console.log(JSON.stringify(report, null, 2));
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));

// cleanup created txn if we got an id
const idLine = bridges.find((b) => b.includes("[mutation-bench-id]"));
const id = idLine?.split(" ").pop();
if (id) {
  await page.goto(`${baseUrl}/panel/transactions?search=${encodeURIComponent(`Perf Bench ${stamp}`)}`, {
    waitUntil: "networkidle",
  });
  const row = page.locator("table tbody tr").filter({ hasText: "Perf Bench" }).first();
  if (await row.count()) {
    await row.getByRole("button", { name: "Sil" }).click();
    await page.getByRole("heading", { name: "İşlemi Sil" }).waitFor({ state: "visible" });
    await page.locator("button").filter({ hasText: /^Sil$/ }).last().click();
    await page.waitForTimeout(2000);
    console.log("cleaned", id);
  }
}

await browser.close();
