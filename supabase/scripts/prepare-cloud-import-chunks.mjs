import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const LOCAL_USER_ID = "ec441a7b-bf03-4655-8e02-923a7e5bf110";
const CLOUD_USER_ID = "242f8f1f-e9e7-4701-b70e-f81190db6a9e";
const ROW_CHUNK = 400;

const TABLE_ORDER = [
  "patient_transactions",
  "transaction_payments",
  "import_batches",
  "import_rows",
  "stock_products",
  "stock_movements",
  "cargo_records",
  "reminders",
  "finance_records",
  "documents",
  "web_requests",
];

const SKIP_TABLES = new Set(["profiles"]);
const inputPath = process.argv[2] ?? "supabase/local-public-data.sql";
const outDir = process.argv[3] ?? "supabase/cloud-import-chunks";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const raw = readFileSync(inputPath, "utf8");
const sections = new Map();
const sectionRegex =
  /--\n-- Data for Name: ([a-z_]+); Type: TABLE DATA; Schema: public; Owner: [^\n]+\n--\n\n([\s\S]*?)(?=\n--\n-- Data for Name:|\n--\n-- Name: |\nRESET ALL;|\n--\n-- PostgreSQL database dump complete)/g;

let match;
while ((match = sectionRegex.exec(raw)) !== null) {
  sections.set(match[1], match[2].trim());
}

function splitInsert(body) {
  const headerMatch = body.match(
    /^(INSERT INTO[\s\S]*?VALUES)\s*([\s\S]*)$/i,
  );
  if (!headerMatch) return null;
  const header = headerMatch[1];
  let valuesPart = headerMatch[2].trim();
  if (valuesPart.endsWith(";")) valuesPart = valuesPart.slice(0, -1).trim();

  // Rows start with tab+(
  const rows = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let prev = "";
  for (let i = 0; i < valuesPart.length; i++) {
    const ch = valuesPart[i];
    current += ch;
    if (ch === "'" && prev !== "\\") {
      // handle '' escape inside SQL strings
      if (inString && valuesPart[i + 1] === "'") {
        current += valuesPart[i + 1];
        i++;
        prev = "'";
        continue;
      }
      inString = !inString;
    } else if (!inString) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth === 0 && ch === ")") {
        // consume trailing comma/whitespace
        let j = i + 1;
        while (j < valuesPart.length && /[\s,]/.test(valuesPart[j])) {
          if (valuesPart[j] === ",") {
            i = j;
            break;
          }
          j++;
        }
        rows.push(current.trim().replace(/,$/, ""));
        current = "";
      }
    }
    prev = ch;
  }
  if (current.trim()) rows.push(current.trim().replace(/,$/, ""));
  return { header, rows };
}

const manifest = [];
let fileIndex = 0;

function writeChunk(name, sql) {
  fileIndex += 1;
  const file = join(outDir, `${String(fileIndex).padStart(3, "0")}-${name}.sql`);
  const content = [
    "SET session_replication_role = replica;",
    "SET check_function_bodies = false;",
    "SET client_min_messages = warning;",
    "SET search_path = public;",
    "",
    sql.trim(),
    "",
    "SET session_replication_role = DEFAULT;",
    "",
  ].join("\n");
  writeFileSync(file, content, "utf8");
  manifest.push({ file, name, bytes: Buffer.byteLength(content) });
  console.log(`wrote ${file} (${content.length} chars)`);
}

writeChunk(
  "00-profile",
  `INSERT INTO public.profiles (id, full_name, is_active)
VALUES ('${CLOUD_USER_ID}', 'voiceklinik@gmail.com', true)
ON CONFLICT (id) DO NOTHING;`,
);

for (const table of TABLE_ORDER) {
  let body = sections.get(table) ?? "";
  if (!body) {
    console.log(`${table}: empty`);
    continue;
  }
  body = body.split(LOCAL_USER_ID).join(CLOUD_USER_ID);
  const parsed = splitInsert(body);
  if (!parsed) {
    throw new Error(`Could not parse INSERT for ${table}`);
  }
  console.log(`${table}: ${parsed.rows.length} rows`);
  for (let i = 0; i < parsed.rows.length; i += ROW_CHUNK) {
    const chunkRows = parsed.rows.slice(i, i + ROW_CHUNK);
    const sql = `${parsed.header}\n${chunkRows.join(",\n")}\nON CONFLICT DO NOTHING;`;
    writeChunk(`${table}-${i + 1}`, sql);
  }
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nChunks: ${manifest.length}`);
