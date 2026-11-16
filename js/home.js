// Glue for index.html: a slowly turning scene behind the headline, the chapter list, and today's five questions.
const v = new URL(import.meta.url).search, $ = id => document.getElementById(id);
const { getProgress, renderQuiz } = await import("./quiz.js" + v);
const prog = getProgress();

fetch("data/chapters.json" + v).then(r => r.json()).then(data => {
  $("chapters").innerHTML = data.subjects.map(s => `<div class="subj"><h2 id="${s.id}">${s.name}</h2>${s.door ? `<p class="door"><a href="${s.door.url}">${s.door.title} →</a></p>` : ""}` +
    s.papers.map(p => `<section><h3>${p.name}</h3><ol>${p.chapters.map(c => {
      const sc = c.scenes.map(x => `<a href="scene.html?s=${x.id}">${x.title_bn}${prog[x.id] ? ` <i class="done" title="${prog[x.id].score}/${prog[x.id].total}">✓</i>` : ""}</a>`).join("");
      return `<li${sc ? "" : ' class="soon"'}><span class="no">${String(c.no).padStart(2, "0")}</span><span class="nm">${c.name}</span>${sc ? `<span class="sc">${sc}</span>` : "<em>শীঘ্রই</em>"}</li>`;
    }).join("")}</ol></section>`).join("") + "</div>").join("");
}).catch(() => { $("chapters").textContent = "তালিকা লোড হয়নি। পাতা রিফ্রেশ করো।"; });

// Today's five: same five all day (seeded by the date); scenes you got wrong come first, then ones you have not tried.
fetch("data/quiz.json" + v).then(r => r.json()).then(all => {
  const day = Math.floor(Date.now() / 864e5); let s = day % 2147483647 || 1; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const rank = q => { const p = prog[q.scene]; return (!p ? 1 : p.score < p.total ? 0 : 2) + rnd() * 0.9; };
  const five = all.map(q => [rank(q), q]).sort((a, b) => a[0] - b[0]).map(x => x[1]).filter((q, i, a) => a.findIndex(o => o.scene === q.scene) === i).slice(0, 5);
  renderQuiz($("daily"), five.map(q => ({ ...q, q: `<small>${q.title}</small><br>${q.q}` })));
}).catch(() => { $("dailybox").hidden = true; });

try {   // the backdrop is decoration: if WebGL is missing the page still works
  const [{ createLab }, mod] = await Promise.all([import("./shell.js" + v), import("./scenes/vectors.js" + v)]);
  const stage = $("backdrop");
  const lab = createLab({ stage, scene: mod.default, ambient: true, still: matchMedia("(prefers-reduced-motion: reduce)").matches,
    values: { ax: 3, ay: 1, az: 0, bx: -1, by: 3, bz: 2, mode: "cross" } });
  new IntersectionObserver(([e]) => lab.pause(!e.isIntersecting)).observe(stage);
} catch (e) { console.warn("backdrop off:", e); }
