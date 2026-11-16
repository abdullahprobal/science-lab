// The one viewer. Scenes (js/scenes/*.js) only hold physics; everything shared lives here.
// Scene contract: see docs/PLAN.md. Own code, uses three.js (MIT).
import * as THREE from "../vendor/three.module.js";

// One colour per quantity, used the same way in every scene.
export const COLORS = { velocity: 0x4aa3ff, acceleration: 0xff8a3d, force: 0xff4d4d, electric: 0xffd84a,
  magnetic: 0x4fd68a, current: 0xb48cff, ink: 0xf1ece0, dim: 0x98948a, lamp: 0xffb02e };
const hex = n => "#" + n.toString(16).padStart(6, "0");
export const fmt = n => Number.isFinite(n) ? String(Math.round(n * 100) / 100) : "—";
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function createLab({ stage, panel = null, scene, meta = {}, values = {}, ambient = false, still = false }) {
  const root = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x050607, 1);
  stage.prepend(renderer.domElement);
  const tags = document.createElement("div"); tags.className = "tags"; stage.append(tags);
  const dom = renderer.domElement;
  let ratio = Math.min(devicePixelRatio || 1, 2), low = false, W = 1, H = 1;

  function resize() {
    W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    renderer.setPixelRatio(ratio); renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // keep the whole scene in view on a tall phone stage
    camera.fov = W / H < 1.2 ? 62 : 45; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);

  // ---------- orbit: one finger turns, two fingers zoom, wheel zooms ----------
  const home = { theta: 0.75, phi: 1.05, r: 15, ...(scene.view || {}) };
  const view = { ...home };
  let auto = true, tween = null;
  if (!ambient) {
    const pts = new Map(); let pinch = 0;
    dom.style.touchAction = "none";
    dom.addEventListener("pointerdown", e => { dom.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); auto = false; tween = null; });
    dom.addEventListener("pointermove", e => {
      const p = pts.get(e.pointerId); if (!p) return;
      if (pts.size === 1) { view.theta -= (e.clientX - p[0]) * 0.008; view.phi = clamp(view.phi - (e.clientY - p[1]) * 0.008, 0.15, Math.PI - 0.15); }
      p[0] = e.clientX; p[1] = e.clientY;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) view.r = clamp(view.r * pinch / d, 6, 40); pinch = d; }
    });
    const up = e => { pts.delete(e.pointerId); pinch = 0; };
    dom.addEventListener("pointerup", up); dom.addEventListener("pointercancel", up);
    dom.addEventListener("wheel", e => { e.preventDefault(); view.r = clamp(view.r * (1 + e.deltaY * 0.001), 6, 40); auto = false; }, { passive: false });
  }
  function resetView() { tween = { ...home }; auto = false; }

  // ---------- helpers handed to scenes ----------
  const V = () => new THREE.Vector3();
  function arrow(color, { r = 0.04, opacity = 1 } = {}) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), mat);
    const head = new THREE.Mesh(new THREE.ConeGeometry(r * 3, 1, 14), mat);
    g.add(shaft, head); root.add(g);
    const Y = new THREE.Vector3(0, 1, 0), d = V(), q = new THREE.Quaternion();
    return { obj: g,
      set(from, to) {
        d.subVectors(to, from); const len = d.length();
        if (len < 1e-6) { g.visible = false; return this; }
        g.visible = true; d.divideScalar(len);
        const h = Math.min(0.4, len * 0.45), s = len - h; q.setFromUnitVectors(Y, d);
        shaft.quaternion.copy(q); shaft.scale.set(1, Math.max(s, 1e-3), 1); shaft.position.copy(from).addScaledVector(d, s / 2);
        head.quaternion.copy(q); head.scale.set(1, h, 1); head.position.copy(from).addScaledVector(d, s + h / 2);
        return this;
      },
      hide() { g.visible = false; return this; } };
  }
  function line(color, { dashed = false, opacity = 1 } = {}) {
    const geo = new THREE.BufferGeometry().setFromPoints([V(), V()]);
    const mat = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity })
                       : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const l = new THREE.Line(geo, mat); root.add(l);
    return { obj: l,
      set(a, b) {
        const p = geo.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true;
        geo.computeBoundingSphere(); if (dashed) l.computeLineDistances(); l.visible = true; return this;
      },
      hide() { l.visible = false; return this; } };
  }
  function polyline(color, n) {
    const geo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: n }, V));
    const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color })); l.frustumCulled = false; root.add(l);
    return { obj: l,
      set(pts) { pts.forEach((p, i) => geo.attributes.position.setXYZ(i, p.x, p.y, p.z)); geo.attributes.position.needsUpdate = true; l.visible = true; return this; },
      hide() { l.visible = false; return this; } };
  }
  function quad(color, opacity = 0.18) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
    m.frustumCulled = false; root.add(m);
    return { obj: m,
      set(a, b, c, d) { [a, b, c, d].forEach((p, i) => geo.attributes.position.setXYZ(i, p.x, p.y, p.z)); geo.attributes.position.needsUpdate = true; m.visible = true; return this; },
      hide() { m.visible = false; return this; } };
  }
  const labels = [];
  function label(text, color = COLORS.ink) {
    const el = document.createElement("span"); el.className = "tag"; el.innerHTML = text; el.style.color = hex(color); tags.append(el);
    const L = { el, pos: V(), on: false, text: text,
      set(v) { L.pos.copy(v); L.on = true; return L; },
      hide() { L.on = false; return L; },
      say(t) { if (t !== L.text) { L.text = t; el.innerHTML = t; } return L; } };
    labels.push(L); return L;
  }
  function button(text, fn) {
    const b = document.createElement("button"); b.type = "button"; b.className = "stagebtn"; b.textContent = text; b.onclick = fn; stage.append(b); return b;
  }
  const ctx = { THREE, root, camera, stage, button, colors: COLORS, arrow, line, polyline, quad, label, get low() { return low; } };
  scene.init(ctx);

  // ---------- state + panel ----------
  const p = {};
  for (const q of scene.params) p[q.key] = values[q.key] ?? q.value;
  const sync = [];   // functions that push p back into the controls
  const out = { reads: null, steps: null };
  function render() {
    if (!panel) return;
    out.reads.innerHTML = scene.readouts(p).map(r =>
      `<div><dt>${r.color ? `<i style="background:${hex(r.color)}"></i>` : ""}${r.label}</dt><dd>${r.value}${r.unit ? ` <small>${r.unit}</small>` : ""}</dd></div>`).join("");
    out.steps.innerHTML = scene.steps(p).map(s => `<li>${s}</li>`).join("");
  }
  if (panel) {
    panel.innerHTML = `<div class="presets" role="group" aria-label="উদাহরণ"></div><div class="params"></div><dl class="reads"></dl><h2 class="stepsh">ধাপে ধাপে</h2><ol class="steps"></ol>`;
    const presets = panel.querySelector(".presets"), params = panel.querySelector(".params");
    out.reads = panel.querySelector(".reads"); out.steps = panel.querySelector(".steps");
    for (const pr of scene.presets || []) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = pr.name;
      b.onclick = () => { Object.assign(p, pr.values); sync.forEach(f => f()); render(); };
      presets.append(b);
    }
    for (const q of scene.params) {
      const wrap = document.createElement("div"); wrap.className = "par";
      if (q.choices) {
        wrap.classList.add("choice"); wrap.setAttribute("role", "group");
        wrap.innerHTML = `<span class="pn">${q.label}</span><div class="seg"></div>`;
        const seg = wrap.querySelector(".seg"), btns = q.choices.map(c => {
          const b = document.createElement("button"); b.type = "button"; b.innerHTML = c.label;
          b.onclick = () => { p[q.key] = c.v; sync.forEach(f => f()); render(); }; seg.append(b); return b;
        });
        sync.push(() => q.choices.forEach((c, i) => btns[i].setAttribute("aria-pressed", String(p[q.key] === c.v))));
      } else {
        wrap.innerHTML = `<label><span class="pn">${q.label}${q.unit ? ` <em>${q.unit}</em>` : ""}</span><output></output>` +
          `<input type="range" min="${q.min}" max="${q.max}" step="${q.step ?? 1}"></label>`;
        const inp = wrap.querySelector("input"), o = wrap.querySelector("output");
        inp.oninput = () => { p[q.key] = +inp.value; o.textContent = fmt(p[q.key]); render(); };
        sync.push(() => { inp.value = p[q.key]; o.textContent = fmt(p[q.key]); });
      }
      params.append(wrap);
    }
    sync.forEach(f => f()); render();
  }


  // ---------- guided tour: next/back through captioned steps that set the sliders and the camera ----------
  let tourBar = null;
  function tourStep(i) {
    const steps = meta.tour, st = steps[i];
    if (st.values) { Object.assign(p, st.values); sync.forEach(f => f()); render(); }
    if (st.view) { tween = { ...home, ...st.view }; auto = false; }
    tourBar.querySelector(".cap").textContent = st.caption;
    tourBar.querySelector(".n").textContent = `${i + 1}/${steps.length}`;
    tourBar.querySelector(".prev").disabled = i === 0;
    tourBar.querySelector(".next").textContent = i === steps.length - 1 ? "শেষ" : "পরের ›";
    tourBar.dataset.i = i;
  }
  if (panel && meta.tour && meta.tour.length) {
    tourBar = document.createElement("div"); tourBar.className = "tour"; tourBar.hidden = true;
    tourBar.innerHTML = '<p class="cap"></p><div class="tb"><button class="prev" type="button">‹ আগের</button><span class="n"></span><button class="next" type="button"></button><button class="x" type="button" aria-label="টুর বন্ধ">✕</button></div>';
    stage.append(tourBar);
    const go = d => { const i = +tourBar.dataset.i + d; if (i >= meta.tour.length) tourBar.hidden = true; else tourStep(i); };
    tourBar.querySelector(".prev").onclick = () => go(-1); tourBar.querySelector(".next").onclick = () => go(1);
    tourBar.querySelector(".x").onclick = () => { tourBar.hidden = true; };
    button("▶ টুর", () => { tourBar.hidden = false; tourStep(0); }).classList.add("tourbtn");
  }

  // ---------- frame loop ----------
  let last = performance.now(), start = last, frames = 0, checked = false, run = true, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1); last = now; frames++;
    if (!checked && now - start >= 3000) {      // low-power: under 20 fps in the first 3 s
      checked = true;
      if (frames / ((now - start) / 1000) < 20) { low = true; ratio = 1; resize(); }
    }
    if (tween) { for (const k of ["theta", "phi", "r"]) view[k] += (tween[k] - view[k]) * 0.1; if (Math.abs(tween.theta - view.theta) + Math.abs(tween.phi - view.phi) < 0.01) tween = null; }
    if (auto && !still) view.theta += dt * (ambient ? 0.12 : 0.25);
    const sp = Math.sin(view.phi);
    camera.position.set(view.r * sp * Math.sin(view.theta), view.r * Math.cos(view.phi), view.r * sp * Math.cos(view.theta));
    camera.lookAt(0, 0, 0);
    scene.update(p, now / 1000, dt);
    renderer.render(root, camera);
    if (!ambient) for (const L of labels) {
      const v = L.pos.clone().project(camera);
      L.el.style.display = L.on && v.z < 1 ? "" : "none";
      L.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px,${(-v.y * 0.5 + 0.5) * H}px)`;
    }
  }
  resize(); raf = requestAnimationFrame(frame);
  return {
    p, resetView,
    pause(on) { if (on && run) { run = false; cancelAnimationFrame(raf); } else if (!on && !run) { run = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
  };
}
