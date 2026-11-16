// Scene: electric field lines of two point charges in 3D, and Coulomb's force between them. k = 9×10⁹ N m²/C².
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 1e4) / 1e4, K = 9e9, NL = 40, STEPS = 140;

export function coulomb(p) { const F = K * p.q1 * p.q2 * 1e-12 / (p.d * p.d); return { F, kind: F === 0 ? "none" : F > 0 ? "repel" : "attract" }; }
const field = (P, qs) => { const E = new THREE.Vector3(); for (const c of qs) { const r = P.clone().sub(c.pos), d = Math.max(r.length(), 0.05); E.addScaledVector(r, c.q / d ** 3); } return E; };
let lines, spheres, key = "";
const fib = (i, n) => { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996; return new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)); };

export default {
  id: "efield",
  view: { theta: 0.5, phi: 1.2, r: 13 },
  params: [
    { key: "q1", label: "q₁", unit: "μC", min: -5, max: 5, step: 1, value: 3 },
    { key: "q2", label: "q₂", unit: "μC", min: -5, max: 5, step: 1, value: -3 },
    { key: "d", label: "দূরত্ব d", unit: "m", min: 1, max: 6, step: 0.5, value: 4 },
  ],
  presets: [{ name: "সমান ও বিপরীত (দ্বিমেরু)", values: { q1: 3, q2: -3 } }, { name: "দুটি ধনাত্মক চার্জ", values: { q1: 3, q2: 3 } }, { name: "একটি বড়, একটি ছোট", values: { q1: 5, q2: -1 } }],
  init({ root, polyline }) {
    lines = Array.from({ length: NL * 2 }, () => polyline(0xffd84a, STEPS + 1));
    spheres = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff })); root.add(m); return m; });
  },
  update(p) {
    const k = [p.q1, p.q2, p.d].join();
    spheres.forEach((s, i) => { s.position.set((i ? 1 : -1) * p.d / 2, 0, 0); s.material.color.set(([p.q1, p.q2][i]) >= 0 ? 0xff4d4d : 0x4aa3ff); s.scale.setScalar(0.6 + 0.1 * Math.abs([p.q1, p.q2][i])); });
    if (k === key) return; key = k;
    const qs = [{ q: p.q1, pos: new THREE.Vector3(-p.d / 2, 0, 0) }, { q: p.q2, pos: new THREE.Vector3(p.d / 2, 0, 0) }];
    const pos = qs.some(c => c.q > 0), sgn = pos ? 1 : -1, srcs = qs.filter(c => (pos ? c.q > 0 : c.q < 0)), tot = srcs.reduce((a, c) => a + Math.abs(c.q), 0) || 1;
    let used = 0;
    for (const c of srcs) {
      const n = Math.min(NL, Math.max(6, Math.round(NL * Math.abs(c.q) / tot)));
      for (let i = 0; i < n && used < lines.length; i++, used++) {
        let P = c.pos.clone().addScaledVector(fib(i, n), 0.3); const pts = [P.clone()];
        for (let s = 0; s < STEPS; s++) {
          const E = field(P, qs).multiplyScalar(sgn); if (E.length() < 1e-9) break; P = P.clone().addScaledVector(E.normalize(), 0.12); pts.push(P.clone());
          if (qs.some(o => o.pos.distanceTo(P) < 0.25 && (sgn * o.q) < 0) || P.length() > 14) break;
        }
        while (pts.length < STEPS + 1) pts.push(pts[pts.length - 1]); lines[used].set(pts);
      }
    }
    for (; used < lines.length; used++) lines[used].hide();
  },
  readouts(p) { const c = coulomb(p); return [
    { label: "কুলম্ব বল F = k q₁q₂ / d²", value: f(Math.abs(c.F)), unit: "N", color: 0xff4d4d },
    { label: "প্রকৃতি", value: { none: "কোনো বল নেই", repel: "বিকর্ষণ (একই চিহ্ন)", attract: "আকর্ষণ (বিপরীত চিহ্ন)" }[c.kind] },
    { label: "মধ্যবিন্দুতে E", value: f(Math.abs(field(new THREE.Vector3(), [{ q: p.q1 * 1e-6 * K, pos: new THREE.Vector3(-p.d / 2, 0, 0) }, { q: p.q2 * 1e-6 * K, pos: new THREE.Vector3(p.d / 2, 0, 0) }]).x)), unit: "N/C", color: 0xffd84a }]; },
  steps(p) { const c = coulomb(p); return [
    `F = k q₁q₂ / d² = 9×10⁹ × (${p.q1}×10⁻⁶) × (${p.q2}×10⁻⁶) / ${p.d}² = ${f(c.F)} N`,
    "ক্ষেত্ররেখা ধনাত্মক চার্জ থেকে বেরোয় আর ঋণাত্মক চার্জে ঢোকে। রেখা কখনো একে অপরকে ছেদ করে না।",
    "রেখা যেখানে ঘন, সেখানে ক্ষেত্র প্রবল। চার্জ বড় হলে বেশি রেখা বেরোয়।",
    "ঘুরিয়ে দেখো: ক্ষেত্ররেখা সমতলে নয়, চার্জের চারদিকে ত্রিমাত্রিক।"]; },
  check(assert) {
    assert(Math.abs(coulomb({ q1: 1, q2: 1, d: 1 }).F - 0.009) < 1e-12, "1 μC and 1 μC at 1 m: F = 9×10⁻³ N");
    assert(Math.abs(coulomb({ q1: 1, q2: 1, d: 2 }).F * 4 - coulomb({ q1: 1, q2: 1, d: 1 }).F) < 1e-12, "double d: F is a quarter");
    assert(coulomb({ q1: 3, q2: -3, d: 4 }).kind === "attract" && coulomb({ q1: 3, q2: 3, d: 4 }).kind === "repel", "unlike attract, like repel");
    const E = field(new THREE.Vector3(0, 0, 0), [{ q: 1, pos: new THREE.Vector3(-1, 0, 0) }, { q: -1, pos: new THREE.Vector3(1, 0, 0) }]);
    assert(E.x > 0 && Math.abs(E.y) < 1e-9, "dipole: field at the midpoint points from + to −");
  },
};
