import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = "https://voice-clinic-sage.vercel.app";
const email = process.env.MEASURE_EMAIL;
const password = process.env.MEASURE_PASSWORD;
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join("scripts", "prod-bench-out", `doc-${stamp}`);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function captureAround(page, fn) {
  const gets = [];
  const bridges = [];
  const onResponse = (response) => {
    const req = response.request();
    if (req.method() !== "GET") return;
    const type = req.resourceType();
    if (type !== "document" && type !== "fetch" && type !== "xhr") return;
    const url = response.url();
    if (!url.startsWith(baseUrl) || url.includes("/_next/")) return;
    gets.push({
      status: response.status(),
      path: url.replace(baseUrl, "").split("?")[0],
      resourceType: type,
    });
  };
  const onConsole = (msg) => {
    const text = msg.text();
    if (text.includes("[mutation-perf-bridge]")) bridges.push(text);
  };
  page.on("response", onResponse);
  page.on("console", onConsole);
  const t0 = performance.now();
  let error = null;
  try {
    await fn();
  } catch (err) {
    error = String(err?.message || err);
  }
  await page.waitForTimeout(3000);
  page.off("response", onResponse);
  page.off("console", onConsole);
  return { wallMs: Math.round(performance.now() - t0), gets, bridges, error };
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await Promise.all([
  page.waitForURL(/\/panel\//, { timeout: 45000 }),
  page.click('button[type="submit"]'),
]);

await page.goto(`${baseUrl}/panel/documents`, { waitUntil: "networkidle" });
const createNet = await captureAround(page, async () => {
  await page.getByRole("button", { name: "Belge Yükle" }).click({ force: true });
  const dialog = page.getByRole("dialog", { name: "Belge Yükle" });
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  await dialog.locator('input[name="title"]').fill(`Perf Doc ${stamp}`);
  await dialog.locator('input[type="file"]').setInputFiles({
    name: `perf-${stamp}.png`,
    mimeType: "image/png",
    buffer: png,
  });
  await dialog.getByRole("button", { name: "Belgeyi Kaydet" }).click();
  await dialog.waitFor({ state: "hidden", timeout: 90000 });
});
console.log("upload", JSON.stringify(createNet, null, 2));

await page.goto(`${baseUrl}/panel/documents`, { waitUntil: "networkidle" });
const deleteNet = await captureAround(page, async () => {
  await page.locator('input[type="search"]').first().fill(`Perf Doc ${stamp}`);
  await page.waitForTimeout(1200);
  const row = page.locator("table tbody tr").filter({ hasText: "Perf Doc" }).first();
  await row.waitFor({ state: "visible", timeout: 20000 });
  await row.getByRole("button", { name: "Sil" }).click();
  await page.getByRole("heading", { name: "Belgeyi Sil" }).waitFor({ state: "visible" });
  await page.locator("button").filter({ hasText: /^Sil$/ }).last().click();
  await page.getByRole("heading", { name: "Belgeyi Sil" }).waitFor({
    state: "hidden",
    timeout: 45000,
  });
});
console.log("delete", JSON.stringify(deleteNet, null, 2));

await writeFile(
  path.join(outDir, "report.json"),
  JSON.stringify({ createNet, deleteNet }, null, 2),
);
await browser.close();
