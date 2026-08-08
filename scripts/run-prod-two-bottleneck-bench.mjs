/**
 * Production bench for the two remaining bottlenecks:
 * 1) createPatientTransaction → detail first paint (client wall)
 * 2) deletePatientTransaction server (_perf via bridge)
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = (
  process.env.PROD_BASE_URL || "https://voice-clinic-sage.vercel.app"
).replace(/\/$/, "");
const email = process.env.MEASURE_EMAIL;
const password = process.env.MEASURE_PASSWORD;
if (!email || !password) {
  console.error("Set MEASURE_EMAIL and MEASURE_PASSWORD");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join("scripts", "prod-bench-out", `two-${stamp}`);
const patientName = `Perf Bench ${stamp}`;

function classifyGet(url) {
  return url.replace(baseUrl, "").split("?")[0] || "/";
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(60000);

  const bridges = [];
  const consoleLines = [];
  page.on("console", (msg) => {
    const text = msg.text();
    consoleLines.push(text);
    if (
      text.includes("[mutation-perf-bridge]") ||
      text.includes("[mutation-client-perf]") ||
      text.includes("[mutation-perf]")
    ) {
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

  // Warm panel auth / layout once before measuring create→detail.
  await page.goto(`${baseUrl}/panel/transactions`, { waitUntil: "networkidle" });

  await page.goto(`${baseUrl}/panel/transactions/new`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('input[name="patient_name"]');
  await page.fill('input[name="patient_name"]', patientName);
  await page.fill('input[name="operation_description"]', "Perf bench işlem");
  await page.fill('input[name="sale_amount"]', "1000");
  const firstAmt = page.locator('input[name="first_payment_amount"]');
  if (await firstAmt.count()) {
    await firstAmt.fill("100");
    const method = page.locator('select[name="first_payment_method"]');
    if (await method.count()) await method.selectOption("cash");
  }

  const createGets = [];
  const onCreateResponse = (response) => {
    const req = response.request();
    if (req.method() !== "GET") return;
    const type = req.resourceType();
    if (type !== "document" && type !== "fetch" && type !== "xhr") return;
    const url = response.url();
    if (!url.startsWith(baseUrl) || url.includes("/_next/")) return;
    createGets.push({
      status: response.status(),
      path: classifyGet(url),
      resourceType: type,
      ms: Date.now(),
    });
  };
  page.on("response", onCreateResponse);

  const createT0 = performance.now();
  await Promise.all([
    page.waitForURL(/\/panel\/transactions\/[0-9a-f-]{36}/i, { timeout: 90000 }),
    page.getByRole("button", { name: "İşlemi Kaydet" }).click(),
  ]);
  const urlReadyMs = Math.round(performance.now() - createT0);
  await page.getByRole("heading", { level: 1 }).waitFor({ state: "visible" });
  const detailPaintMs = Math.round(performance.now() - createT0);
  // Brief settle for any stray sibling GETs.
  await page.waitForTimeout(1500);
  page.off("response", onCreateResponse);

  const transactionId = page.url().split("/").filter(Boolean).pop();
  const createReport = {
    action: "createPatientTransaction→detail",
    urlReadyMs,
    detailPaintMs,
    transactionId,
    url: page.url(),
    gets: createGets,
    getPaths: createGets.map((g) => g.path),
    status500: createGets.filter((g) => g.status >= 500),
    bridges: bridges.filter((b) => b.includes("createPatientTransaction")),
  };
  console.log("CREATE", JSON.stringify(createReport, null, 2));

  // Delete from list
  const deleteBridgesBefore = bridges.length;
  await page.goto(
    `${baseUrl}/panel/transactions?search=${encodeURIComponent(patientName)}`,
    { waitUntil: "networkidle" },
  );

  const deleteGets = [];
  const onDeleteResponse = (response) => {
    const req = response.request();
    if (req.method() !== "GET") return;
    const type = req.resourceType();
    if (type !== "document" && type !== "fetch" && type !== "xhr") return;
    const url = response.url();
    if (!url.startsWith(baseUrl) || url.includes("/_next/")) return;
    deleteGets.push({
      status: response.status(),
      path: classifyGet(url),
      resourceType: type,
    });
  };
  page.on("response", onDeleteResponse);

  const deleteT0 = performance.now();
  const tableRow = page.locator("table tbody tr").filter({ hasText: "Perf Bench" }).first();
  await tableRow.getByRole("button", { name: "Sil" }).click();
  await page.getByRole("heading", { name: "İşlemi Sil" }).waitFor({ state: "visible" });
  await page.locator("button").filter({ hasText: /^Sil$/ }).last().click();
  await page.getByRole("heading", { name: "İşlemi Sil" }).waitFor({
    state: "hidden",
    timeout: 45000,
  });
  const deleteWallMs = Math.round(performance.now() - deleteT0);
  await page.waitForTimeout(1500);
  page.off("response", onDeleteResponse);

  const deleteBridges = bridges.slice(deleteBridgesBefore);
  const deleteReport = {
    action: "deletePatientTransaction",
    wallMs: deleteWallMs,
    gets: deleteGets,
    getPaths: deleteGets.map((g) => g.path),
    status500: deleteGets.filter((g) => g.status >= 500),
    bridges: deleteBridges,
  };
  console.log("DELETE", JSON.stringify(deleteReport, null, 2));

  const report = {
    baseUrl,
    stamp,
    create: createReport,
    delete: deleteReport,
    allBridges: bridges,
  };
  await writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  console.log("WROTE", path.join(outDir, "report.json"));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
