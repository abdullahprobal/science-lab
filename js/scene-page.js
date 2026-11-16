// Glue for scene.html: ?s=<id> loads data/scenes/<id>.json + js/scenes/<id>.js, mounts the viewer, tour and quiz. ?embed=1 hides the page chrome.
const v = new URL(import.meta.url).search, $ = id => document.getElementById(id), q = new URLSearchParams(location.search);
const id = (q.get("s") || "").replace(/[^a-z0-9-]/g, "");
if (q.get("embed")) document.body.classList.add("embed");
try {
  if (!id) throw new Error("no scene");
  const [{ createLab }, { renderQuiz }, mod, meta, promos, site] = await Promise.all([
    import("./shell.js" + v), import("./quiz.js" + v), import(`./scenes/${id}.js` + v),
    fetch(`data/scenes/${id}.json` + v).then(r => r.json()), fetch("data/promos.json" + v).then(r => r.json()), fetch("data/site.json" + v).then(r => r.json()).catch(() => ({}))]);
  document.title = `${meta.title_bn} | বিজ্ঞান ল্যাব`;
  $("crumb").textContent = `${meta.paper} · ${meta.chapter} · ${meta.title_en}`;
  $("title").textContent = meta.title_bn;
  $("intro").textContent = meta.intro;
  const lab = createLab({ stage: $("stage"), panel: $("panel"), scene: mod.default, meta });
  $("reset").onclick = lab.resetView;
  document.addEventListener("visibilitychange", () => lab.pause(document.hidden));
  $("readlink").href = `read/${id}.html`; $("readlink").hidden = false;
  const promo = (promos.filter(p => p.slot === "quiz" && (!p.ssc || meta.ssc))[0]);
  renderQuiz($("quiz"), meta.questions, { id, onDone: () => {
    if (promo && !$("quiz").querySelector(".promo")) $("quiz").insertAdjacentHTML("beforeend", `<a class="promo" href="${promo.url}${promo.url.includes("?") ? "&" : "?"}utm_source=lab&utm_medium=quiz" target="_blank" rel="noopener"><b>${promo.title}</b><span>${promo.text}</span><em>${promo.label} →</em></a>`);
    track(site, "quiz_done", { scene: id }); } });
  track(site, "scene_open", { scene: id });
} catch (e) {
  console.error(e);
  $("title").textContent = "এই দৃশ্য খোলা গেল না";
  $("intro").innerHTML = 'ব্রাউজার বা সংযোগে সমস্যা হতে পারে। <a href="index.html">সব অধ্যায়ে ফিরে যাও</a>।';
}
// Analytics events only if GA is configured (content/site.json ga_id). No personal data.
function track(site, name, params) {
  if (!site.ga_id) return;
  if (!window.gtag) {
    const s = document.createElement("script"); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${site.ga_id}`; document.head.append(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag("js", new Date()); gtag("config", site.ga_id, { anonymize_ip: true });
  }
  gtag("event", name, params);
}
