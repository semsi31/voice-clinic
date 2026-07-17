import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const outDir = "supabase/cloud-import-chunks";
const LOCAL = "ec441a7b-bf03-4655-8e02-923a7e5bf110";
const CLOUD = "242f8f1f-e9e7-4701-b70e-f81190db6a9e";
const MAX = 900000;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

function stripDumpNoise(sql) {
  return sql
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^\\restrict\b/.test(t) || /^\\unrestrict\b/.test(t)) return false;
      // pg_dump headers like "-- Data for Name: x; Type: TABLE DATA;" contain ';'
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

writeFileSync(
  join(outDir, "000-profile.sql"),
  `SET session_replication_role = replica;
INSERT INTO public.profiles (id, full_name, is_active)
VALUES ('${CLOUD}', 'voiceklinik@gmail.com', true)
ON CONFLICT (id) DO NOTHING;
SET session_replication_role = DEFAULT;
`,
);

const tables = [
  "patient_transactions",
  "transaction_payments",
  "import_batches",
  "import_rows",
  "reminders",
  "finance_records",
  "documents",
  "web_requests",
];

let fileNo = 1;
for (const table of tables) {
  const raw = execSync(
    `docker exec supabase_db_voice pg_dump -U postgres -d postgres --data-only --inserts --rows-per-insert=200 --table=public.${table}`,
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const inserts = splitStatements(stripDumpNoise(raw))
    .map(addConflict)
    .filter(Boolean);
  console.log(table, "insertStmts", inserts.length);
  if (!inserts.length) continue;

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
}

let issues = 0;
for (const f of readdirSync(outDir).filter((x) => x.endsWith(".sql"))) {
  const lines = readFileSync(join(outDir, f), "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("ON CONFLICT") && !/^\s*ON CONFLICT/.test(line)) {
      issues += 1;
      if (issues <= 5) console.log("bad", f, i + 1, line.slice(0, 120));
    }
  }
}
console.log("inlineConflictIssues", issues);
