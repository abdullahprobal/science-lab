// Scene: transverse wave, longitudinal wave, and two opposite waves making a standing wave. v = fλ.
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 100) / 100;

export function wave(p) { const k = 2 * Math.PI / p.lam, fr = p.v / p.lam; return { k, f: fr, T: 1 / fr, w: 2 * Math.PI * fr }; }
const X0 = -6, L = 12, N = 160;
let h, pts, posAttr;

export default {
  id: "waves",
  view: { theta: 0, phi: 1.5, r: 15 },
  params: [
    { key: "lam", label: "তরঙ্গদৈর্ঘ্য λ", unit: "m", min: 1, max: 6, step: 0.5, value: 3 },
    { key: "v", label: "তরঙ্গবেগ v", unit: "m/s", min: 0.5, max: 4, step: 0.5, value: 2 },
    { key: "mode", label: "কী দেখবে", value: "trans", choices: [{ v: "trans", label: "অনুপ্রস্থ" }, { v: "long", label: "অনুদৈর্ঘ্য" }, { v: "stand", label: "স্থির তরঙ্গ" }] },
  ],
  presets: [{ name: "অনুপ্রস্থ তরঙ্গ", values: { mode: "trans" } }, { name: "অনুদৈর্ঘ্য তরঙ্গ (শব্দ)", values: { mode: "long" } }, { name: "স্থির তরঙ্গ: নিস্পন্দ ও সুস্পন্দ বিন্দু", values: { mode: "stand", lam: 4 } }],
  init({ root, polyline, label }) {
    h = { a: polyline(0x4aa3ff, N), b: polyline(0xff8a3d, N), sum: polyline(0xf1ece0, N), lab: label("", 0xf1ece0) };
    pts = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 70), 3)), new THREE.PointsMaterial({ color: 0xf1ece0, size: 0.22 }));
    pts.frustumCulled = false; root.add(pts); posAttr = pts.geometry.attributes.position;
  },
  update(p, t) {
    const w = wave(p), xs = Array.from({ length: N }, (_, i) => X0 + L * i / (N - 1)), A = 1.2, Y = (x, s) => A * Math.sin(w.k * x - s * w.w * t);
    for (const k of ["a", "b", "sum"]) h[k].obj.visible = false; pts.visible = false; h.lab.hide();
    if (p.mode === "trans") { h.sum.set(xs.map(x => new THREE.Vector3(x, Y(x, 1), 0))); }
    else if (p.mode === "stand") {
      h.a.set(xs.map(x => new THREE.Vector3(x, Y(x, 1), 0))); h.b.set(xs.map(x => new THREE.Vector3(x, Y(x, -1), 0)));
      h.sum.set(xs.map(x => new THREE.Vector3(x, Y(x, 1) + Y(x, -1), 0))); h.lab.say("নিস্পন্দ বিন্দু (node)").set(new THREE.Vector3(X0 + p.lam / 2, -2.6, 0));
    } else {
      pts.visible = true;
      for (let i = 0; i < 70; i++) { const x0 = X0 + L * i / 69, d = 0.35 * Math.sin(w.k * x0 - w.w * t); posAttr.setXYZ(i, x0 + d * p.lam / 3, 0, 0); }
      posAttr.needsUpdate = true; h.lab.say("ঘন ও তনু অঞ্চল পালা করে চলে").set(new THREE.Vector3(X0, 1.5, 0));
    }
  },
  readouts(p) { const w = wave(p); return [{ label: "কম্পাঙ্ক f = v/λ", value: f(w.f), unit: "Hz" }, { label: "পর্যায়কাল T", value: f(w.T), unit: "s" }, { label: "তরঙ্গ সংখ্যা k = 2π/λ", value: f(w.k), unit: "rad/m" }, { label: "কৌণিক কম্পাঙ্ক ω", value: f(w.w), unit: "rad/s" }]; },
  steps(p) { const w = wave(p); return [
    `v = fλ। এখানে f = ${p.v} / ${p.lam} = ${f(w.f)} Hz, T = 1/f = ${f(w.T)} s।`,
    "অনুপ্রস্থ: কণা তরঙ্গের লম্বদিকে কাঁপে। অনুদৈর্ঘ্য: কণা তরঙ্গের দিকেই কাঁপে, ঘন (সংনমন) ও তনু (প্রসারণ) অঞ্চল তৈরি হয়।",
    "স্থির তরঙ্গ: y = A sin(kx−ωt) + A sin(kx+ωt) = 2A sin kx cos ωt। কোনো বিন্দুতে বিস্তার 2A sin kx।",
    `নিস্পন্দ বিন্দুগুলোর দূরত্ব λ/2 = ${f(p.lam / 2)} m।`]; },
  check(assert) {
    const w = wave({ lam: 2, v: 4 });
    assert(Math.abs(w.f - 2) < 1e-9 && Math.abs(w.T - 0.5) < 1e-9, "λ = 2 m, v = 4 m/s: f = 2 Hz, T = 0.5 s");
    assert(Math.abs(w.w - w.k * 4) < 1e-9, "ω = kv");
    const A = 1, k = 1.3, x = 0.7, t = 2.1, w2 = 2;
    assert(Math.abs(A * Math.sin(k * x - w2 * t) + A * Math.sin(k * x + w2 * t) - 2 * A * Math.sin(k * x) * Math.cos(w2 * t)) < 1e-12, "standing wave identity");
  },
};
