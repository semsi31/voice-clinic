import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const outDir = "supabase/cloud-import-remaining";
const LOCAL = "ec441a7b-bf03-4655-8e02-923a7e5bf110";
const CLOUD = "242f8f1f-e9e7-4701-b70e-f81190db6a9e";
const MAX = 900000;

mkdirSync(outDir, { recursive: true });

/** Remove pg_dump meta + line comments so ';' inside '-- Data for Name: x; Type:...' cannot break parsing. */
function stripDumpNoise(sql) {
  return sql
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^\\restrict\b/.test(t) || /^\\unrestrict\b/.test(t)) return false;
      if (t.startsWith("--")) return false;
      return true;
    })
    .join("\n")
    .replaceAll(LOCAL, CLOUD);
}

function splitStatements(sql) {
  const stmts = [];
  let cur = "";
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    cur += ch;
    if (ch === "'") {
      if (inString && sql[i + 1] === "'") {
        cur += sql[++i];
        continue;
      }
      inString = !inString;
      continue;
    }
    if (!inString && ch === ";") {
      const s = cur.trim();
      if (s) stmts.push(s);
      cur = "";
    }
  }
  const tail = cur.trim();
  if (tail) stmts.push(tail);
  return stmts;
}

function addConflict(stmt) {
  if (!/^INSERT INTO/i.test(stmt)) return null;
  if (/ON CONFLICT/i.test(stmt)) return stmt.endsWith(";") ? stmt : `${stmt};`;
  return `${stmt.replace(/;?\s*$/, "")}\nON CONFLICT DO NOTHING;`;
}

function dumpTable(table) {
  return execSync(
    `docker exec supabase_db_voice pg_dump -U postgres -d postgres --data-only --inserts --rows-per-insert=200 --table=public.${table}`,
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
}

function writeInsertChunks(table, inserts, startNo) {
  let fileNo = startNo;
  let part = 1;
  let buf = [
    "SET session_replication_role = replica;",
    "SET search_path = public;",
    "",
  ];
  let size = buf.join("\n").length;

  const flush = () => {
    buf.push("SET session_replication_role = DEFAULT;");
    const name = `${String(fileNo).padStart(3, "0")}-${table}-part${String(part).padStart(3, "0")}.sql`;
    writeFileSync(join(outDir, name), `${buf.join("\n")}\n`);
    console.log("wrote", name, "bytesApprox", size);
    part += 1;
    fileNo += 1;
    buf = [
      "SET session_replication_role = replica;",
      "SET search_path = public;",
      "",
    ];
    size = buf.join("\n").length;
  };

  for (const stmt of inserts) {
    if (size + stmt.length > MAX && buf.length > 3) flush();
    buf.push(stmt, "");
    size += stmt.length + 2;
  }
  if (buf.length > 3) flush();
  return fileNo;
}

// FK-safe order: batches before any remaining rows; payments after transactions (already on cloud)
const tables = [
  "import_batches",
  "import_rows", // ON CONFLICT fills the 200 lost from first broken INSERT
  "transaction_payments",
  "reminders",
  "finance_records",
  "documents",
  "web_requests",
];

let fileNo = 1;
for (const table of tables) {
  const raw = dumpTable(table);
  let inserts = splitStatements(stripDumpNoise(raw))
    .map(addConflict)
    .filter(Boolean);
  // Prior import dropped only the first INSERT (pg_dump header comment split bug) → 200 rows.
  if (table === "import_rows") {
    inserts = inserts.slice(0, 1);
    console.log("import_rows: shipping only first INSERT to fill 200-row gap");
  }
  console.log(table, "insertStmts", inserts.length);
  if (!inserts.length) continue;
  fileNo = writeInsertChunks(table, inserts, fileNo);
}

console.log(
  "files",
  readdirSync(outDir)
    .filter((f) => f.endsWith(".sql"))
    .sort(),
);
