// Scene: acid-base titration curve. 25 mL of acid in the flask, base added from the burette. Phenolphthalein turns pink above pH 8.2.
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 100) / 100, VA = 25, PKA = 4.74, KW = 14;

// pH after Vb mL of base. Ca, Cb in mol/L. type: "strong" (HCl) or "weak" (CH3COOH, pKa 4.74).
export function pH(p, Vb = p.Vb) {
  const nA = p.Ca * VA, nB = p.Cb * Vb, V = VA + Vb, ex = nB - nA;
  if (p.type === "strong") return Math.abs(ex) < 1e-12 ? 7 : ex < 0 ? -Math.log10(-ex / V) : KW + Math.log10(ex / V);
  if (nB === 0) return (PKA - Math.log10(p.Ca)) / 2;
  if (ex < -1e-12) return PKA + Math.log10(nB / -ex);
  if (Math.abs(ex) <= 1e-12) return 7 + (PKA + Math.log10(nA / V)) / 2;
  return KW + Math.log10(ex / V);
}
export const eqVol = p => p.Ca * VA / p.Cb;
let h, dot, flask;
const X = v => -5 + v / 50 * 10, Y = ph => -3 + ph / 14 * 7;

export default {
  id: "titration",
  view: { theta: 0, phi: 1.5707, r: 19 },
  params: [
    { key: "type", label: "অ্যাসিড", value: "strong", choices: [{ v: "strong", label: "তীব্র (HCl)" }, { v: "weak", label: "দুর্বল (CH₃COOH)" }] },
    { key: "Ca", label: "অ্যাসিডের ঘনমাত্রা", unit: "M", min: 0.05, max: 0.2, step: 0.05, value: 0.1 },
    { key: "Cb", label: "ক্ষারের (NaOH) ঘনমাত্রা", unit: "M", min: 0.05, max: 0.2, step: 0.05, value: 0.1 },
    { key: "Vb", label: "যোগ করা ক্ষার", unit: "mL", min: 0, max: 50, step: 0.5, value: 10 },
  ],
  presets: [{ name: "তীব্র–তীব্র: সমতা বিন্দুতে pH = 7", values: { type: "strong", Ca: 0.1, Cb: 0.1, Vb: 25 } }, { name: "দুর্বল অ্যাসিড: অর্ধ-সমতায় pH = pKa", values: { type: "weak", Ca: 0.1, Cb: 0.1, Vb: 12.5 } }, { name: "দুর্বল অ্যাসিড: সমতা বিন্দুতে pH > 7", values: { type: "weak", Ca: 0.1, Cb: 0.1, Vb: 25 } }],
  init({ root, polyline, line, label }) {
    h = { curve: polyline(0xffb02e, 101), ax: line(0x98948a), ay: line(0x98948a), p7: line(0x98948a, { dashed: true, opacity: 0.6 }), eq: line(0x4fd68a, { dashed: true }), la: label("pH", 0x98948a), lb: label("pH 7", 0x98948a), lv: label("সমতা বিন্দু", 0x4fd68a), lx: label("ক্ষার (mL) →", 0x98948a) };
    dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })); root.add(dot);
    flask = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 2.2, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide })); flask.position.set(-6.6, 2.5, 0); root.add(flask);
    label("পাত্র (ফেনল্ফথ্যালিন)", 0x98948a).set(new THREE.Vector3(-8.2, 4.2, 0));
  },
  update(p) {
    const V = (x, y) => new THREE.Vector3(x, y, 0), eq = eqVol(p);
    h.curve.set(Array.from({ length: 101 }, (_, i) => { const vb = i * 0.5; return V(X(vb), Y(Math.max(0, Math.min(14, pH(p, vb))))); }));
    h.ax.set(V(-5, -3), V(5.3, -3)); h.ay.set(V(-5, -3), V(-5, 4.3)); h.p7.set(V(-5, Y(7)), V(5, Y(7))); h.la.set(V(-5.6, 4.3)); h.lb.set(V(5.5, Y(7))); h.lx.set(V(3.2, -3.5));
    if (eq <= 50) { h.eq.set(V(X(eq), -3), V(X(eq), Y(Math.min(14, pH(p, eq))))); h.lv.set(V(X(eq) + 0.2, -2.6)); } else { h.eq.hide(); h.lv.hide(); }
    const ph = pH(p); dot.position.set(X(p.Vb), Y(Math.max(0, Math.min(14, ph))), 0);
    flask.material.color.set(ph > 8.2 ? 0xff5fa8 : 0x4aa3ff); flask.material.opacity = ph > 8.2 ? 0.55 : 0.2;
  },
  readouts(p) { const ph = pH(p); return [{ label: "pH", value: f(ph), color: 0xffb02e }, { label: "সমতা বিন্দুর আয়তন", value: f(eqVol(p)), unit: "mL" }, { label: "ফেনল্ফথ্যালিনের রং", value: ph > 8.2 ? "গোলাপি" : "বর্ণহীন" }]; },
  steps(p) { const ph = pH(p), eq = eqVol(p); return [
    `মোল: অ্যাসিড = ${p.Ca} × 25/1000 = ${f(p.Ca * 25)} mmol, সমতা বিন্দুতে ক্ষারও একই মোল লাগে: V = ${f(eq)} mL।`,
    p.type === "strong" ? "তীব্র অ্যাসিড–তীব্র ক্ষার: সমতা বিন্দুর আগে অবশিষ্ট H⁺ থেকে pH = −log[H⁺]। সমতায় pH = 7। এরপর অতিরিক্ত OH⁻ থেকে pOH।" : "দুর্বল অ্যাসিড: শুরু থেকে সমতা পর্যন্ত বাফার, pH = pKa + log([লবণ]/[অ্যাসিড])। অর্ধ-সমতায় pH = pKa = 4.74। সমতায় লবণের আর্দ্রবিশ্লেষণের জন্য pH > 7।",
    `এখন ${p.Vb} mL ক্ষারে pH = ${f(ph)}।`,
    "সমতা বিন্দুর কাছে সামান্য ক্ষারে pH লাফিয়ে বদলায়। সূচক (indicator) বেছে নিতে হয় এই লাফের মধ্যে রং বদলায় এমন।"]; },
  check(assert) {
    const s = { type: "strong", Ca: 0.1, Cb: 0.1, Vb: 0 };
    assert(Math.abs(pH(s, 0) - 1) < 1e-9 && Math.abs(pH(s, 25) - 7) < 1e-9, "0.1 M HCl: pH 1; at equivalence pH 7");
    assert(Math.abs(pH(s, 50) - (14 + Math.log10(0.0025 / 0.075))) < 1e-9, "excess NaOH: pH 12.52");
    const w = { ...s, type: "weak" };
    assert(Math.abs(pH(w, 12.5) - 4.74) < 1e-9, "weak acid: half-equivalence pH = pKa");
    assert(Math.abs(pH(w, 25) - 8.72) < 0.01, "weak acid at equivalence: pH 8.72");
    assert(eqVol({ Ca: 0.2, Cb: 0.1 }) === 50, "0.2 M acid needs 50 mL of 0.1 M base");
  },
};
