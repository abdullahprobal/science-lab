// Scene: a coil turning in a uniform field (AC generator). Φ = NBA cos ωt, emf = −dΦ/dt = NBAω sin ωt. B along +x.
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 100) / 100;

export function gen(p) { const w = 2 * Math.PI * p.f, A = p.A * 1e-4; return { w, flux0: p.N * p.B * A, emf0: p.N * p.B * A * w }; }
export const flux = (p, t) => gen(p).flux0 * Math.cos(gen(p).w * t);
export const emf = (p, t) => gen(p).emf0 * Math.sin(gen(p).w * t);   // e = −dΦ/dt
let h;

export default {
  id: "induction",
  view: { theta: 0.9, phi: 1.2, r: 14 },
  params: [
    { key: "N", label: "পাক সংখ্যা N", min: 1, max: 100, step: 1, value: 20 },
    { key: "B", label: "B", unit: "T", min: 0.1, max: 1, step: 0.1, value: 0.5 },
    { key: "A", label: "ক্ষেত্রফল A", unit: "cm²", min: 50, max: 500, step: 50, value: 200 },
    { key: "f", label: "ঘূর্ণন কম্পাঙ্ক f (ধীরে দেখানো)", unit: "Hz", min: 0.25, max: 2, step: 0.25, value: 0.5 },
  ],
  presets: [{ name: "বেশি পাক", values: { N: 80 } }, { name: "দ্রুত ঘোরা", values: { f: 2 } }, { name: "শক্তিশালী চুম্বক", values: { B: 1 } }],
  init({ root, arrow, polyline, label }) {
    h = { coil: polyline(0xffb02e, 5), flux: polyline(0x4fd68a, 121), emf: polyline(0xffb02e, 121), B: [-2, 0, 2].map(z => arrow(0x4fd68a, { r: 0.02, opacity: 0.6 }).set(new THREE.Vector3(-5, 0.0, z), new THREE.Vector3(-3, 0.0, z))).concat([-2, 2].map(y => arrow(0x4fd68a, { r: 0.02, opacity: 0.6 }).set(new THREE.Vector3(-5, y, 0), new THREE.Vector3(-3, y, 0)))) };
    label("B →", 0x4fd68a).set(new THREE.Vector3(-4, 2.6, 0)); label("Φ", 0x4fd68a).set(new THREE.Vector3(-4.3, -2.4, 0)); label("emf", 0xffb02e).set(new THREE.Vector3(-4.3, -5.2, 0));
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 2, 0)]), new THREE.LineBasicMaterial({ color: 0x98948a })));
  },
  update(p, t) {
    const g = gen(p), ph = g.w * t, u = new THREE.Vector3(-Math.sin(ph), 0, Math.cos(ph)), up = new THREE.Vector3(0, 1, 0), w = 1.6, hh = 2;
    h.coil.set([[1, 1], [-1, 1], [-1, -1], [1, -1], [1, 1]].map(([a, b]) => u.clone().multiplyScalar(a * w).addScaledVector(up, b * hh)));
    const pl = (key, fn, y0) => h[key].set(Array.from({ length: 121 }, (_, i) => new THREE.Vector3(-3.5 + i * 0.07, y0 + fn(p, t - (120 - i) / 120 * 2 / p.f) * 1.2, 0)));
    // curves are drawn as a fraction of their peak so both always fit
    const nf = (fn, peak) => (pp, tt) => fn(pp, tt) / (peak || 1);
    pl("flux", nf(flux, g.flux0), -2.5); pl("emf", nf(emf, g.emf0), -5.5);
  },
  readouts(p) { const g = gen(p); return [
    { label: "সর্বোচ্চ ফ্লাক্স NBA", value: f(g.flux0), unit: "Wb", color: 0x4fd68a }, { label: "সর্বোচ্চ emf NBAω", value: f(g.emf0), unit: "V", color: 0xffb02e },
    { label: "ω = 2πf", value: f(g.w), unit: "rad/s" }]; },
  steps(p) { const g = gen(p); return [
    `ফ্লাক্স Φ = NBA cos ωt। সর্বোচ্চ = ${p.N} × ${p.B} × ${p.A}×10⁻⁴ = ${f(g.flux0)} Wb।`,
    "ফারাডের সূত্র: emf = −dΦ/dt = NBAω sin ωt। ফ্লাক্স সর্বোচ্চ হলে emf শূন্য, ফ্লাক্স শূন্য হলে (কুণ্ডলী B এর সমান্তরাল) emf সর্বোচ্চ।",
    `সর্বোচ্চ emf = NBAω = ${f(g.emf0)} V। N, B, A বা f দ্বিগুণ করলে emf দ্বিগুণ।`,
    "ছবিতে সোনালি কুণ্ডলী ঘুরছে; সবুজ ও সোনালি রেখা ফ্লাক্স ও emf এর লেখ, তাদের মধ্যে ৯০° পার্থক্য।"]; },
  check(assert) {
    const p = { N: 100, B: 0.5, A: 200, f: 50 };
    assert(Math.abs(gen(p).emf0 - 100 * 0.5 * 0.02 * 2 * Math.PI * 50) < 1e-9, "N=100, B=0.5 T, A=200 cm², 50 Hz: peak emf = 314.16 V");
    assert(Math.abs(emf(p, 0)) < 1e-9 && Math.abs(flux(p, 0) - gen(p).flux0) < 1e-12, "at t = 0 the flux is maximum and the emf is zero");
    assert(Math.abs(emf(p, 1 / 200) - gen(p).emf0) < 1e-6, "emf peaks a quarter period later");
    const e = (a) => emf(p, a), d = 1e-7, t0 = 0.003; assert(Math.abs(-(flux(p, t0 + d) - flux(p, t0 - d)) / (2 * d) - e(t0)) < 1e-3, "emf = −dΦ/dt numerically");
  },
};
