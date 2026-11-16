// Scene: simple harmonic motion as the shadow of uniform circular motion; the sine curve is drawn as time flows.
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 100) / 100;

export function state(p, t) {
  const w = 2 * Math.PI / p.T, ph = w * t;
  return { w, x: p.A * Math.sin(ph), v: p.A * w * Math.cos(ph), a: -w * w * p.A * Math.sin(ph), ph };
}
let h, bob;

export default {
  id: "shm",
  view: { theta: 0, phi: 1.5, r: 17 },
  params: [
    { key: "A", label: "বিস্তার A", unit: "m", min: 0.5, max: 3, step: 0.5, value: 2 },
    { key: "T", label: "পর্যায়কাল T", unit: "s", min: 1, max: 5, step: 0.5, value: 3 },
  ],
  presets: [{ name: "ছোট বিস্তার", values: { A: 1, T: 3 } }, { name: "বড় বিস্তার, একই T (T বদলায় না)", values: { A: 3, T: 3 } }, { name: "দ্রুত দোলন", values: { A: 2, T: 1 } }],
  init({ root, polyline, line, label }) {
    bob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshBasicMaterial({ color: 0xf1ece0 })); root.add(bob);
    h = { circle: polyline(0x2a2925, 65), curve: polyline(0x4fd68a, 121), shadow: line(0xffb02e, { dashed: true }), P: new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb02e })), lx: label("x", 0xffb02e) };
    root.add(h.P);
  },
  update(p, t) {
    const s = state(p, t), cx = -5, k = 1.1;
    h.circle.set(Array.from({ length: 65 }, (_, i) => new THREE.Vector3(cx + p.A * k * Math.cos(i / 64 * 6.2832), p.A * k * Math.sin(i / 64 * 6.2832), 0)));
    const P = new THREE.Vector3(cx + p.A * k * Math.cos(s.ph), p.A * k * Math.sin(s.ph), 0); h.P.position.copy(P);
    h.curve.set(Array.from({ length: 121 }, (_, i) => { const dt = i / 120 * 2.2 * p.T, q = state(p, t - dt); return new THREE.Vector3(cx + p.A * k + 1 + i * 0.07, q.x * k, 0); }));
    const tip = new THREE.Vector3(cx + p.A * k + 1, s.x * k, 0); h.shadow.set(P, tip); bob.position.copy(tip); h.lx.set(tip.clone().add(new THREE.Vector3(0.4, 0.4, 0)));
  },
  readouts(p) { const s = state(p, 0); return [
    { label: "কৌণিক কম্পাঙ্ক ω = 2π/T", value: f(s.w), unit: "rad/s" }, { label: "কম্পাঙ্ক f = 1/T", value: f(1 / p.T), unit: "Hz" },
    { label: "সর্বোচ্চ বেগ ωA", value: f(s.w * p.A), unit: "m/s", color: 0x4aa3ff }, { label: "সর্বোচ্চ ত্বরণ ω²A", value: f(s.w * s.w * p.A), unit: "m/s²", color: 0xff8a3d }]; },
  steps(p) { const w = 2 * Math.PI / p.T; return [
    `ω = 2π/T = ${f(w)} rad/s। বৃত্তে বিন্দুটি ω হারে ঘোরে।`,
    "বিন্দুটির ঊর্ধ্বমুখী ছায়াই সরল ছন্দিত স্পন্দন: x = A sin ωt।",
    "বেগ v = Aω cos ωt, সাম্যাবস্থানে (x = 0) সর্বোচ্চ। ত্বরণ a = −ω²x, প্রান্তে সর্বোচ্চ ও সবসময় সাম্যাবস্থানের দিকে।",
    "সবুজ রেখা: গত কয়েকটি দোলনের x-t লেখ। বিস্তার বাড়ালে T বদলায় না।"]; },
  check(assert) {
    const p = { A: 2, T: 4 }, w = Math.PI / 2;
    assert(Math.abs(state(p, 1).x - 2) < 1e-9, "x = A at t = T/4");
    assert(Math.abs(state(p, 0).v - 2 * w) < 1e-9, "v = Aω at x = 0");
    const s = state(p, 0.7); assert(Math.abs(s.a + w * w * s.x) < 1e-9, "a = −ω²x");
    assert(Math.abs(s.v * s.v + w * w * s.x * s.x - w * w * p.A * p.A) < 1e-9, "v² = ω²(A² − x²)");
  },
};
