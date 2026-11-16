// Scene: mitosis in a cell with 2n = 4 chromosomes. Pick a stage; chromosomes glide there. Each chromosome is two sister chromatids.
import * as THREE from "../../vendor/three.module.js";

export const STAGES = [
  { id: "inter", name: "ইন্টারফেজ", chrom: 4, dna: "2C → 4C", note: "S দশায় DNA দ্বিগুণ হয়। ক্রোমোজোম সরু সুতার মতো, আলাদা দেখা যায় না।" },
  { id: "pro", name: "প্রোফেজ", chrom: 4, dna: "4C", note: "ক্রোমোজোম ঘনীভূত হয়ে দৃশ্যমান হয়, প্রতিটিতে দুটি সিস্টার ক্রোমাটিড। নিউক্লিয়ার আবরণ ভাঙতে শুরু করে।" },
  { id: "meta", name: "মেটাফেজ", chrom: 4, dna: "4C", note: "ক্রোমোজোম মধ্যরেখায় (মেটাফেজ প্লেট) সারিবদ্ধ হয়; স্পিন্ডল তন্তু সেন্ট্রোমিয়ারে যুক্ত।" },
  { id: "ana", name: "অ্যানাফেজ", chrom: 8, dna: "4C", note: "সেন্ট্রোমিয়ার ভাগ হয়, সিস্টার ক্রোমাটিড দুই মেরুতে যায়। এখন প্রতিটি ক্রোমাটিড একটি পূর্ণ ক্রোমোজোম, তাই সংখ্যা দ্বিগুণ।" },
  { id: "telo", name: "টেলোফেজ", chrom: 4, dna: "2C (প্রতি মেরুতে)", note: "দুই মেরুতে নতুন নিউক্লিয়ার আবরণ তৈরি হয়, ক্রোমোজোম আবার সরু হতে থাকে।" },
  { id: "cyto", name: "সাইটোকাইনেসিস", chrom: 4, dna: "2C (প্রতি কোষে)", note: "সাইটোপ্লাজম ভাগ হয়ে দুটি অভিন্ন কন্যা কোষ তৈরি হয়, প্রতিটিতে 2n = 4।" },
];
export const stage = id => STAGES.find(s => s.id === id);
const P = [[-0.6, 0.6, 0], [0.6, 0.5, 0.4], [-0.5, -0.6, -0.3], [0.5, -0.5, 0.2]];      // positions inside the nucleus
const plate = k => [0, [1.4, -1.4, 0.5, -0.5][k], [0.3, -0.2, 1.4, -1.4][k]];            // metaphase plate (x = 0)
let chr, cellA, cellB, nuc, spind, cur;

function target(id, k, c) {                         // where chromatid c (0 or 1) of chromosome k should be
  const i = STAGES.findIndex(s => s.id === id), pl = plate(k), pole = [c ? 3.2 : -3.2, pl[1] * 0.45, pl[2] * 0.45];
  if (i <= 1) return { pos: new THREE.Vector3(...P[k]), join: true };
  if (i === 2) return { pos: new THREE.Vector3(...pl), join: true };
  return { pos: new THREE.Vector3(...pole), join: false };
}

export default {
  id: "mitosis",
  view: { theta: 0.3, phi: 1.3, r: 12 },
  params: [{ key: "st", label: "দশা", value: "inter", choices: STAGES.map(s => ({ v: s.id, label: s.name })) }],
  presets: STAGES.map(s => ({ name: s.name, values: { st: s.id } })),
  init({ root, line }) {
    const g = new THREE.SphereGeometry(4, 36, 24), m = () => new THREE.MeshBasicMaterial({ color: 0x98948a, transparent: true, opacity: 0.16, depthWrite: false });
    cellA = new THREE.Mesh(g, m()); cellB = new THREE.Mesh(g, m()); root.add(cellA, cellB);
    nuc = [0, 1].map(() => { const n = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.22, depthWrite: false })); root.add(n); return n; });
    chr = [0, 1, 2, 3].map(k => [0, 1].map(c => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.7, 4, 8), new THREE.MeshBasicMaterial({ color: [0xff4d4d, 0xff8a3d, 0x4fd68a, 0xb48cff][k] })); root.add(m); return m; }));
    spind = [0, 1, 2, 3].flatMap(() => [0, 1].map(() => line(0x98948a, { opacity: 0.6 })));
    cur = P.map(q => [new THREE.Vector3(...q), new THREE.Vector3(...q)]);
  },
  update(p, t, dt = 0.016) {
    const i = STAGES.findIndex(s => s.id === p.st), a = 1 - Math.exp(-6 * dt), pole = new THREE.Vector3();
    chr.forEach((pair, k) => pair.forEach((m, c) => {
      const tg = target(p.st, k, c), off = tg.join ? (c ? 0.13 : -0.13) : 0, want = tg.pos.clone().add(new THREE.Vector3(off, 0, 0));
      cur[k][c].lerp(want, a); m.position.copy(cur[k][c]); m.rotation.z = i === 2 ? Math.PI / 2 : i >= 3 ? (c ? -0.3 : 0.3) : 0; m.scale.set(1, i === 0 ? 0.5 : 1, 1);
    }));
    spind.forEach((l, j) => { const k = j >> 1, c = j & 1; pole.set(c ? 4.2 : -4.2, 0, 0); if (i === 2 || i === 3 || i === 4) l.set(pole, cur[k][c]); else l.hide(); });
    const split = i === 5; cellA.position.x = split ? -2.2 : 0; cellB.position.x = split ? 2.2 : 0; cellB.visible = split; cellA.scale.set(split ? 0.8 : 1.1, split ? 0.8 : 1, split ? 0.8 : 1); cellB.scale.copy(cellA.scale);
    nuc[0].visible = i <= 0 || i === 1 || i >= 4; nuc[1].visible = i >= 4;
    nuc[0].position.set(i >= 4 ? (split ? -2.2 : -3.2) : 0, 0, 0); nuc[1].position.set(split ? 2.2 : 3.2, 0, 0);
    nuc[0].scale.setScalar(i === 1 ? 1.9 : i >= 4 ? 1.2 : 1.9); nuc[0].material.opacity = i === 1 ? 0.1 : 0.22; nuc[1].scale.setScalar(1.2);
  },
  readouts(p) { const s = stage(p.st); return [{ label: "দশা", value: s.name, color: 0xffb02e }, { label: "ক্রোমোজোম সংখ্যা (কোষে)", value: s.chrom }, { label: "DNA পরিমাণ", value: s.dna }]; },
  steps(p) { const s = stage(p.st); return [s.note, "মাইটোসিসে একটি কোষ থেকে দুটি আনুবংশিকভাবে অভিন্ন কন্যা কোষ হয়, ক্রোমোজোম সংখ্যা একই (2n → 2n)।", "বৃদ্ধি, ক্ষত সারানো ও অযৌন জনন এই বিভাজনে হয়।"]; },
  check(assert) {
    assert(STAGES.length === 6 && STAGES.map(s => s.id).join() === "inter,pro,meta,ana,telo,cyto", "six stages in order");
    assert(stage("ana").chrom === 2 * stage("meta").chrom, "anaphase doubles the chromosome count (sister chromatids become chromosomes)");
    assert(stage("cyto").chrom === stage("inter").chrom, "daughter cells have the same 2n as the parent");
    for (const s of STAGES) for (let k = 0; k < 4; k++) assert(target(s.id, k, 0).pos instanceof THREE.Vector3, `target exists: ${s.id}`);
  },
};
