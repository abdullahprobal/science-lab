// Runs every scene's physics/maths check and verifies its content. Run: node tools/check.mjs
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "site/js/scenes"), rd = p => JSON.parse(readFileSync(join(root, p), "utf8"));
let bad = 0, n = 0;
const fail = m => { bad++; console.error("FAIL:", m); };
const chapters = rd("content/chapters.json"), listed = chapters.subjects.flatMap(s => s.papers.flatMap(p => p.chapters.flatMap(c => c.scenes)));

for (const f of readdirSync(dir).filter(x => x.endsWith(".js"))) {
  const id = f.slice(0, -3), mod = (await import(pathToFileURL(join(dir, f)))).default;
  if (mod.id !== id) fail(`${f}: id is "${mod.id}"`);
  for (const k of ["params", "presets", "init", "update", "readouts", "steps", "check"]) if (!(k in mod)) fail(`${f}: missing ${k}`);
  if (!listed.includes(id)) fail(`${id}: not listed in any chapter in content/chapters.json`);
  const jf = `content/scenes/${id}.json`; if (!existsSync(join(root, jf))) { fail(`${f}: no ${jf}`); continue; }
  const meta = rd(jf), keys = new Set(mod.params.map(q => q.key));
  const defaults = Object.fromEntries(mod.params.map(q => [q.key, q.value]));
  const run = (label, p) => { try { if (!mod.readouts(p).length || !mod.steps(p).length) fail(`${id}: ${label} gives empty readouts/steps`); } catch (e) { fail(`${id}: ${label} throws ${e.message}`); } };
  for (const pr of mod.presets) { for (const k of Object.keys(pr.values)) if (!keys.has(k)) fail(`${id}: preset "${pr.name}" sets unknown "${k}"`); run(`preset "${pr.name}"`, { ...defaults, ...pr.values }); }
  for (const q of mod.params) for (const v of q.choices ? q.choices.map(c => c.v) : [q.min, q.max]) run(`${q.key}=${v}`, { ...defaults, [q.key]: v });
  // content
  for (const k of ["title_bn", "title_en", "paper", "chapter", "intro"]) if (!meta[k]) fail(`${id}.json: empty ${k}`);
  if (!Array.isArray(meta.tour) || meta.tour.length < 3) fail(`${id}.json: tour needs 3+ steps`);
  else for (const [i, st] of meta.tour.entries()) { if (!st.caption) fail(`${id}.json: tour step ${i + 1} has no caption`);
    for (const [k, v] of Object.entries(st.values || {})) { const q = mod.params.find(x => x.key === k); if (!q) fail(`${id}.json: tour step ${i + 1} sets unknown "${k}"`); else if (q.choices ? !q.choices.some(c => c.v === v) : v < q.min || v > q.max) fail(`${id}.json: tour step ${i + 1}: ${k}=${v} is outside the slider`); } }
  if (!Array.isArray(meta.questions) || meta.questions.length < 3) fail(`${id}.json: needs 3+ questions`);
  else for (const [i, q] of meta.questions.entries()) if (!q.q || q.options.length < 2 || !(q.answer >= 0 && q.answer < q.options.length) || !q.why) fail(`${id}.json: question ${i + 1} is incomplete`);
  const r = meta.reading || {};
  for (const k of ["idea", "example"]) if (!r[k]) fail(`${id}.json: reading.${k} missing`);
  for (const k of ["formula", "mistakes", "faq"]) if (!Array.isArray(r[k]) || !r[k].length) fail(`${id}.json: reading.${k} missing`);
  for (const rel of meta.related || []) if (!listed.includes(rel)) fail(`${id}.json: related "${rel}" does not exist`);
  mod.check((ok, msg) => { n++; if (!ok) fail(`${id}: ${msg}`); });
}
for (const id of listed) if (!existsSync(join(dir, id + ".js"))) fail(`chapters.json lists "${id}" but there is no scene file`);
console.log(bad ? `${bad} problem(s)` : `ok: ${listed.length} scenes, ${n} physics/maths checks passed`);
process.exit(bad ? 1 : 0);
