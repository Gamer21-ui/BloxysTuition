// Splits a big update SQL file into numbered parts small enough to copy and paste safely.
// Usage: node scripts/split-update.mjs supabase/updates/<file>.sql [maxBytes]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
const [file, max = "40000"] = process.argv.slice(2);
const lines = readFileSync(file, "utf8").split("\n");
const header = lines.filter((l, i) => l.startsWith("--") && i < 5);
const stmts = []; let cur = null;
for (const l of lines) {
  if (/^insert into /.test(l)) { if (cur) stmts.push(cur.join("\n")); cur = [l]; }
  else if (cur) { if (l === "commit;") { stmts.push(cur.join("\n")); cur = null; } else cur.push(l); }
}
if (cur) stmts.push(cur.join("\n"));
const chunks = []; let c = [], size = 0;
for (const s of stmts) { if (size + s.length > +max && c.length) { chunks.push(c); c = []; size = 0; } c.push(s); size += s.length + 1; }
if (c.length) chunks.push(c);
const name = basename(file, ".sql"), dir = join(dirname(file), name);
mkdirSync(dir, { recursive: true });
chunks.forEach((ch, i) => writeFileSync(join(dir, `part-${String(i + 1).padStart(2, "0")}-of-${String(chunks.length).padStart(2, "0")}.sql`),
  [...header, `-- Part ${i + 1} of ${chunks.length}. Run the parts in order. Each part is safe to run again.`, "begin;", ...ch, "commit;", ""].join("\n")));
console.log(`${name}: ${stmts.length} statements -> ${chunks.length} parts`);
