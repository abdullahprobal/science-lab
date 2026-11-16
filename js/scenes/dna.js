// Scene: DNA double helix and replication. 10 base pairs per turn; A–T joined by 2 hydrogen bonds, G–C by 3.
import * as THREE from "../../vendor/three.module.js";

export const SEQ = "ATGCGTACCTAGGCTAATCG";
const PAIR = { A: "T", T: "A", G: "C", C: "G" }, COL = { A: 0x4aa3ff, T: 0xff8a3d, G: 0x4fd68a, C: 0xff4d4d };
export const comp = s => [...s].map(b => PAIR[b]).join("");
export const hbonds = (s, n = s.length) => [...s.slice(0, n)].reduce((a, b) => a + (b === "A" || b === "T" ? 2 : 3), 0);
const N = SEQ.length, RISE = 0.5, R = 1.2;
let s1, s2, rungs, back1, back2, nw1, nw2;
const sph = (root, r = 0.2) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); root.add(m); return m; };

export default {
  id: "dna",
  view: { theta: 0.6, phi: 1.35, r: 14 },
  params: [{ key: "open", label: "খোলা অংশ (প্রতিলিপন)", unit: "%", min: 0, max: 100, step: 5, value: 0 }],
  presets: [{ name: "দ্বিতন্ত্রী হেলিক্স", values: { open: 0 } }, { name: "অর্ধেক খুলেছে", values: { open: 50 } }, { name: "প্রতিলিপন শেষ: দুটি নতুন DNA", values: { open: 100 } }],
  init({ root, line, polyline }) {
    s1 = [...SEQ].map(() => sph(root)); s2 = [...SEQ].map(() => sph(root)); nw1 = [...SEQ].map(() => sph(root, 0.15)); nw2 = [...SEQ].map(() => sph(root, 0.15));
    rungs = [...SEQ].map(() => line(0xf1ece0, { opacity: 0.6 })); back1 = polyline(0x98948a, N); back2 = polyline(0x98948a, N);
  },
  update(p) {
    const k = Math.round(p.open / 100 * N), P = [], Q = [];
    for (let i = 0; i < N; i++) {
      const a = i * 2 * Math.PI / 10, y = (N / 2 - i) * RISE, o = i < k ? 0.5 + 2.2 * Math.min(1, (k - i) / 4) : 0;   // unzipped base pairs drift apart, Y-fork at the open end
      const A = new THREE.Vector3(R * Math.cos(a) - o, y, R * Math.sin(a)), B = new THREE.Vector3(-R * Math.cos(a) + o, y, -R * Math.sin(a));
      P.push(A); Q.push(B);
      s1[i].position.copy(A); s1[i].material.color.set(COL[SEQ[i]]); s2[i].position.copy(B); s2[i].material.color.set(COL[PAIR[SEQ[i]]]);
      if (i < k) { rungs[i].hide(); nw1[i].visible = nw2[i].visible = true;      // new bases pair with each template strand
        nw1[i].position.copy(A).add(new THREE.Vector3(0.6, 0, 0)); nw1[i].material.color.set(COL[PAIR[SEQ[i]]]);
        nw2[i].position.copy(B).add(new THREE.Vector3(-0.6, 0, 0)); nw2[i].material.color.set(COL[SEQ[i]]); }
      else { nw1[i].visible = nw2[i].visible = false; rungs[i].set(A, B); }
    }
    back1.set(P); back2.set(Q);
  },
  readouts(p) { const k = Math.round(p.open / 100 * N); return [
    { label: "খুলে যাওয়া ক্ষারকজোড়া", value: `${k} / ${N}` }, { label: "ভাঙা হাইড্রোজেন বন্ধন", value: hbonds(SEQ, k), color: 0xffb02e },
    { label: "A–T জোড়া / G–C জোড়া", value: `${[...SEQ].filter(b => "AT".includes(b)).length} / ${[...SEQ].filter(b => "GC".includes(b)).length}` }, { label: "এক পাকে ক্ষারকজোড়া", value: 10 }]; },
  steps(p) { return [
    `একটি সূত্রের ক্রম ${SEQ}। অপর সূত্র পরিপূরক: ${comp(SEQ)}। A–T এ ২টি, G–C এ ৩টি হাইড্রোজেন বন্ধন।`,
    "প্রতিলিপনে হেলিকেজ এনজাইম হাইড্রোজেন বন্ধন ভেঙে সূত্র দুটি আলাদা করে, ফলে Y-আকৃতির কাঁটা তৈরি হয়।",
    "প্রতিটি পুরোনো সূত্র ছাঁচ হিসেবে কাজ করে: DNA পলিমারেজ পরিপূরক ক্ষারক বসায় (ছবিতে ছোট গোলক)।",
    "ফলে দুটি DNA হয়, প্রতিটিতে একটি পুরোনো ও একটি নতুন সূত্র। একে অর্ধ-সংরক্ষণশীল (semi-conservative) প্রতিলিপন বলে।"]; },
  check(assert) {
    assert(comp("ATGC") === "TACG", "complement of ATGC is TACG");
    assert([...SEQ].every((b, i) => comp(SEQ)[i] === PAIR[b]), "every base pairs A–T or G–C");
    assert(hbonds("AT") === 4 && hbonds("GC") === 6 && hbonds(SEQ) === [...SEQ].reduce((s, b) => s + ("AT".includes(b) ? 2 : 3), 0), "hydrogen bonds: A–T 2, G–C 3");
  },
};
