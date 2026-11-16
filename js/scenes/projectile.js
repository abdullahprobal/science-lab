// Scene: projectile motion on level ground (HSC 1st paper, dynamics). x horizontal, up is up. g = 9.8 m/s².
import * as THREE from "../../vendor/three.module.js";
const g = 9.8, rad = d => d * Math.PI / 180, f = n => Math.round(n * 100) / 100;

export function calc(p) {
  const a = rad(p.angle), ux = p.u * Math.cos(a), uz = p.u * Math.sin(a), T = 2 * uz / g;
  return { ux, uz, T, R: ux * T, H: uz * uz / (2 * g) };
}
let h, ball;

export default {
  id: "projectile",
  view: { theta: 0, phi: 1.45, r: 14 },
  params: [
    { key: "u", label: "আদিবেগ u", unit: "m/s", min: 5, max: 40, step: 1, value: 20 },
    { key: "angle", label: "নিক্ষেপ কোণ θ", unit: "°", min: 5, max: 85, step: 1, value: 45 },
  ],
  presets: [
    { name: "৪৫°: সর্বোচ্চ পাল্লা", values: { u: 20, angle: 45 } },
    { name: "৩০° ও ৬০°: একই পাল্লা (৩০°)", values: { u: 20, angle: 30 } },
    { name: "৩০° ও ৬০°: একই পাল্লা (৬০°)", values: { u: 20, angle: 60 } },
    { name: "প্রায় খাড়া ওপরে", values: { u: 20, angle: 85 } },
  ],
  init({ root, polyline, arrow, label }) {
    root.add(new THREE.GridHelper(20, 20, 0x2a2925, 0x171715));
    ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf1ece0 })); root.add(ball);
    h = { path: polyline(0x98948a, 61), v: arrow(0x4aa3ff), vx: arrow(0x4aa3ff, { r: 0.025, opacity: 0.6 }), vz: arrow(0x4aa3ff, { r: 0.025, opacity: 0.6 }), lv: label("v", 0x4aa3ff) };
  },
  update(p, t) {
    const c = calc(p), s = 11 / Math.max(c.R, 2 * c.H, 1), X = x => (x - c.R / 2) * s, Y = z => z * s;
    h.path.set(Array.from({ length: 61 }, (_, i) => { const tt = c.T * i / 60; return new THREE.Vector3(X(c.ux * tt), Y(c.uz * tt - g * tt * tt / 2), 0); }));
    const tt = Math.min(t % (c.T + 1), c.T), vz = c.uz - g * tt, P = new THREE.Vector3(X(c.ux * tt), Y(c.uz * tt - g * tt * tt / 2), 0), k = 0.12;
    ball.position.copy(P);
    h.v.set(P, P.clone().add(new THREE.Vector3(c.ux * k, vz * k, 0))); h.vx.set(P, P.clone().add(new THREE.Vector3(c.ux * k, 0, 0))); h.vz.set(P, P.clone().add(new THREE.Vector3(0, vz * k, 0)));
    h.lv.set(P.clone().add(new THREE.Vector3(c.ux * k, vz * k, 0)));
  },
  readouts(p) { const c = calc(p); return [{ label: "উড্ডয়ন কাল T", value: f(c.T), unit: "s" }, { label: "সর্বোচ্চ উচ্চতা H", value: f(c.H), unit: "m" }, { label: "পাল্লা R", value: f(c.R), unit: "m", color: 0xffb02e }, { label: "অনুভূমিক বেগ u cos θ", value: f(c.ux), unit: "m/s", color: 0x4aa3ff }]; },
  steps(p) { const c = calc(p); return [
    `u<sub>x</sub> = u cos θ = ${p.u} × cos ${p.angle}° = ${f(c.ux)} m/s (সারাক্ষণ একই)`,
    `u<sub>z</sub> = u sin θ = ${f(c.uz)} m/s (প্রতি সেকেন্ডে ৯.৮ কমে)`,
    `T = 2u sin θ / g = ${f(c.T)} s, H = u²sin²θ / 2g = ${f(c.H)} m`,
    `R = u² sin 2θ / g = ${f(c.R)} m। θ আর (৯০° − θ) এ R সমান।`]; },
  check(assert) {
    const c = calc({ u: 20, angle: 45 });
    assert(Math.abs(c.R - 40.8163) < 1e-3 && Math.abs(c.H - 10.2041) < 1e-3, "u = 20, 45°: R = 40.82 m, H = 10.20 m");
    assert(Math.abs(calc({ u: 20, angle: 30 }).R - calc({ u: 20, angle: 60 }).R) < 1e-9, "θ and 90−θ give the same range");
    assert(calc({ u: 30, angle: 45 }).R > calc({ u: 30, angle: 40 }).R, "45° beats 40°");
  },
};
