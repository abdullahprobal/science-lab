// Scene: a charged particle in a uniform magnetic field (B along +z). r = mv sinα / qB, a circle or a helix.
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 1000) / 1000, Q = 1.602e-19, PART = { p: { m: 1.673e-27, s: 1, name: "প্রোটন" }, e: { m: 9.109e-31, s: -1, name: "ইলেকট্রন" } };

// v in 10⁶ m/s, B in tesla, angle between v and B in degrees. Returns metres and seconds.
export function motion(p) {
  const P = PART[p.who], a = p.alpha * Math.PI / 180, v = p.v * 1e6, w = Q * p.B / P.m;
  return { r: P.m * v * Math.sin(a) / (Q * p.B), T: 2 * Math.PI * P.m / (Q * p.B), pitch: 2 * Math.PI / w * v * Math.cos(a), w, vz: v * Math.cos(a), s: P.s };
}
const T3 = (x, y, z) => new THREE.Vector3(x, z, -y);   // physics (x, y, z up) -> three
let h, ball;

export default {
  id: "magfield",
  view: { theta: 0.7, phi: 1.1, r: 12 },
  params: [
    { key: "who", label: "কণা", value: "p", choices: [{ v: "p", label: "প্রোটন" }, { v: "e", label: "ইলেকট্রন" }] },
    { key: "v", label: "বেগ v", unit: "×10⁶ m/s", min: 1, max: 10, step: 1, value: 5 },
    { key: "B", label: "ক্ষেত্র B", unit: "T", min: 0.2, max: 2, step: 0.1, value: 1 },
    { key: "alpha", label: "v ও B এর মধ্যবর্তী কোণ", unit: "°", min: 10, max: 90, step: 5, value: 90 },
  ],
  presets: [{ name: "লম্বভাবে: বৃত্ত", values: { alpha: 90 } }, { name: "তির্যকভাবে: কুণ্ডলী (হেলিক্স)", values: { alpha: 50 } }, { name: "ইলেকট্রন: উল্টো দিকে ঘোরে", values: { who: "e", alpha: 90 } }],
  init({ root, arrow, polyline, label }) {
    ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })); root.add(ball);
    h = { path: polyline(0x98948a, 241), v: arrow(0x4aa3ff), fl: arrow(0xff4d4d), lv: label("v", 0x4aa3ff), lf: label("F", 0xff4d4d), B: [-3, 0, 3].flatMap(x => [-3, 0, 3].map(y => arrow(0x4fd68a, { r: 0.015, opacity: 0.5 }).set(T3(x, y, -3), T3(x, y, 3)))) };
    label("B", 0x4fd68a).set(T3(3.3, 3.3, 3));
  },
  update(p, t) {
    const m = motion(p), r = Math.max(m.r, 1e-12), turns = 3, zspan = Math.max(Math.abs(m.pitch), 1e-12) * turns;
    const s = Math.min(2.6 / r, 5.5 / zspan);                                           // draw to fit, true numbers are in the readouts
    const at = ph => T3(r * s * Math.cos(-m.s * ph) , r * s * Math.sin(-m.s * ph), (ph / (2 * Math.PI) * m.pitch - zspan / 2) * s);
    h.path.set(Array.from({ length: 241 }, (_, i) => at(i / 240 * turns * 2 * Math.PI)));
    const ph = (t * 1.5) % (turns * 2 * Math.PI), P = at(ph); ball.position.copy(P); ball.material.color.set(m.s > 0 ? 0xff4d4d : 0x4aa3ff);
    const vel = at(ph + 0.05).sub(P).normalize().multiplyScalar(1.5), toC = T3(0, 0, 0).setY(P.y).sub(P).normalize().multiplyScalar(1.2);
    h.v.set(P, P.clone().add(vel)); h.lv.set(P.clone().add(vel)); if (m.r > 1e-9) { h.fl.set(P, P.clone().add(toC)); h.lf.set(P.clone().add(toC)); } else { h.fl.hide(); h.lf.hide(); }
  },
  readouts(p) { const m = motion(p); return [
    { label: "ব্যাসার্ধ r = mv sinα / qB", value: f(m.r * 1000), unit: "mm", color: 0xffb02e }, { label: "পর্যায়কাল T = 2πm / qB", value: f(m.T * 1e9), unit: "ns" },
    { label: "পিচ (এক পাকে অক্ষ বরাবর সরণ)", value: f(m.pitch * 1000), unit: "mm" }, { label: "কণা", value: PART[p.who].name }]; },
  steps(p) { const m = motion(p); return [
    "চৌম্বক বল F = qv × B, সবসময় বেগের লম্ব। তাই বল কাজ করে না, বেগের মান বদলায় না, শুধু দিক বদলায়।",
    "বেগের B-লম্ব উপাংশ v sinα কণাকে বৃত্তে ঘোরায়: qvB sinα = mv²sin²α / r, তাই r = mv sinα / qB।",
    `T = 2πm / qB = ${f(m.T * 1e9)} ns। T এ বেগের মান বা r এর ওপর নির্ভর করে না।`,
    "B-সমান্তরাল উপাংশ v cosα বল পায় না, তাই কণা অক্ষ বরাবর সমবেগে এগোয়: পথ কুণ্ডলী।"]; },
  check(assert) {
    const m = motion({ who: "p", v: 1, B: 1, alpha: 90 });
    assert(Math.abs(m.r - 0.01044) < 2e-5, "proton, 10⁶ m/s, 1 T, 90°: r = 1.04 cm");
    assert(Math.abs(m.pitch) < 1e-12, "perpendicular: no pitch, a circle");
    assert(Math.abs(motion({ who: "p", v: 1, B: 1, alpha: 90 }).T - motion({ who: "p", v: 9, B: 1, alpha: 30 }).T) < 1e-15, "T does not depend on speed or angle");
    assert(motion({ who: "e", v: 1, B: 1, alpha: 90 }).r < m.r / 1000, "electron circle is about 1836 times smaller");
    assert(motion({ who: "p", v: 1, B: 2, alpha: 90 }).r * 2 - m.r < 1e-12, "double B halves r");
  },
};
