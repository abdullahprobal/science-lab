// Scene: launch a satellite tangentially from r = 1 (units GM = 1, so circular speed = 1 and escape speed = √2).
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 100) / 100, RE = 0.55;

export function kind(v) { return v < 1 - 1e-9 ? "ellipse-in" : Math.abs(v - 1) < 1e-9 ? "circle" : v < Math.SQRT2 - 1e-9 ? "ellipse-out" : "escape"; }
// Leapfrog integration of one orbit; stops on impact with the Earth, escape, or after one revolution-ish.
export function path(v) {
  let x = 1, y = 0, vx = 0, vy = v; const pts = [[x, y]], dt = 0.01;
  for (let i = 0; i < 4000; i++) {
    let r = Math.hypot(x, y); vx -= x / r ** 3 * dt / 2; vy -= y / r ** 3 * dt / 2;
    x += vx * dt; y += vy * dt; r = Math.hypot(x, y); vx -= x / r ** 3 * dt / 2; vy -= y / r ** 3 * dt / 2;
    if (i % 8 === 0) pts.push([x, y]);
    if (r < RE || r > 14) break;
  }
  return pts;
}
let h, sat, key, pts;
const NAME = { "ellipse-in": "উপবৃত্তাকার (ভেতরে নামে)", circle: "বৃত্তাকার", "ellipse-out": "উপবৃত্তাকার (দূরে যায়)", escape: "মুক্ত: ফিরে আসে না" };

export default {
  id: "orbits",
  view: { theta: 0, phi: 0.35, r: 14 },
  params: [{ key: "v", label: "উৎক্ষেপণ বেগ ÷ বৃত্তাকার কক্ষের বেগ", min: 0.3, max: 1.6, step: 0.05, value: 1 }],
  presets: [
    { name: "বৃত্তাকার কক্ষপথ", values: { v: 1 } }, { name: "কম বেগ: নিচে নামে", values: { v: 0.6 } },
    { name: "বেশি বেগ: লম্বাটে উপবৃত্ত", values: { v: 1.3 } }, { name: "পলায়ন বেগ √2 ≈ ১.৪১", values: { v: 1.45 } },
  ],
  init({ root, polyline }) {
    root.add(new THREE.Mesh(new THREE.SphereGeometry(RE * 2, 32, 20), new THREE.MeshBasicMaterial({ color: 0x4aa3ff, wireframe: true })));
    sat = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb02e })); root.add(sat);
    h = { path: polyline(0x98948a, 501) };
  },
  update(p, t) {
    if (key !== p.v) { key = p.v; pts = path(p.v); const P = pts.map(q => new THREE.Vector3(q[0] * 2, 0, -q[1] * 2)); while (P.length < 501) P.push(P[P.length - 1]); h.path.set(P.slice(0, 501)); }
    const i = Math.floor(t * 40) % pts.length, q = pts[i]; sat.position.set(q[0] * 2, 0, -q[1] * 2);
  },
  readouts(p) {
    const E = p.v * p.v / 2 - 1;
    return [{ label: "কক্ষপথ", value: NAME[kind(p.v)] }, { label: "মোট শক্তি E (GM/r₀ এককে)", value: f(E) }, { label: "পলায়ন বেগ ÷ বৃত্তাকার বেগ", value: "√2 = 1.41", color: 0xffb02e }];
  },
  steps(p) { return [
    "বৃত্তাকার কক্ষে মহাকর্ষই কেন্দ্রমুখী বল: GMm/r² = mv²/r, তাই v = √(GM/r)।",
    "মোট শক্তি E = ½mv² − GMm/r। E < 0 হলে কক্ষ বদ্ধ (উপবৃত্ত), E = 0 হলে পলায়ন।",
    "E = 0 থেকে ½v² = GM/r, তাই পলায়ন বেগ = √(2GM/r) = √2 × বৃত্তাকার বেগ।",
    `এখানে বেগ = ${p.v} × বৃত্তাকার বেগ, ফল: ${NAME[kind(p.v)]}।`]; },
  check(assert) {
    assert(kind(1) === "circle" && kind(0.6) === "ellipse-in" && kind(1.3) === "ellipse-out" && kind(1.45) === "escape", "orbit type from launch speed");
    const c = path(1), r = Math.hypot(...c[Math.floor(c.length / 2)]);
    assert(Math.abs(r - 1) < 0.02, "circular speed keeps r = 1");
    assert(Math.hypot(...path(0.6).at(-1)) < RE + 0.05, "too slow: the satellite hits the Earth");
    assert(Math.hypot(...path(1.45).at(-1)) > 10, "above escape speed: flies away");
  },
};
