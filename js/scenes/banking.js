// Scene: car on a banked circular road (HSC 1st paper, Newtonian mechanics). Cross-section: centre of the circle is to the left.
import * as THREE from "../../vendor/three.module.js";
const g = 9.8, rad = d => d * Math.PI / 180, f = n => Math.round(n * 100) / 100;

// Per kg of the car: normal force, friction along the slope (positive = up the slope), ideal speed with no friction.
export function calc(p) {
  const a = rad(p.theta), ac = p.v * p.v / p.r;
  return { ac, N: g * Math.cos(a) + ac * Math.sin(a), fr: g * Math.sin(a) - ac * Math.cos(a), vIdeal: Math.sqrt(p.r * g * Math.tan(a)) };
}
let h, car;

export default {
  id: "banking",
  view: { theta: 0, phi: 1.5, r: 12 },
  params: [
    { key: "theta", label: "ঢাল θ", unit: "°", min: 5, max: 45, step: 1, value: 30 },
    { key: "r", label: "বাঁকের ব্যাসার্ধ r", unit: "m", min: 20, max: 100, step: 5, value: 50 },
    { key: "v", label: "গাড়ির বেগ v", unit: "m/s", min: 5, max: 35, step: 1, value: 17 },
  ],
  presets: [
    { name: "আদর্শ বেগে: ঘর্ষণ লাগে না", values: { theta: 45, r: 50, v: 22 } },
    { name: "ধীরে চললে: পিছলে নামতে চায়", values: { theta: 30, r: 50, v: 10 } },
    { name: "জোরে চললে: বাইরে ছিটকাতে চায়", values: { theta: 30, r: 50, v: 28 } },
  ],
  init({ root, arrow, line, label }) {
    car = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1), new THREE.MeshBasicMaterial({ color: 0x98948a })); root.add(car);
    h = { road: line(0xf1ece0), axis: line(0x98948a, { dashed: true, opacity: 0.6 }), w: arrow(0xff4d4d), n: arrow(0xff4d4d), c: arrow(0xff8a3d), fr: arrow(0xffb02e),
      lw: label("mg", 0xff4d4d), ln: label("N", 0xff4d4d), lc: label("mv²/r", 0xff8a3d), lf: label("ঘর্ষণ", 0xffb02e) };
  },
  update(p) {
    const c = calc(p), a = rad(p.theta), up = new THREE.Vector3(Math.cos(a), Math.sin(a), 0), nrm = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0), O = new THREE.Vector3(0, 0, 0);
    h.road.set(up.clone().multiplyScalar(-5), up.clone().multiplyScalar(5)); h.axis.set(new THREE.Vector3(-6, 0, 0), new THREE.Vector3(-6, 5, 0));
    car.position.copy(nrm.clone().multiplyScalar(0.4)); car.rotation.z = a;
    const m = 2 / g, C = nrm.clone().multiplyScalar(0.5);
    h.w.set(C, C.clone().add(new THREE.Vector3(0, -g * m, 0))); h.lw.set(C.clone().add(new THREE.Vector3(0.3, -g * m - 0.2, 0)));
    h.n.set(C, C.clone().add(nrm.clone().multiplyScalar(c.N * m))); h.ln.set(C.clone().add(nrm.clone().multiplyScalar(c.N * m + 0.3)));
    h.c.set(new THREE.Vector3(0, 3.5, 0), new THREE.Vector3(-c.ac * m, 3.5, 0)); h.lc.set(new THREE.Vector3(-c.ac * m, 3.9, 0));
    if (Math.abs(c.fr) > 0.05) { const d = up.clone().multiplyScalar(Math.sign(c.fr) * Math.min(Math.abs(c.fr) * m, 3)); h.fr.set(C, C.clone().add(d)); h.lf.set(C.clone().add(d).add(new THREE.Vector3(0, 0.3, 0))); } else { h.fr.hide(); h.lf.hide(); }
  },
  readouts(p) { const c = calc(p); return [
    { label: "আদর্শ বেগ √(rg tanθ)", value: f(c.vIdeal), unit: "m/s", color: 0xffb02e },
    { label: "কেন্দ্রমুখী ত্বরণ v²/r", value: f(c.ac), unit: "m/s²", color: 0xff8a3d },
    { label: "ঘর্ষণ (প্রতি kg)", value: Math.abs(c.fr) < 0.05 ? "লাগে না" : `${f(Math.abs(c.fr))} N ${c.fr > 0 ? "ঢালের ওপরের দিকে" : "ঢালের নিচের দিকে"}` }]; },
  steps(p) { const c = calc(p); return [
    "খাড়া দিকে: N cos θ = mg (ঘর্ষণ ছাড়া)। অনুভূমিক দিকে: N sin θ = mv²/r।",
    "ভাগ করলে: tan θ = v² / (r g), তাই আদর্শ বেগ v = √(r g tan θ)।",
    `এখানে v = ${p.v} m/s, আদর্শ বেগ = ${f(c.vIdeal)} m/s।`,
    c.fr < -0.05 ? "বেগ আদর্শের বেশি: গাড়ি বাইরে ছিটকাতে চায়, তাই ঘর্ষণ ঢালের নিচের দিকে (কেন্দ্রের দিকে) কাজ করে।" : c.fr > 0.05 ? "বেগ আদর্শের কম: গাড়ি ভেতরে পিছলে নামতে চায়, তাই ঘর্ষণ ঢালের ওপরের দিকে কাজ করে।" : "বেগ ঠিক আদর্শ: শুধু N আর mg-ই কেন্দ্রমুখী বল দেয়।"]; },
  check(assert) {
    assert(Math.abs(calc({ theta: 45, r: 50, v: 10 }).vIdeal - Math.sqrt(490)) < 1e-9, "45°, r = 50: ideal speed = √490 = 22.14 m/s");
    const c = calc({ theta: 30, r: 50, v: Math.sqrt(50 * 9.8 * Math.tan(rad(30))) });
    assert(Math.abs(c.fr) < 1e-9, "at the ideal speed no friction is needed");
    assert(Math.abs(c.N - 9.8 / Math.cos(rad(30))) < 1e-9, "at the ideal speed N = mg / cos θ");
    assert(calc({ theta: 30, r: 50, v: 28 }).fr < 0 && calc({ theta: 30, r: 50, v: 10 }).fr > 0, "fast: friction down the slope (inward); slow: up the slope");
  },
};
