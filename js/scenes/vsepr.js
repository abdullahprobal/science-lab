// Scene: molecular shapes from VSEPR. Pick bonding pairs and lone pairs around the central atom; the shape follows.
import * as THREE from "../../vendor/three.module.js";

const s3 = Math.sqrt(3) / 2, t = 1 / Math.sqrt(3);
const EQ = [[1, 0, 0], [-0.5, 0, s3], [-0.5, 0, -s3]];
const DIRS = { 2: [[1, 0, 0], [-1, 0, 0]], 3: EQ.map(v => v), 4: [[t, t, t], [t, -t, -t], [-t, t, -t], [-t, -t, t]],
  5: [[0, 1, 0], [0, -1, 0], ...EQ], 6: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]] };
const LONE = { 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [2, 3, 4, 0, 1], 6: [4, 5, 0, 1, 2, 3] };   // lone pairs take equatorial (5) or trans (6) places first
const NAMES = { "2,0": ["রৈখিক", "BeCl₂", "180°"], "3,0": ["সমতলীয় ত্রিকোণাকার", "BF₃", "120°"], "2,1": ["বাঁকা (V-আকৃতি)", "SO₂", "<120°"], "4,0": ["চতুস্তলকীয়", "CH₄", "109.5°"],
  "3,1": ["ত্রিকোণাকার পিরামিড", "NH₃", "107°"], "2,2": ["বাঁকা (V-আকৃতি)", "H₂O", "104.5°"], "5,0": ["ত্রিকোণাকার দ্বিপিরামিড", "PCl₅", "90°, 120°"], "4,1": ["করাতের আকৃতি (see-saw)", "SF₄", "<90°, <120°"],
  "3,2": ["T-আকৃতি", "ClF₃", "<90°"], "2,3": ["রৈখিক", "XeF₂", "180°"], "6,0": ["অষ্টতলকীয়", "SF₆", "90°"], "5,1": ["বর্গাকার পিরামিড", "BrF₅", "<90°"], "4,2": ["বর্গাকার সমতলীয়", "XeF₄", "90°"] };

export function shape(bp, lp) { return NAMES[`${bp},${lp}`] || null; }     // [name, example, angle]
export const domains = (p) => ({ bp: p.bp, lp: Math.min(p.lp, 6 - p.bp) });
let atoms, lobes, bonds, centre;

export default {
  id: "vsepr",
  view: { theta: 0.7, phi: 1.1, r: 8 },
  params: [
    { key: "bp", label: "বন্ধন জোড়া", min: 2, max: 6, step: 1, value: 4 },
    { key: "lp", label: "মুক্ত জোড়া (lone pair)", min: 0, max: 3, step: 1, value: 0 },
  ],
  presets: [{ name: "CH₄", values: { bp: 4, lp: 0 } }, { name: "NH₃", values: { bp: 3, lp: 1 } }, { name: "H₂O", values: { bp: 2, lp: 2 } }, { name: "BF₃", values: { bp: 3, lp: 0 } }, { name: "SF₆", values: { bp: 6, lp: 0 } }, { name: "XeF₄", values: { bp: 4, lp: 2 } }],
  init({ root, line }) {
    centre = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf1ece0 })); root.add(centre);
    atoms = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), new THREE.MeshBasicMaterial({ color: 0x4aa3ff })); root.add(m); return m; });
    lobes = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.35, depthWrite: false })); m.scale.set(0.8, 0.8, 1.2); root.add(m); return m; });
    bonds = atoms.map(() => line(0xf1ece0));
  },
  update(p) {
    const { bp, lp } = domains(p), n = bp + lp, dirs = DIRS[n].map(d => new THREE.Vector3(...d)), lone = new Set(LONE[n].slice(0, lp));
    let b = 0, l = 0;
    dirs.forEach((d, i) => {
      if (lone.has(i)) { const m = lobes[l++]; m.visible = true; m.position.copy(d).multiplyScalar(1.2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); }
      else { const m = atoms[b]; m.visible = true; m.position.copy(d).multiplyScalar(2.2); bonds[b].set(new THREE.Vector3(), m.position); b++; }
    });
    for (; b < 6; b++) { atoms[b].visible = false; bonds[b].hide(); } for (; l < 6; l++) lobes[l].visible = false;
  },
  readouts(p) { const { bp, lp } = domains(p), s = shape(bp, lp); return [
    { label: "মোট ইলেকট্রন জোড়া", value: bp + lp }, { label: "আকৃতি", value: s ? s[0] : "পরিচিত নয়", color: 0xffb02e }, { label: "উদাহরণ", value: s ? s[1] : "—" }, { label: "বন্ধন কোণ", value: s ? s[2] : "—" }]; },
  steps(p) { const { bp, lp } = domains(p); return [
    "VSEPR: কেন্দ্রীয় পরমাণুর চারপাশের ইলেকট্রন জোড়াগুলো পরস্পরকে বিকর্ষণ করে যতটা সম্ভব দূরে সরে যায়।",
    `মোট জোড়া ${bp + lp}টি (${bp} বন্ধন + ${lp} মুক্ত), তাই জোড়াগুলো ${{ 2: "রৈখিক", 3: "ত্রিকোণাকার সমতলে", 4: "চতুস্তলকের কোণে", 5: "ত্রিকোণাকার দ্বিপিরামিডে", 6: "অষ্টতলকের কোণে" }[bp + lp]} সাজায়।`,
    "মুক্ত জোড়া (হলুদ) বেশি জায়গা নেয়, তাই বন্ধন কোণ একটু কমে যায়। আকৃতির নাম শুধু পরমাণুর অবস্থান দিয়ে হয়, মুক্ত জোড়া বাদ দিয়ে।",
    p.lp > 6 - p.bp ? "এত জোড়া এক কেন্দ্রে বসে না, তাই মুক্ত জোড়া কমানো হয়েছে।" : "অন্য মান বদলিয়ে দেখো আকৃতি কীভাবে বদলায়।"]; },
  check(assert) {
    assert(shape(4, 0)[1] === "CH₄" && shape(3, 1)[1] === "NH₃" && shape(2, 2)[1] === "H₂O", "CH4, NH3, H2O: 4,0 / 3,1 / 2,2");
    assert(shape(4, 2)[0] === "বর্গাকার সমতলীয়" && shape(5, 1)[0] === "বর্গাকার পিরামিড", "XeF4 square planar, BrF5 square pyramid");
    for (let bp = 2; bp <= 6; bp++) for (let lp = 0; lp <= 3; lp++) if (bp + lp <= 6) assert(DIRS[bp + lp] && LONE[bp + lp].length >= lp, `directions exist for ${bp},${lp}`);
    const d = DIRS[4]; assert(d.every((v, i) => d.every((w, j) => i === j || Math.abs(v[0] * w[0] + v[1] * w[1] + v[2] * w[2] + 1 / 3) < 1e-9)), "tetrahedron: every angle is 109.47° (cos = −1/3)");
  },
};
