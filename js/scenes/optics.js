// Scene: a thin lens forming an image (1/v + 1/u = 1/f, real-is-positive) and Young's double slit (fringe width β = λD/d).
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 100) / 100;

export function lens(p) { const v = 1 / (1 / p.f - 1 / p.u); return { v, m: -v / p.u, real: v > 0 }; }   // virtual image when u < f
export function slit(p) { return { beta: p.lam * 1e-9 * p.D / (p.d * 1e-3) * 1e3 }; }                    // fringe width in mm
const rgb = nm => new THREE.Color().setHSL(0.78 * (1 - (nm - 400) / 300) ** 1.8, 1, 0.55);   // 400 nm violet ... 700 nm red
let h;
const V = (x, y) => new THREE.Vector3(x, y, 0);

export default {
  id: "optics",
  view: { theta: 0, phi: 1.5707, r: 18 },
  params: [
    { key: "mode", label: "কী দেখবে", value: "lens", choices: [{ v: "lens", label: "উত্তল লেন্স" }, { v: "slit", label: "ইয়ংয়ের দ্বি-চিড়" }] },
    { key: "f", label: "ফোকাস দূরত্ব f", unit: "cm", min: 5, max: 20, step: 1, value: 10 },
    { key: "u", label: "বস্তুর দূরত্ব u", unit: "cm", min: 4, max: 50, step: 1, value: 30 },
    { key: "lam", label: "তরঙ্গদৈর্ঘ্য λ", unit: "nm", min: 400, max: 700, step: 25, value: 600 },
    { key: "d", label: "চিড়ির দূরত্ব d", unit: "mm", min: 0.1, max: 1, step: 0.1, value: 0.5 },
    { key: "D", label: "পর্দার দূরত্ব D", unit: "m", min: 1, max: 3, step: 0.5, value: 2 },
  ],
  presets: [
    { name: "u = 3f: ছোট, উল্টো, বাস্তব প্রতিবিম্ব", values: { mode: "lens", f: 10, u: 30 } }, { name: "u = 2f: সমান আকার", values: { mode: "lens", f: 10, u: 20 } },
    { name: "u < f: আবর্ধক কাচ (অসদ্ প্রতিবিম্ব)", values: { mode: "lens", f: 10, u: 6 } }, { name: "লাল আলোর ডোরা", values: { mode: "slit", lam: 650 } }, { name: "নীল আলোর ডোরা (সরু)", values: { mode: "slit", lam: 450 } },
  ],
  init({ root, line, polyline, label }) {
    h = { axis: line(0x98948a, { opacity: 0.5 }), lens: line(0x4aa3ff), obj: line(0xf1ece0), img: line(0xffb02e), r1a: line(0xff8a3d), r1b: line(0xff8a3d), r2a: line(0x4fd68a), r2b: line(0x4fd68a), v1: line(0xff8a3d, { dashed: true, opacity: 0.7 }), v2: line(0x4fd68a, { dashed: true, opacity: 0.7 }),
      screen: line(0x98948a), s1: polyline(0xf1ece0, 5), s2: polyline(0xf1ece0, 5), pat: polyline(0xffb02e, 241), p1: line(0xf1ece0, { dashed: true }), p2: line(0xf1ece0, { dashed: true }), la: label("", 0xf1ece0), lb: label("", 0xffb02e) };
  },
  update(p) {
    const all = Object.keys(h).filter(k => !k.startsWith("l") || k === "lens"); all.forEach(k => h[k].hide && h[k].hide()); h.la.hide(); h.lb.hide();
    if (p.mode === "lens") {
      const c = lens(p), s = 0.2, ho = 2, X = u => -u * s, im = V(c.v * s, c.m * ho), tip = V(X(p.u), ho);
      h.axis.set(V(-9, 0), V(9, 0)); h.lens.set(V(0, -3.2), V(0, 3.2)); h.obj.set(V(X(p.u), 0), tip); h.la.say("বস্তু").set(V(X(p.u), ho + 0.4));
      const ray = (P, a, b, vk) => {          // incident P→P, refracted passes through (or appears to come from) the image tip
        a.set(tip, P); const d = c.real ? im.clone().sub(P) : P.clone().sub(im); d.normalize(); b.set(P, P.clone().addScaledVector(d, 16)); if (!c.real) vk.set(P, im);
      };
      if (Number.isFinite(c.v) && Math.abs(c.v * s) < 40) {
        ray(V(0, ho), h.r1a, h.r1b, h.v1);
        h.r2a.set(tip, V(0, 0)); const d = V(0, 0).sub(tip).normalize(); h.r2b.set(V(0, 0), V(0, 0).addScaledVector(d, 16)); if (!c.real) h.v2.set(V(0, 0), im);
        h.img.set(V(c.v * s, 0), im); h.lb.say(c.real ? "বাস্তব, উল্টো" : "অসদ্, সোজা").set(im.clone().add(V(0.3, 0.5)));
      }
    } else {
      const sp = slit(p), col = rgb(p.lam); h.pat.obj.material.color.copy(col);
      h.screen.set(V(5, -7), V(5, 7)); h.s1.set([V(-5, -7), V(-5, -0.35), V(-5, -0.35), V(-5, -0.35), V(-5, -0.35)]); h.s2.set([V(-5, 0.35), V(-5, 7), V(-5, 7), V(-5, 7), V(-5, 7)]);
      const k = 0.375, yp = sp.beta * k;
      h.pat.set(Array.from({ length: 241 }, (_, i) => { const y = -7 + 14 * i / 240, I = Math.cos(Math.PI * y / (sp.beta * k)) ** 2; return V(5 + I * 2.2, y); }));
      h.p1.set(V(-5, 0.35), V(5, yp)); h.p2.set(V(-5, -0.35), V(5, yp)); h.la.say("পথ পার্থক্য = λ (১ম উজ্জ্বল ডোরা)").set(V(-4, yp / 2 + 1)); h.lb.say("ডোরা").set(V(5.5, yp + 0.3));
    }
  },
  readouts(p) {
    if (p.mode === "lens") { const c = lens(p); return [{ label: "প্রতিবিম্বের দূরত্ব v", value: Number.isFinite(c.v) ? f(c.v) : "অসীম", unit: "cm" }, { label: "বিবর্ধন m = −v/u", value: Number.isFinite(c.m) ? f(c.m) : "—" }, { label: "প্রকৃতি", value: !Number.isFinite(c.v) ? "প্রতিবিম্ব অসীমে" : c.real ? "বাস্তব ও উল্টো" : "অসদ্ ও সোজা", color: 0xffb02e }]; }
    return [{ label: "ডোরার প্রস্থ β = λD/d", value: f(slit(p).beta), unit: "mm", color: 0xffb02e }, { label: "λ", value: p.lam, unit: "nm" }];
  },
  steps(p) {
    if (p.mode === "lens") { const c = lens(p); return ["লেন্স সূত্র: 1/v + 1/u = 1/f (বাস্তব প্রতিবিম্ব ধনাত্মক ধরে)।", `1/v = 1/${p.f} − 1/${p.u}, তাই v = ${Number.isFinite(c.v) ? f(c.v) : "∞"} cm।`, "রশ্মি আঁকার নিয়ম: অক্ষের সমান্তরাল রশ্মি ফোকাসের মধ্য দিয়ে যায়, কেন্দ্রের রশ্মি সোজা যায়। দুই রশ্মি যেখানে মেলে সেখানে প্রতিবিম্ব।", "u < f হলে রশ্মি মেলে না; পেছনে বাড়ালে (দাগকাটা রেখা) মেলে, তাই অসদ্ প্রতিবিম্ব।"]; }
    return [`β = λD/d = ${p.lam}×10⁻⁹ × ${p.D} / (${p.d}×10⁻³) = ${f(slit(p).beta)} mm।`, "উজ্জ্বল ডোরা: পথ পার্থক্য = nλ। অন্ধকার ডোরা: (n + ½)λ।", "d কমালে বা D বাড়ালে বা λ বাড়ালে ডোরা চওড়া হয়। লাল আলোর ডোরা নীলের চেয়ে চওড়া।"];
  },
  check(assert) {
    const c = lens({ f: 10, u: 30 }); assert(Math.abs(c.v - 15) < 1e-9 && Math.abs(c.m + 0.5) < 1e-9 && c.real, "f = 10, u = 30: v = 15, m = −0.5, real");
    assert(Math.abs(lens({ f: 10, u: 20 }).v - 20) < 1e-9, "u = 2f: v = 2f");
    const v = lens({ f: 10, u: 6 }); assert(!v.real && v.m > 1, "u < f: virtual, upright, magnified");
    assert(Math.abs(slit({ lam: 600, D: 2, d: 0.5 }).beta - 2.4) < 1e-9, "λ = 600 nm, D = 2 m, d = 0.5 mm: β = 2.4 mm");
  },
};
