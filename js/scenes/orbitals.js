// Scene: shapes of s, p and d orbitals (angular part), blue and red are the two signs of the wave function.
import * as THREE from "../../vendor/three.module.js";

const L = { s: 0, p: 1, d: 2 };
const FN = { s: () => 1, px: (x, y, z) => x, py: (x, y, z) => y, pz: (x, y, z) => z, dz2: (x, y, z) => (3 * z * z - 1) / 2, dxy: (x, y, z) => 1.73 * x * y, dx2: (x, y, z) => 0.87 * (x * x - y * y) };
const LABEL = { s: "s", px: "p<sub>x</sub>", py: "p<sub>y</sub>", pz: "p<sub>z</sub>", dz2: "d<sub>z²</sub>", dxy: "d<sub>xy</sub>", dx2: "d<sub>x²−y²</sub>" };
const lOf = o => L[o[0]];

// n = principal quantum number. Radial nodes n−l−1, angular nodes l, total n−1. Subshell holds 2(2l+1) electrons.
export function orbital(n, o) { const l = lOf(o); return { l, radial: n - l - 1, angular: l, total: n - 1, orbitals: 2 * l + 1, electrons: 2 * (2 * l + 1), valid: n > l }; }
let mesh, geo, base, key;

export default {
  id: "orbitals",
  view: { theta: 0.7, phi: 1.1, r: 7 },
  params: [
    { key: "n", label: "প্রধান কোয়ান্টাম সংখ্যা n", min: 1, max: 4, step: 1, value: 2 },
    { key: "o", label: "অরবিটাল", value: "pz", choices: Object.keys(LABEL).map(v => ({ v, label: LABEL[v] })) },
  ],
  presets: [{ name: "1s", values: { n: 1, o: "s" } }, { name: "2p<sub>z</sub> (ডাম্বেল)", values: { n: 2, o: "pz" } }, { name: "3d<sub>z²</sub>", values: { n: 3, o: "dz2" } }, { name: "3d<sub>xy</sub> (চার পাপড়ি)", values: { n: 3, o: "dxy" } }],
  init({ root, line }) {
    geo = new THREE.SphereGeometry(1, 56, 36); base = geo.attributes.position.array.slice();
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(base.length), 3));
    mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); root.add(mesh);
    for (const [a, b] of [[[-3, 0, 0], [3, 0, 0]], [[0, -3, 0], [0, 3, 0]], [[0, 0, -3], [0, 0, 3]]]) line(0x98948a, { opacity: 0.5 }).set(new THREE.Vector3(...a), new THREE.Vector3(...b));
  },
  update(p) {
    if (key === p.o) return; key = p.o;
    const pos = geo.attributes.position, col = geo.attributes.color, f = FN[p.o];
    for (let i = 0; i < pos.count; i++) {
      const x = base[3 * i], y = base[3 * i + 1], z = base[3 * i + 2], v = f(x, z, y), r = Math.abs(v) * 2.4;   // physics z = three y
      pos.setXYZ(i, x * r, y * r, z * r); if (v >= 0) col.setXYZ(i, 0.29, 0.64, 1); else col.setXYZ(i, 1, 0.3, 0.3);
    }
    pos.needsUpdate = col.needsUpdate = true; geo.computeBoundingSphere();
  },
  readouts(p) { const o = orbital(p.n, p.o); return [
    { label: "নাম", value: o.valid ? `${p.n}${LABEL[p.o]}` : "এই n এ নেই", color: 0xffb02e }, { label: "কৌণিক নোড (l)", value: o.angular }, { label: "রেডিয়াল নোড (n−l−1)", value: o.valid ? o.radial : "—" },
    { label: "উপস্তরে অরবিটাল সংখ্যা", value: o.orbitals }, { label: "উপস্তরে সর্বোচ্চ ইলেকট্রন", value: o.electrons }]; },
  steps(p) { const o = orbital(p.n, p.o); return [
    "অরবিটাল হলো নিউক্লিয়াসের চারপাশের সেই অঞ্চল, যেখানে ইলেকট্রন পাওয়ার সম্ভাবনা সবচেয়ে বেশি। ছবিতে আঁকা আকৃতি সেই সম্ভাবনার কৌণিক বণ্টন।",
    "s গোলাকার (l = 0), p ডাম্বেলের মতো (l = 1), d চার পাপড়ি বা ডাম্বেল-সহ-বলয় (l = 2)। নীল ও লাল হলো তরঙ্গ ফাংশনের দুটি চিহ্ন, রং চার্জ নয়।",
    `নোড = যেখানে ইলেকট্রন পাওয়ার সম্ভাবনা শূন্য। মোট নোড n − 1 = ${p.n - 1}, এর মধ্যে কৌণিক l = ${o.angular}টি।`,
    o.valid ? `একটি ${p.n}${LABEL[p.o].replace(/<[^>]+>/g, "")} উপস্তরে ${o.orbitals}টি অরবিটাল, সর্বোচ্চ ${o.electrons}টি ইলেকট্রন (প্রতিটিতে ২টি)।` : "n অবশ্যই l এর চেয়ে বড় হতে হবে: 2s থেকে d নয়, d শুরু 3d থেকে।"]; },
  check(assert) {
    let o = orbital(3, "pz"); assert(o.radial === 1 && o.angular === 1 && o.total === 2, "3p: 1 radial + 1 angular node");
    assert(orbital(1, "s").radial === 0 && orbital(2, "s").radial === 1, "1s no node, 2s one radial node");
    assert(orbital(3, "dxy").electrons === 10 && orbital(2, "px").electrons === 6 && orbital(1, "s").electrons === 2, "subshell capacity 2, 6, 10");
    assert(!orbital(2, "dxy").valid, "there is no 2d");
    assert(FN.pz(0, 0, 1) > 0 && FN.pz(0, 0, -1) < 0, "p orbital: two lobes of opposite sign");
  },
};
