// Scene: unit cells of cubic crystals. Atoms per cell are counted from the positions (corner 1/8, edge 1/4, face 1/2, inside 1).
import * as THREE from "../../vendor/three.module.js";

const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
const F = [[.5, .5, 0], [.5, .5, 1], [.5, 0, .5], [.5, 1, .5], [0, .5, .5], [1, .5, .5]];
const E = [[.5, 0, 0], [.5, 1, 0], [.5, 0, 1], [.5, 1, 1], [0, .5, 0], [1, .5, 0], [0, .5, 1], [1, .5, 1], [0, 0, .5], [1, 0, .5], [0, 1, .5], [1, 1, .5]];
const A = c => c.map(p => ({ p, c: 0 })), B = c => c.map(p => ({ p, c: 1 }));
const CELLS = {
  sc: { name: "সরল ঘনক (SC)", atoms: A(C), r: 0.5, cn: "6", pack: 52.4, ex: "Po" },
  bcc: { name: "দেহকেন্দ্রিক (BCC)", atoms: A([...C, [.5, .5, .5]]), r: Math.sqrt(3) / 4, cn: "8", pack: 68, ex: "Fe, Na" },
  fcc: { name: "ফলককেন্দ্রিক (FCC)", atoms: A([...C, ...F]), r: Math.sqrt(2) / 4, cn: "12", pack: 74.05, ex: "Cu, Al" },
  nacl: { name: "সোডিয়াম ক্লোরাইড (NaCl)", atoms: [...A([...C, ...F]), ...B([...E, [.5, .5, .5]])], r: 0.2, cn: "6 : 6", pack: null, ex: "NaCl" },
  diamond: { name: "হীরা", atoms: A([...C, ...F, [.25, .25, .25], [.75, .75, .25], [.75, .25, .75], [.25, .75, .75]]), r: Math.sqrt(3) / 8, cn: "4", pack: 34, ex: "হীরা, Si" },
};
// How many atoms does one cell really own? Each coordinate that is 0 or 1 (on a face of the cube) halves the share.
export function perCell(atoms) { return atoms.reduce((s, a) => s + 1 / 2 ** a.p.filter(c => c === 0 || c === 1).length, 0); }
let spheres, edges, bondLines;

export default {
  id: "lattice",
  view: { theta: 0.7, phi: 1.1, r: 9 },
  params: [{ key: "cell", label: "কোষ", value: "fcc", choices: Object.keys(CELLS).map(v => ({ v, label: CELLS[v].name })) }],
  presets: [{ name: "FCC: সবচেয়ে ঘন সাজানো", values: { cell: "fcc" } }, { name: "NaCl: দুই ধরনের আয়ন", values: { cell: "nacl" } }, { name: "হীরা: প্রতিটি C এ ৪টি বন্ধন", values: { cell: "diamond" } }],
  init({ root }) {
    spheres = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.85 })); root.add(m); return m; });
    edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.6, 3.6, 3.6)), new THREE.LineBasicMaterial({ color: 0xf1ece0 })); root.add(edges);
    bondLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x98948a })); bondLines.frustumCulled = false; root.add(bondLines);
  },
  update(p) {
    const cell = CELLS[p.cell], S = 3.6, V = a => new THREE.Vector3((a.p[0] - .5) * S, (a.p[2] - .5) * S, -(a.p[1] - .5) * S);
    spheres.forEach((m, i) => { const a = cell.atoms[i]; m.visible = !!a; if (!a) return; m.position.copy(V(a)); m.scale.setScalar(cell.r * S * 0.5 * (p.cell === "nacl" && a.c === 1 ? 0.7 : 1)); m.material.color.set(a.c ? 0xff8a3d : (p.cell === "nacl" ? 0x4fd68a : 0x4aa3ff)); });
    const pts = [];
    if (p.cell === "diamond") for (const a of cell.atoms) for (const b of cell.atoms) { const d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]); if (d > 0.4 && d < 0.45) { pts.push(V(a), V(b)); } }
    bondLines.geometry.setFromPoints(pts);
  },
  readouts(p) { const c = CELLS[p.cell]; return [
    { label: "কোষে মোট পরমাণু/আয়ন", value: perCell(c.atoms), color: 0xffb02e }, { label: "স্থানাংক সংখ্যা", value: c.cn }, { label: "ঠাসা দক্ষতা", value: c.pack ? c.pack + "%" : "প্রযোজ্য নয় (আয়নিক)" }, { label: "উদাহরণ", value: c.ex }]; },
  steps(p) { const c = CELLS[p.cell]; return [
    "একক কোষের কোণার পরমাণু আটটি কোষের মধ্যে ভাগ হয়, তাই কোণার অংশ 1/8। ফলকের অংশ 1/2, ধারের 1/4, ভেতরের সম্পূর্ণ 1।",
    `${c.name}: মোট ${perCell(c.atoms)}টি পরমাণু/আয়ন।`,
    c.pack ? `ঠাসা দক্ষতা = (পরমাণুর মোট আয়তন) / (কোষের আয়তন) = ${c.pack}%।` : "NaCl এ Na⁺ ও Cl⁻ পালা করে বসে; প্রতিটি আয়নকে ৬টি বিপরীত আয়ন ঘিরে থাকে।",
    "গোলকগুলো ভেতরটা দেখাতে সত্যিকারের অর্ধেক মাপে আঁকা। ঘুরিয়ে দেখো: কোনটি কোণা, ফলক, ধার বা ভেতরে।"]; },
  check(assert) {
    assert(perCell(CELLS.sc.atoms) === 1 && perCell(CELLS.bcc.atoms) === 2 && perCell(CELLS.fcc.atoms) === 4, "sc 1, bcc 2, fcc 4 atoms per cell");
    assert(perCell(CELLS.nacl.atoms) === 8 && perCell(CELLS.nacl.atoms.filter(a => a.c)) === 4, "NaCl: 4 Na + 4 Cl per cell");
    assert(perCell(CELLS.diamond.atoms) === 8, "diamond: 8 atoms per cell");
    assert(Math.abs(Math.PI / (3 * Math.SQRT2) * 100 - CELLS.fcc.pack) < 0.05 && Math.abs(Math.PI * Math.sqrt(3) / 8 * 100 - CELLS.bcc.pack) < 0.05, "packing: fcc 74.05%, bcc 68%");
  },
};
