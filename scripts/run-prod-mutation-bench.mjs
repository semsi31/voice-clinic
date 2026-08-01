/**
 * Production mutation bench for the 5 critical panel actions.
 * Captures client wall, post-action GETs, and [mutation-perf-bridge] console lines.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.PROD_BASE_URL || "https://voice-clinic-sage.vercel.app").replace(
  /\/$/,
  "",
);
const email = process.env.MEASURE_EMAIL;
const password = process.env.MEASURE_PASSWORD;
if (!email || !password) {
  console.error("Set MEASURE_EMAIL and MEASURE_PASSWORD");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join("scripts", "prod-bench-out", stamp);

function classifyGet(url) {
  return url.replace(baseUrl, "").split("?")[0] || "/";
}

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
    gets.push({ status: response.status(), path: classifyGet(url), resourceType: type });
  };
  const onConsole = (msg) => {
    const text = msg.text();
    if (
      text.includes("[mutation-perf-bridge]") ||
      text.includes("[mutation-client-perf]") ||
      text.includes("[mutation-perf]")
    ) {
      bridges.push(text);
    }
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
  return {
    wallMs: Math.round(performance.now() - t0),
    gets,
    bridges,
    error,
    urlAfter: page.url(),
  };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(25000);
  const report = { baseUrl, email, startedAt: new Date().toISOString(), steps: [] };

  console.log("login...");
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL(/\/panel\//, { timeout: 45000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("ok", page.url());

  // 1 create
  {
    await page.goto(`${baseUrl}/panel/transactions/new`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[name="patient_name"]');
    const net = await captureAround(page, async () => {
      await page.fill('input[name="patient_name"]', `Perf Bench ${stamp}`);
      await page.fill('input[name="operation_description"]', "Perf bench işlem");
      await page.fill('input[name="sale_amount"]', "1000");
      const firstAmt = page.locator('input[name="first_payment_amount"]');
      if (await firstAmt.count()) {
        await firstAmt.fill("100");
        const method = page.locator('select[name="first_payment_method"]');
        if (await method.count()) await method.selectOption("cash");
      }
      await Promise.all([
        page.waitForURL(/\/panel\/transactions\/[0-9a-f-]{36}/i, { timeout: 90000 }),
        page.getByRole("button", { name: "İşlemi Kaydet" }).click(),
      ]);
    });
    const transactionId = page.url().split("/").filter(Boolean).pop();
    report.transactionId = transactionId;
    report.steps.push({ action: "createPatientTransaction", ...net, transactionId });
    console.log("1 create", net.wallMs, JSON.stringify(net.gets.map((g) => g.path)), net.error || transactionId);
  }

  const transactionId = report.transactionId;
  if (!transactionId) throw new Error("missing transaction id");

  // 2 payment
  {
    await page.goto(`${baseUrl}/panel/transactions/${transactionId}`, {
      waitUntil: "domcontentloaded",
    });
    const net = await captureAround(page, async () => {
      await page.getByRole("button", { name: /Ödemeler|Ödeme/ }).first().click();
      await page.getByRole("button", { name: "Yeni Ödeme Ekle" }).click();
      await page.locator('select[name="payment_method"]').waitFor({ state: "visible" });
      await page.locator('select[name="payment_method"]').selectOption("cash");
      await page.locator('input[name="amount"]').fill("50");
      await page.getByRole("button", { name: "Ödeme Ekle", exact: true }).click();
      await page.locator('select[name="payment_method"]').waitFor({ state: "hidden", timeout: 45000 });
    });
    report.steps.push({ action: "addTransactionPayment", ...net });
    console.log("2 payment", net.wallMs, net.bridges, net.error || "ok");
  }

  // 3 delivery
  {
    await page.goto(`${baseUrl}/panel/transactions/${transactionId}`, {
      waitUntil: "domcontentloaded",
    });
    const net = await captureAround(page, async () => {
      const deliveredBtn = page.getByRole("button", { name: "Teslim Edildi Olarak İşaretle" });
      const pendingBtn = page.getByRole("button", { name: "Teslim Edilmedi Olarak İşaretle" });
      await deliveredBtn.waitFor({ state: "visible" });
      if (await deliveredBtn.isEnabled()) {
        await deliveredBtn.click();
      } else {
        await pendingBtn.click();
        await page.waitForTimeout(1500);
        await deliveredBtn.click();
      }
      await page.waitForTimeout(1500);
    });
    report.steps.push({ action: "updateDeviceDeliveryStatus", ...net });
    console.log("3 delivery", net.wallMs, net.bridges, net.error || "ok");
  }

  // 4 delete txn
  {
    const searchUrl = `${baseUrl}/panel/transactions?search=${encodeURIComponent(`Perf Bench ${stamp}`)}`;
    await page.goto(searchUrl, { waitUntil: "networkidle" });
    const net = await captureAround(page, async () => {
      // Prefer desktop table row (visible at 1440px)
      const tableRow = page.locator("table tbody tr").filter({ hasText: "Perf Bench" }).first();
      if (await tableRow.count()) {
        await tableRow.getByRole("button", { name: "Sil" }).click();
      } else {
        await page.getByRole("button", { name: "Sil" }).first().click({ force: true });
      }
      await page.getByRole("heading", { name: "İşlemi Sil" }).waitFor({ state: "visible" });
      await page.locator("button").filter({ hasText: /^Sil$/ }).last().click();
      await page.getByRole("heading", { name: "İşlemi Sil" }).waitFor({ state: "hidden", timeout: 45000 });
    });
    report.steps.push({ action: "deletePatientTransaction", ...net });
    console.log("4 delete txn", net.wallMs, net.bridges, net.error || "ok");
  }

  // 5 document
  {
    await page.goto(`${baseUrl}/panel/documents`, { waitUntil: "domcontentloaded" });
    const createNet = await captureAround(page, async () => {
      await page.getByRole("button", { name: "Belge Yükle" }).click();
      await page.getByRole("heading", { name: /Belge/i }).waitFor({ state: "visible" });
      await page.locator('input[name="title"]').waitFor({ state: "visible" });
      await page.fill('input[name="title"]', `Perf Doc ${stamp}`);
      await page.locator('input[type="file"]').setInputFiles({
        name: `perf-${stamp}.txt`,
        mimeType: "text/plain",
        buffer: Buffer.from(`perf ${stamp}`),
      });
      await page.locator("form").filter({ has: page.locator('input[name="title"]') }).locator('button[type="submit"]').click();
      await page.locator('input[name="title"]').waitFor({ state: "hidden", timeout: 90000 });
    });
    report.steps.push({ action: "createDocument(setup)", ...createNet });
    console.log("5a upload", createNet.wallMs, createNet.error || "ok");

    await page.goto(`${baseUrl}/panel/documents`, { waitUntil: "networkidle" });
    const net = await captureAround(page, async () => {
      await page.locator('input[type="search"]').first().fill(`Perf Doc ${stamp}`);
      await page.waitForTimeout(1000);
      const tableRow = page.locator("table tbody tr").filter({ hasText: "Perf Doc" }).first();
      await tableRow.waitFor({ state: "visible", timeout: 20000 });
      await tableRow.getByRole("button", { name: "Sil" }).click();
      await page.getByRole("heading", { name: "Belgeyi Sil" }).waitFor({ state: "visible" });
      await page.locator("button").filter({ hasText: /^Sil$/ }).last().click();
      await page.getByRole("heading", { name: "Belgeyi Sil" }).waitFor({ state: "hidden", timeout: 45000 });
    });
    report.steps.push({ action: "deleteDocument", ...net });
    console.log("5b delete doc", net.wallMs, net.bridges, net.error || "ok");
  }

  const outFile = path.join(outDir, "report.json");
  await writeFile(outFile, JSON.stringify(report, null, 2), "utf8");
  console.log("WROTE", outFile);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
