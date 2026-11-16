// Builds data files, reading pages, policy pages, sitemap and version stamps. Run: node tools/build.mjs [--release]
// --release refuses to build while any scene has an empty reviewed_by. Never hand-edit site/data or site/read.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = p => readFileSync(join(root, p), "utf8"), wr = (p, s) => writeFileSync(join(root, p), s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SITE = JSON.parse(rd("content/site.json")), BASE = SITE.base;
const promos = JSON.parse(rd("content/promos.json")).promos;
const DIFFS = JSON.parse(rd("content/diffs.json"));
const diffsFor = id => DIFFS.diffs.filter(d => d.scene === id).map(d => `<li><a href="diff-${d.id}.html">${esc(d.title)}</a></li>`).join("");
for (const d of ["data/scenes", "read"]) mkdirSync(join(root, "site", d), { recursive: true });

const scenes = Object.fromEntries(readdirSync(join(root, "content/scenes")).filter(f => f.endsWith(".json")).map(f => { const s = JSON.parse(rd("content/scenes/" + f)); s.subject ||= "physics"; return [s.id, s]; }));
if (process.argv.includes("--release")) {
  const open = Object.values(scenes).filter(s => !s.reviewed_by).map(s => s.id);
  if (open.length) { console.error("Not reviewed (reviewed_by is empty):", open.join(", ")); process.exit(1); }
}
const cfg = JSON.parse(rd("content/chapters.json")); delete cfg._note;
const where = {};                                                  // scene id -> subject/paper/chapter info for breadcrumbs and hubs
for (const sub of cfg.subjects) sub.papers.forEach((pp, pi) => pp.chapters.forEach(c => c.scenes.forEach(id => {
  if (!scenes[id]) throw new Error(`chapters.json: unknown scene "${id}"`);
  where[id] = { sub, paper: pp.name, c, hub: `read/${sub.id}-${pi + 1}-${c.no}.html` }; })));
for (const id of Object.keys(scenes)) if (!where[id]) throw new Error(`scene "${id}" is not in any chapter`);

// ---------- data ----------
for (const s of Object.values(scenes)) wr(`site/data/scenes/${s.id}.json`, JSON.stringify(s));
const site = JSON.parse(JSON.stringify(cfg));
for (const sub of site.subjects) for (const pp of sub.papers) for (const c of pp.chapters) c.scenes = c.scenes.map(id => ({ id, title_bn: scenes[id].title_bn }));
wr("site/data/chapters.json", JSON.stringify(site));
wr("site/data/quiz.json", JSON.stringify(Object.values(scenes).flatMap(s => s.questions.map(q => ({ scene: s.id, title: s.title_bn, ...q })))));
wr("site/data/promos.json", JSON.stringify(promos));
wr("site/data/site.json", JSON.stringify({ ga_id: SITE.ga_id }));
copyFileSync(join(root, "MODELS-LICENSE.md"), join(root, "site/MODELS-LICENSE.md"));
if (SITE.adsense_client) wr("site/ads.txt", `google.com, ${SITE.adsense_client.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`);

// ---------- pages ----------
const ADS = SITE.adsense_client ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsense_client}" crossorigin="anonymous"></script>` : "";
const GA = SITE.ga_id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${SITE.ga_id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${SITE.ga_id}',{anonymize_ip:true});</script>` : "";
const AD = `<div class="ad" aria-label="বিজ্ঞাপন">${SITE.adsense_client ? `<ins class="adsbygoogle" style="display:block" data-ad-client="${SITE.adsense_client}" data-ad-format="auto" data-full-width-responsive="true" data-npa-on-unknown-consent="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>` : ""}</div>`;
const promo = (slot, ssc, i = 0) => {
  const l = promos.filter(p => p.slot === slot && (!p.ssc || ssc)); if (!l.length) return "";
  const p = l[i % l.length], u = p.url + (p.url.includes("?") ? "&" : "?") + "utm_source=lab&utm_medium=" + slot;
  return `<a class="promo" href="${esc(u)}" target="_blank" rel="noopener"><b>${esc(p.title)}</b><span>${esc(p.text)}</span><em>${esc(p.label)} →</em></a>`;
};
const MENU = up => `<header class="sitetop"><a class="brand" href="${up}index.html">${SITE.name}</a><nav class="menu"><a href="${up}index.html#chapters">অধ্যায়</a><a href="${up}read/index.html">পড়ো</a><a href="${up}map.html">মানচিত্র</a><a href="${up}about.html">পরিচিতি</a></nav></header>`;
const FOOT = up => `<footer class="sitefoot"><p><a href="${up}about.html">আমাদের কথা</a> · <a href="${up}privacy.html">গোপনীয়তা নীতি</a> · <a href="${up}terms.html">শর্তাবলী</a> · <a href="${up}contact.html">যোগাযোগ</a></p><p>© Board &amp; Beyond · <a href="https://bandb.academy/">bandb.academy</a></p></footer>`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wdth,wght@75..125,400..800&family=Hind+Siliguri:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;
const crumbs = items => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: BASE + path })) });
const page = ({ title, desc, path, body, up = "../", ld = [], cls = "read" }) => `<!doctype html>
<html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | ${SITE.name}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${BASE}${path}">
<meta property="og:type" content="article"><meta property="og:locale" content="bn_BD"><meta property="og:site_name" content="${SITE.name}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${BASE}${path}"><meta property="og:image" content="${BASE}og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n")}
${up === "../" ? ADS : ""}${GA}${FONTS}<link rel="stylesheet" href="${up}style.css"></head>
<body class="${cls}">${MENU(up)}<main>${body}</main>${FOOT(up)}</body></html>
`;
const urls = ["", "read/index.html", "map.html", "about.html", "privacy.html", "contact.html", "terms.html"];
const list = a => `<ul class="facts">${a.map(t => `<li>${t}</li>`).join("")}</ul>`;

for (const s of Object.values(scenes)) {
  const w = where[s.id], r = s.reading, path = `read/${s.id}.html`, rel = s.related.filter(id => scenes[id]);
  const body = `<p class="en">${esc(w.sub.name)} · ${esc(w.paper)} · ${esc(w.c.name)}</p><h1>${esc(s.title_bn)}</h1><p class="lead">${esc(s.intro)}</p>
<div class="cta"><a class="btn primary" href="../scene.html?s=${s.id}">৩ডিতে ঘুরিয়ে দেখো</a></div>
<p class="${s.reviewed_by ? "ok" : "draft"}">${s.reviewed_by ? `যাচাই করেছেন: ${esc(s.reviewed_by)}` : "খসড়া: এই লেখা এখনো শিক্ষকের যাচাই হয়নি। পাঠ্যবইয়ের সাথে মিলিয়ে নাও।"}</p>
<h2>মূল ধারণা</h2><p>${r.idea}</p>${AD}
<h2>সূত্র</h2>${list(r.formula)}<h2>উদাহরণ</h2><p>${r.example}</p>${r.example2 ? `<p>${r.example2}</p>` : ""}${r.real ? `<h2>বাস্তব জীবনে</h2><p>${r.real}</p>` : ""}${r.how ? `<h2>পরীক্ষায় যেভাবে আসে ও সমাধানের ধাপ</h2><p>${r.how}</p>` : ""}
<h2>যে ভুলগুলো সাধারণত হয়</h2>${list(r.mistakes)}
${r.summary ? `<h2>সংক্ষেপে মনে রাখো</h2>${list(r.summary)}` : ""}<h2>নিজেকে যাচাই করো</h2>${s.questions.map((q, i) => `<details class="qa"><summary>${i + 1}. ${q.q}</summary><ol class="opts">${q.options.map((o, k) => `<li${k === q.answer ? ' class="right"' : ""}>${o}</li>`).join("")}</ol><p>${q.why}</p></details>`).join("")}
<h2>প্রশ্নোত্তর</h2>${r.faq.map(f => `<h3>${f.q}</h3><p>${f.a}</p>`).join("")}
${AD}<section class="rows">${promo("read", s.ssc)}</section>
<h2>আরও দৃশ্য</h2><ul class="list">${diffsFor(s.id)}<li><a href="${w.hub.replace("read/", "")}">${esc(w.c.name)}: অধ্যায়ের সব দৃশ্য</a></li>${rel.map(id => `<li><a href="${id}.html">${esc(scenes[id].title_bn)} <small>${esc(scenes[id].title_en)}</small></a></li>`).join("")}</ul>`;
  wr(`site/${path}`, page({ title: `${s.title_bn} (${s.title_en})`, desc: `${s.title_bn}: ${s.intro}`, path, body,
    ld: [crumbs([[SITE.name, ""], ["পড়ো", "read/index.html"], [s.title_bn, path]]),
      { "@context": "https://schema.org", "@type": "Article", headline: `${s.title_bn} (${s.title_en})`, inLanguage: "bn", isAccessibleForFree: true, publisher: { "@type": "Organization", name: "Board & Beyond", url: "https://bandb.academy/" }, mainEntityOfPage: BASE + path },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: r.faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] }));
  urls.push(path);
}
// chapter hubs: one page per chapter that has scenes
const hubs = {};
for (const s of Object.values(scenes)) (hubs[where[s.id].hub] ||= { w: where[s.id], list: [] }).list.push(s);
for (const [path, { w, list: ss }] of Object.entries(hubs)) {
  wr(`site/${path}`, page({ title: `${w.sub.name} ${w.paper}: ${w.c.name}`, desc: `${w.c.name} (${w.sub.name} ${w.paper}) অধ্যায়ের সব ৩ডি দৃশ্য ও ব্যাখ্যা।`, path,
    body: `<p class="en">${esc(w.sub.name)} · ${esc(w.paper)}</p><h1>${esc(w.c.name)}</h1><p class="lead">এই অধ্যায়ের দৃশ্যগুলো। প্রতিটিতে ৩ডি মডেল, গাইডেড টুর ও কুইজ আছে।</p>
<ul class="list">${ss.map(s => `<li><a href="${s.id}.html">${esc(s.title_bn)} <small>${esc(s.title_en)}</small></a></li>`).join("")}</ul>${AD}`,
    ld: [crumbs([[SITE.name, ""], ["পড়ো", "read/index.html"], [w.c.name, path]])] }));
  urls.push(path);
}
const idx = cfg.subjects.map(sub => `<h2 id="${sub.id}">${esc(sub.name)}</h2>${sub.papers.map((pp, pi) => `<h3>${esc(pp.name)}</h3><ul class="list">${pp.chapters.filter(c => c.scenes.length).map(c =>
  `<li><a href="${sub.id}-${pi + 1}-${c.no}.html">${c.no}. ${esc(c.name)}</a> <small>${c.scenes.map(id => `<a href="${id}.html">${esc(scenes[id].title_bn)}</a>`).join(" · ")}</small></li>`).join("")}</ul>`).join("")}`).join("");
wr("site/read/index.html", page({ title: "সব পাঠ ও ব্যাখ্যা", desc: "HSC পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞানের ৩ডি দৃশ্যের বাংলা ব্যাখ্যা, সূত্র, উদাহরণ ও কুইজ।", path: "read/index.html",
  body: `<h1>সব পাঠ ও ব্যাখ্যা</h1><p class="lead">প্রতিটি দৃশ্যের সাথে সূত্র, উদাহরণ, সাধারণ ভুল ও কুইজ। <a href="diffs.html">সব পার্থক্য</a> · <a href="remember.html">মনে রাখার তালিকা</a></p>${idx}${AD}<section class="rows">${promo("read", true)}</section>`, ld: [crumbs([[SITE.name, ""], ["পড়ো", "read/index.html"]])] }));

// difference tables and the remember-it page (no ads on these short pages)
for (const d of DIFFS.diffs) {
  if (!scenes[d.scene]) throw new Error(`diff ${d.id}: unknown scene ${d.scene}`);
  const path = `read/diff-${d.id}.html`;
  wr(`site/${path}`, page({ title: d.title, desc: `${d.title}: ${d.intro}`, path, ld: [crumbs([[SITE.name, ""], ["পার্থক্য", "read/diffs.html"], [d.title, path]])],
    body: `<p class="en">${esc(d.subject)} · পার্থক্য</p><h1>${esc(d.title)}</h1><p class="lead">${esc(d.intro)}</p>
<div class="tablewrap"><table><thead><tr>${d.cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${d.rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join("")}</tr>`).join("")}</tbody></table></div>
<div class="cta"><a class="btn primary" href="../scene.html?s=${d.scene}">৩ডিতে দেখো</a><a class="btn ghost" href="${d.scene}.html">পুরো ব্যাখ্যা পড়ো</a></div>` }));
  urls.push(path);
}
wr("site/read/diffs.html", page({ title: "সব পার্থক্য এক জায়গায়", desc: "পরীক্ষায় বারবার আসা পার্থক্যের তালিকা: পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞান।", path: "read/diffs.html", ld: [crumbs([[SITE.name, ""], ["পার্থক্য", "read/diffs.html"]])],
  body: `<h1>সব পার্থক্য এক জায়গায়</h1><p class="lead">দুটি জিনিসের তুলনা সারণিতে দেখো।</p>${["পদার্থবিজ্ঞান", "রসায়ন", "জীববিজ্ঞান"].map(sub => `<h2>${sub}</h2><ul class="list">${DIFFS.diffs.filter(d => d.subject === sub).map(d => `<li><a href="diff-${d.id}.html">${esc(d.title)}</a></li>`).join("")}</ul>`).join("")}` }));
wr("site/read/remember.html", page({ title: "মনে রাখার তালিকা", desc: "পদার্থবিজ্ঞানের ধ্রুবক, রসায়নের সংখ্যা ও জীববিজ্ঞানের তালিকা এক পাতায়।", path: "read/remember.html", ld: [crumbs([[SITE.name, ""], ["মনে রাখো", "read/remember.html"]])],
  body: `<h1>মনে রাখার তালিকা</h1><p class="lead">পরীক্ষার আগে একবার চোখ বুলিয়ে নেওয়ার জন্য।</p>${DIFFS.remember.map(g => `<h2>${esc(g.title)}</h2>${list(g.items)}`).join("")}` }));
urls.push("read/diffs.html", "read/remember.html");

// concept map: scenes as dots on a ring per subject, lines for "related"
{
  const all = Object.values(scenes), pos = {}, subs = cfg.subjects.map(s => s.id), W = 900, H = 640;
  subs.forEach((sid, si) => { const g = all.filter(s => s.subject === sid), cx = [210, 690, 450][si], cy = [200, 200, 480][si];
    g.forEach((s, i) => { const a = i / g.length * 6.2832 - 1.57; pos[s.id] = [cx + 150 * Math.cos(a), cy + 120 * Math.sin(a)]; }); });
  const col = { physics: "#4aa3ff", chemistry: "#4fd68a", biology: "#ff8a3d" };
  const edges = [...new Set(all.flatMap(s => s.related.filter(r => scenes[r]).map(r => [s.id, r].sort().join("|"))))].map(e => e.split("|"));
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="দৃশ্যগুলোর সম্পর্ক">${edges.map(([a, b]) => `<line x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}" stroke="#2a2925" stroke-width="2"/>`).join("")}${all.map(s =>
    `<a href="read/${s.id}.html"><circle cx="${pos[s.id][0]}" cy="${pos[s.id][1]}" r="9" fill="${col[s.subject]}"/><text x="${pos[s.id][0]}" y="${pos[s.id][1] - 14}" text-anchor="middle" fill="#f1ece0" font-size="14">${esc(s.title_bn)}</text></a>`).join("")}</svg>`;
  wr("site/map.html", page({ title: "বিজ্ঞানের মানচিত্র", desc: "কোন দৃশ্য কোনটির সাথে সম্পর্কিত তার মানচিত্র।", path: "map.html", up: "", body: `<h1>বিজ্ঞানের মানচিত্র</h1><p class="lead">নীল পদার্থবিজ্ঞান, সবুজ রসায়ন, কমলা জীববিজ্ঞান। লাইন মানে দৃশ্য দুটি সম্পর্কিত। যেকোনো বিন্দুতে চাপ দাও।</p><div class="map">${svg}</div>` }));
}

const POL = {
  about: ["আমাদের কথা", "বিজ্ঞান ল্যাব কী, কারা বানিয়েছে ও কীভাবে শেখায়।", `<h1>আমাদের কথা</h1><p class="lead">বিজ্ঞান ল্যাব HSC পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞানের বিনামূল্যের ৩ডি বাংলা ওয়েবসাইট। বইয়ে সমতল আঁকা ছবিগুলো এখানে ঘুরিয়ে দেখা যায়, স্লাইডার টেনে বদলানো যায়।</p><h2>কার জন্য</h2><p>HSC ও ভর্তি পরীক্ষার শিক্ষার্থীদের জন্য। নিজে বদলিয়ে দেখলে বিষয় বেশি মনে থাকে।</p><h2>কারা বানিয়েছে</h2><p>সাইটটি Board &amp; Beyond (<a href="https://bandb.academy/">bandb.academy</a>) এর উদ্যোগ।</p><h2>লেখা কতটা নির্ভরযোগ্য</h2><p>প্রতিটি পাতায় লেখা আছে সেটি শিক্ষকের যাচাই হয়েছে কি না। পরীক্ষার জন্য এনসিটিবি পাঠ্যবই চূড়ান্ত। ভুল পেলে জানাও, ঠিক করে দেব।</p><h2>খরচ</h2><p>সাইটটি শিক্ষার্থীদের জন্য সবসময় বিনামূল্যে। খরচ চালাতে পড়ার পাতায় বিজ্ঞাপন দেখানো হয় এবং Board &amp; Beyond এর বই ও কোর্সের কথা জানানো হয়।</p><h2>তৃতীয় পক্ষের উপাদান</h2><p>three.js (MIT) ও ক্যামেরা-হাত চেনার জন্য Google MediaPipe (Apache 2.0) ব্যবহার করেছি।</p>`],
  privacy: ["গোপনীয়তা নীতি", "ক্যামেরা, কুকি, বিজ্ঞাপন ও তথ্য নিয়ে আমাদের নীতি।", `<h1>গোপনীয়তা নীতি</h1><p class="lead">তোমার ক্যামেরার ভিডিও কখনো তোমার ফোন থেকে বের হয় না। সব বিশ্লেষণ ফোনের ব্রাউজারেই হয়।</p><h2>ক্যামেরা</h2><p>শুধু হাতের নিয়ম দৃশ্যে ক্যামেরা বোতাম চাপলে ব্রাউজার অনুমতি চায়। ভিডিও শুধু তোমার ফোনেই প্রক্রিয়া হয়; আমরা কোনো ভিডিও বা ছবি সংগ্রহ, সংরক্ষণ বা আপলোড করি না।</p><h2>তোমার ফোনে রাখা তথ্য</h2><p>কুইজের ফল তোমার ফোনের localStorage এ থাকে, যাতে পরের বার মনে থাকে। ব্রাউজারের ডেটা মুছলে চলে যায়।</p><h2>বিজ্ঞাপন ও কুকি</h2><p>পড়ার পাতায় Google AdSense এর বিজ্ঞাপন দেখানো হতে পারে। Google ও তাদের অংশীদাররা কুকি ব্যবহার করে বিজ্ঞাপন দেখাতে পারে। তুমি <a href="https://adssettings.google.com/">Google Ads Settings</a> থেকে ব্যক্তিগতকৃত বিজ্ঞাপন বন্ধ করতে পারো। ৩ডি দৃশ্য, গাইডেড টুর ও কুইজে কোনো বিজ্ঞাপন নেই।</p><h2>পরিসংখ্যান</h2><p>চালু থাকলে Google Analytics (IP বেনামী) পাতা খোলা, কুইজের ফল ও ফ্রেম-রেটের মতো সাধারণ তথ্য গোনে। কোনো নাম, ইমেইল বা ফোন নম্বর নয়।</p><h2>বাইরের লিঙ্ক</h2><p>bandb.academy, storyvocabs.com ও biology.bandb.academy এর লিঙ্ক আছে। ওই সাইটগুলোর নিজস্ব নীতি আছে।</p><h2>যোগাযোগ</h2><p><a href="contact.html">যোগাযোগ</a> পাতা দেখো।</p>`],
  contact: ["যোগাযোগ", "ভুল জানাতে বা প্রশ্ন করতে Board & Beyond এর সাথে যোগাযোগ।", `<h1>যোগাযোগ</h1><p class="lead">লেখায় ভুল পেলে বা কোনো অংশ বুঝতে সমস্যা হলে জানাও।</p><ul class="facts"><li>ওয়েবসাইট: <a href="https://bandb.academy/">bandb.academy</a></li><li>Board &amp; Beyond এর Facebook পেজে মেসেজ দাও</li></ul><p>ভুল জানানোর সময় পাতার নাম লিখো।</p>`],
  terms: ["শর্তাবলী", "এই সাইট ব্যবহারের শর্ত।", `<h1>শর্তাবলী</h1><p class="lead">এই সাইট শেখার জন্য বিনামূল্যে ব্যবহার করা যায়।</p><h2>লেখার নির্ভুলতা</h2><p>আমরা সঠিক রাখার চেষ্টা করি, তবে পরীক্ষার জন্য এনসিটিবি পাঠ্যবই চূড়ান্ত। ভুলের কারণে ক্ষতির দায় আমরা নিই না।</p><h2>ব্যবহার</h2><p>ব্যক্তিগত শিক্ষায় ব্যবহার করো। আমাদের লেখা অনুমতি ছাড়া নিজের নামে প্রকাশ বা বিক্রি কোরো না।</p><h2>বাইরের সাইট</h2><p>অন্য সাইটের লিঙ্ক ও বিজ্ঞাপনের দায় ওই সাইটের।</p>`],
};
for (const [k, [t, d, b]] of Object.entries(POL)) wr(`site/${k}.html`, page({ title: t, desc: d, path: `${k}.html`, up: "", body: b }));
wr("site/404.html", page({ title: "পাতা পাওয়া যায়নি", desc: "এই পাতা নেই।", path: "404.html", up: "/", body: `<h1>পাতা নেই</h1><p class="lead">এই ঠিকানায় কিছু পাওয়া গেল না।</p><div class="cta"><a class="btn primary" href="/index.html">হোমে ফিরে যাও</a></div>` }));
wr("site/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);
wr("site/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${BASE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);

// ---------- version stamp on what a phone downloads ----------
const files = [...readdirSync(join(root, "site/js")).filter(f => f.endsWith(".js")).map(f => "site/js/" + f), ...readdirSync(join(root, "site/js/scenes")).map(f => "site/js/scenes/" + f),
  "site/style.css", "site/data/chapters.json", "site/data/quiz.json", "site/data/promos.json", ...Object.keys(scenes).map(id => `site/data/scenes/${id}.json`)];
const h = createHash("sha1"); for (const f of files) h.update(readFileSync(join(root, f)));
const VER = h.digest("hex").slice(0, 8);
const stamp = html => html.replace(/(href|src)="((?:\.\.\/)?(?:style\.css|js\/[\w-]+\.js))(?:\?v=\w+)?"/g, `$1="$2?v=${VER}"`);
for (const f of ["index.html", "scene.html", ...[...urls].filter(u => u.endsWith(".html")), "404.html"]) { const p = `site/${f}`; wr(p, stamp(rd(p))); }
console.log(`scenes: ${Object.keys(scenes).length} · pages: ${urls.length} · version: ${VER}`);
