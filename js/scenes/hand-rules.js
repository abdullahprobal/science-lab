// Scene: Fleming's left-hand rule and the force on a current in a magnetic field, F = I L x B.
// Model mode: pick the directions of current and field; the force follows. Camera mode: arrows on your own hand.
import * as THREE from "../../vendor/three.module.js";

const DIRS = { "+x": [1, 0, 0], "-x": [-1, 0, 0], "+y": [0, 1, 0], "-y": [0, -1, 0], "+z": [0, 0, 1], "-z": [0, 0, -1] };
const NAME = { "+x": "ডানে (+x)", "-x": "বামে (−x)", "+y": "ভেতরে (+y)", "-y": "বাইরে (−y)", "+z": "ওপরে (+z)", "-z": "নিচে (−z)" };
const T = v => new THREE.Vector3(v[0], v[2], -v[1]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dirName = v => Object.keys(DIRS).find(k => DIRS[k].every((c, i) => c === v[i]));

// Pure physics for tools/check.mjs: force direction (unit axes) and size F = B I L sin(angle).
export function force(p) {
  const I = DIRS[p.idir], B = DIRS[p.bdir], c = cross(I, B);
  const sin = Math.hypot(...c);
  return { dir: sin ? dirName(c) : null, F: p.b * p.i * p.l * sin };
}
const CHOICES = k => Object.keys(DIRS).map(v => ({ v, label: NAME[v] }));
let h;

export default {
  id: "hand-rules",
  view: { theta: 0.75, phi: 1.05, r: 11 },
  params: [
    { key: "idir", label: "প্রবাহ I এর দিক", value: "+x", choices: CHOICES() },
    { key: "bdir", label: "ক্ষেত্র B এর দিক", value: "+y", choices: CHOICES() },
    { key: "b", label: "B", unit: "T", min: 0.1, max: 2, step: 0.1, value: 0.5 },
    { key: "i", label: "I", unit: "A", min: 1, max: 10, step: 1, value: 4 },
    { key: "l", label: "দৈর্ঘ্য L", unit: "m", min: 0.1, max: 2, step: 0.1, value: 0.5 },
  ],
  presets: [
    { name: "I ডানে, B ভেতরে", values: { idir: "+x", bdir: "+y" } },
    { name: "I ডানে, B ওপরে", values: { idir: "+x", bdir: "+z" } },
    { name: "I ও B একই দিক: বল নেই", values: { idir: "+x", bdir: "+x" } },
  ],

  init({ root, arrow, line, label, button, stage }) {
    root.add(new THREE.GridHelper(8, 8, 0x2a2925, 0x171715));
    const O = new THREE.Vector3(); h = { i: arrow(0xb48cff, { r: 0.05 }), b: arrow(0x4fd68a, { r: 0.05 }), f: arrow(0xff4d4d, { r: 0.06 }),
      wire: line(0xb48cff, { opacity: 0.4 }), li: label("I", 0xb48cff), lb: label("B", 0x4fd68a), lf: label("F", 0xff4d4d) };
    h.O = O;
    button("📷 নিজের হাতে দেখো", async () => {
      const { startHandCamera } = await import("../hand.js" + new URL(import.meta.url).search);
      const m = /[#&]test=([^&]+)/.exec(location.hash);
      startHandCamera(stage, { testPhoto: m ? decodeURIComponent(m[1]) : "" });
    }).classList.add("camera");
  },

  update(p) {
    const I = T(DIRS[p.idir]), B = T(DIRS[p.bdir]), f = force(p), O = h.O;
    h.wire.set(I.clone().multiplyScalar(-3), I.clone().multiplyScalar(3));
    h.i.set(O, I.clone().multiplyScalar(2.4)); h.li.set(I.clone().multiplyScalar(2.7));
    h.b.set(B.clone().multiplyScalar(-1.6), B.clone().multiplyScalar(1.6)); h.lb.set(B.clone().multiplyScalar(1.9));
    if (f.dir) { const F = T(DIRS[f.dir]).multiplyScalar(2.4); h.f.set(O, F); h.lf.set(F.clone().multiplyScalar(1.12)); } else { h.f.hide(); h.lf.hide(); }
  },

  readouts(p) {
    const f = force(p);
    return [{ label: "বলের দিক F", value: f.dir ? NAME[f.dir] : "বল নেই", color: 0xff4d4d },
            { label: "F = BIL sin θ", value: Math.round(f.F * 1000) / 1000, unit: "N" }];
  },

  steps(p) {
    const f = force(p);
    return [
      "বাম হাতের তর্জনী = চৌম্বক ক্ষেত্র B, মধ্যমা = তড়িৎ প্রবাহ I, বুড়ো আঙুল = বল F। তিনটি আঙুল পরস্পর লম্ব।",
      `দিক: I × B। এখানে I ${NAME[p.idir]}, B ${NAME[p.bdir]}, তাই বল ${f.dir ? NAME[f.dir] : "শূন্য, কারণ I ও B সমান্তরাল"}।`,
      `মান: F = B I L sin θ = ${p.b} × ${p.i} × ${p.l} × sin θ = ${Math.round(f.F * 1000) / 1000} N`,
      "ক্যামেরা বোতাম চাপলে তিনটি তীর তোমার নিজের হাতের আঙুলে বসবে।",
    ];
  },

  check(assert) {
    const base = { b: 1, i: 1, l: 1 };
    assert(force({ ...base, idir: "+x", bdir: "+y" }).dir === "+z", "I = x, B = y gives force along +z (x × y = z)");
    assert(force({ ...base, idir: "+y", bdir: "+x" }).dir === "-z", "swapping I and B reverses the force");
    assert(force({ ...base, idir: "+x", bdir: "+x" }).dir === null, "I parallel to B: no force");
    assert(force({ b: 0.5, i: 4, l: 0.5, idir: "+x", bdir: "+z" }).F === 1, "F = BIL = 0.5 x 4 x 0.5 = 1 N when perpendicular");
    assert(force({ ...base, idir: "+z", bdir: "+x" }).dir === "+y", "z × x = y");
  },
};
