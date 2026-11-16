// Scene: 3D vectors (HSC Physics 1st paper, vectors). Sum, dot product, cross product.
// Physics axes: x right, y into the screen, z up. They map to three.js as (x, z, -y).
import * as THREE from "../../vendor/three.module.js";

const f = n => Math.round(n * 100) / 100;
const neg = n => n < 0 ? `(${f(n)})` : String(f(n));
const T = v => new THREE.Vector3(v[0], v[2], -v[1]);

// Pure physics, so tools/check.mjs can test it without a browser.
export function calc(p) {
  const A = [p.ax, p.ay, p.az], B = [p.bx, p.by, p.bz], mag = v => Math.hypot(v[0], v[1], v[2]);
  const sum = A.map((a, i) => a + B[i]);
  const dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
  const cross = [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
  const mA = mag(A), mB = mag(B);
  const angle = mA && mB ? Math.acos(Math.max(-1, Math.min(1, dot / (mA * mB)))) * 180 / Math.PI : NaN;
  return { A, B, sum, dot, cross, mA, mB, mSum: mag(sum), mCross: mag(cross), angle };
}

const BLUE = 0x4aa3ff, ORANGE = 0xff8a3d, INK = 0xf1ece0, LAMP = 0xffb02e, DIM = 0x98948a;
let h;

export default {
  id: "vectors",
  view: { theta: 0.75, phi: 1.05, r: 13 },
  params: [
    ..."xyz".split("").map(a => ({ key: "a" + a, label: `A<sub>${a}</sub>`, min: -5, max: 5, step: 0.5, value: { x: 3, y: 0, z: 0 }[a] })),
    ..."xyz".split("").map(a => ({ key: "b" + a, label: `B<sub>${a}</sub>`, min: -5, max: 5, step: 0.5, value: { x: 0, y: 4, z: 0 }[a] })),
    { key: "mode", label: "কী দেখবে", value: "sum", choices: [
      { v: "sum", label: "যোগ A+B" }, { v: "dot", label: "ডট A·B" }, { v: "cross", label: "ক্রস A×B" }] },
  ],
  presets: [
    { name: "লম্ব ভেক্টরের যোগ (৩-৪-৫)", values: { ax: 3, ay: 0, az: 0, bx: 0, by: 4, bz: 0, mode: "sum" } },
    { name: "৪৫° কোণে ডট গুণ", values: { ax: 3, ay: 0, az: 0, bx: 3, by: 3, bz: 0, mode: "dot" } },
    { name: "লম্ব হলে ডট গুণ শূন্য", values: { ax: 3, ay: 0, az: 0, bx: 0, by: 4, bz: 0, mode: "dot" } },
    { name: "ক্রস গুণ: x × y = z", values: { ax: 4, ay: 0, az: 0, bx: 0, by: 3, bz: 0, mode: "cross" } },
  ],

  init({ root, arrow, line, quad, polyline, label }) {
    root.add(new THREE.GridHelper(12, 12, 0x2a2925, 0x171715));
    for (const [n, v] of [["x", [6, 0, 0]], ["y", [0, 6, 0]], ["z", [0, 0, 6]]]) {
      line(DIM, { opacity: 0.55 }).set(T(v.map(c => -c)), T(v));
      label(n, DIM).set(T(v.map(c => c * 1.07)));
    }
    h = {
      a: arrow(BLUE), b: arrow(ORANGE), r: arrow(INK), proj: arrow(LAMP, { r: 0.07, opacity: 0.38 }),
      d1: line(ORANGE, { dashed: true, opacity: 0.7 }), d2: line(BLUE, { dashed: true, opacity: 0.7 }), drop: line(LAMP, { dashed: true }),
      arc: polyline(LAMP, 13), area: quad(INK, 0.16),
      la: label("A", BLUE), lb: label("B", ORANGE), lr: label("", INK),
    };
  },

  update(p) {
    const c = calc(p), O = new THREE.Vector3(), A = T(c.A), B = T(c.B);
    h.a.set(O, A); h.b.set(O, B); h.la.set(A); h.lb.set(B);
    for (const k of ["r", "proj", "d1", "d2", "drop", "arc", "area"]) h[k].hide();
    h.lr.hide();
    if (p.mode === "sum") {
      const R = T(c.sum); h.r.set(O, R); h.d1.set(A, R); h.d2.set(B, R); h.lr.say("A+B").set(R);
    } else if (p.mode === "dot" && c.mA && c.mB) {
      const u = A.clone().normalize(), P = u.clone().multiplyScalar(B.dot(u));
      h.proj.set(O, P); h.drop.set(B, P); h.lr.say("B cos θ").set(P);
      const w = B.clone().normalize().sub(u.clone().multiplyScalar(B.clone().normalize().dot(u)));
      if (w.length() > 1e-4) {                          // arc for the angle θ between A and B
        w.normalize(); const th = c.angle * Math.PI / 180, r = 0.9;
        h.arc.set(Array.from({ length: 13 }, (_, i) => u.clone().multiplyScalar(Math.cos(th * i / 12) * r).addScaledVector(w, Math.sin(th * i / 12) * r)));
      }
    } else if (p.mode === "cross") {
      h.area.set(O, A, A.clone().add(B), B);
      if (c.mCross > 1e-6) { const C = T(c.cross).normalize().multiplyScalar(3); h.r.set(O, C); h.lr.say("A×B").set(C); }
    }
  },

  readouts(p) {
    const c = calc(p), r = [
      { label: "|A|", value: f(c.mA), color: BLUE }, { label: "|B|", value: f(c.mB), color: ORANGE }];
    if (p.mode === "sum") r.push({ label: "A+B", value: `(${c.sum.map(f).join(", ")})`, color: INK }, { label: "|A+B|", value: f(c.mSum) });
    if (p.mode === "dot") r.push({ label: "কোণ θ", value: Number.isFinite(c.angle) ? f(c.angle) : "—", unit: "°" }, { label: "A·B", value: f(c.dot), color: LAMP });
    if (p.mode === "cross") r.push({ label: "A×B", value: `(${c.cross.map(f).join(", ")})`, color: INK }, { label: "|A×B|", value: f(c.mCross) });
    return r;
  },

  steps(p) {
    const c = calc(p), [ax, ay, az] = c.A, [bx, by, bz] = c.B;
    if (p.mode === "sum") return [
      "A + B = (A<sub>x</sub>+B<sub>x</sub>, A<sub>y</sub>+B<sub>y</sub>, A<sub>z</sub>+B<sub>z</sub>)",
      `= (${neg(ax)}+${neg(bx)}, ${neg(ay)}+${neg(by)}, ${neg(az)}+${neg(bz)}) = (${c.sum.map(f).join(", ")})`,
      `|A+B| = √(${c.sum.map(s => neg(f(s)) + "²").join(" + ")}) = ${f(c.mSum)}`,
      "ছবিতে: A এর মাথা থেকে B আর B এর মাথা থেকে A এর সমান্তরাল দাগকাটা রেখা, দুটোই একই বিন্দুতে মেলে।",
    ];
    if (p.mode === "dot") return [
      "A·B = A<sub>x</sub>B<sub>x</sub> + A<sub>y</sub>B<sub>y</sub> + A<sub>z</sub>B<sub>z</sub>",
      `= ${neg(ax)}×${neg(bx)} + ${neg(ay)}×${neg(by)} + ${neg(az)}×${neg(bz)} = ${f(c.dot)}`,
      Number.isFinite(c.angle) ? `cos θ = A·B / (|A||B|) = ${f(c.dot)} / (${f(c.mA)} × ${f(c.mB)}), তাই θ = ${f(c.angle)}°` : "একটি ভেক্টর শূন্য, তাই কোণ নির্ধারণ করা যায় না।",
      "ছবিতে: হলুদ অংশ হলো B এর ছায়া A এর ওপর, দৈর্ঘ্য B cos θ। A·B = |A| × (সেই ছায়া)।",
    ];
    return [
      "A×B = (A<sub>y</sub>B<sub>z</sub> − A<sub>z</sub>B<sub>y</sub>, A<sub>z</sub>B<sub>x</sub> − A<sub>x</sub>B<sub>z</sub>, A<sub>x</sub>B<sub>y</sub> − A<sub>y</sub>B<sub>x</sub>)",
      `= (${c.cross.map(f).join(", ")})`,
      `|A×B| = ${f(c.mCross)}। এটাই ছায়াযুক্ত সামান্তরিকের ক্ষেত্রফল।`,
      "দিক: ডান হাতের আঙুল A থেকে B এর দিকে ঘোরালে বুড়ো আঙুল যেদিকে থাকে। ছবিতে তীরটি দিক দেখাতে ছোট করে আঁকা।",
    ];
  },

  // Textbook values; tools/check.mjs fails the build if physics is wrong.
  check(assert) {
    const near = (a, b) => Math.abs(a - b) < 1e-9;
    let c = calc({ ax: 3, ay: 0, az: 0, bx: 0, by: 4, bz: 0 });
    assert(near(c.mSum, 5), "3-4-5: |A+B| = 5");
    assert(near(c.dot, 0) && near(c.angle, 90), "perpendicular: A·B = 0, θ = 90°");
    assert(c.cross.join() === "0,0,12", "x-hat × y-hat style: (3,0,0)×(0,4,0) = (0,0,12)");
    c = calc({ ax: 1, ay: 2, az: 3, bx: 4, by: -5, bz: 6 });
    assert(c.dot === 12 && c.sum.join() === "5,-3,9" && c.cross.join() === "27,6,-13", "(1,2,3),(4,-5,6): dot 12, sum (5,-3,9), cross (27,6,-13)");
    assert(c.cross[0] * 1 + c.cross[1] * 2 + c.cross[2] * 3 === 0, "A×B is perpendicular to A");
    c = calc({ ax: 3, ay: 0, az: 0, bx: 3, by: 3, bz: 0 });
    assert(near(c.angle, 45) && near(c.dot, 9), "45° case: A·B = 9");
    const r = calc({ ax: 0, ay: 0, az: 0, bx: 1, by: 0, bz: 0 });
    assert(Number.isNaN(r.angle), "zero vector: angle is undefined, not a crash");
  },
};
