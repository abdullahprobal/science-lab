// Scene: a 3D animal cell. Pick an organelle to light it up and read what it does.
import * as THREE from "../../vendor/three.module.js";

export const ORG = {
  all: ["সব অঙ্গাণু", "কোষের ভেতরের সব অংশ একসাথে।"],
  membrane: ["কোষঝিল্লি", "কোষকে ঘিরে রাখে; কোনটি ভেতরে ঢুকবে বা বেরোবে তা নিয়ন্ত্রণ করে (নির্বাচনধর্মী ভেদ্য)।"],
  nucleus: ["নিউক্লিয়াস", "DNA ধারণ করে; কোষের সব কাজ নিয়ন্ত্রণ করে। ভেতরের নিউক্লিওলাসে রাইবোসোম তৈরি শুরু হয়।"],
  mito: ["মাইটোকন্ড্রিয়া", "কোষীয় শ্বসনে ATP তৈরি করে, তাই একে কোষের শক্তিঘর বলে। নিজস্ব DNA ও রাইবোসোম আছে।"],
  er: ["অন্তঃপ্লাজমীয় জালিকা (ER)", "রাইবোসোমযুক্ত অংশ (RER) প্রোটিন তৈরি করে; মসৃণ অংশ (SER) লিপিড তৈরি ও বিষ নিষ্ক্রিয় করে।"],
  golgi: ["গলজি বস্তু", "প্রোটিন ও লিপিড বাছাই, পরিবর্তন ও মোড়ক করে কোষের বাইরে বা অন্য জায়গায় পাঠায়।"],
  lyso: ["লাইসোসোম", "হজমকারী এনজাইম দিয়ে ক্ষতিগ্রস্ত অঙ্গাণু ও বর্জ্য হজম করে; একে কোষের আত্মঘাতী থলি বলে।"],
  ribo: ["রাইবোসোম", "mRNA পড়ে প্রোটিন সংশ্লেষ করে। ছোট কণা; ER এ লেগে বা মুক্ত থাকে।"],
};
const ids = Object.keys(ORG).filter(k => k !== "all");
let groups, shell;
const mat = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: o === 1 });
const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const place = (min, max) => { for (;;) { const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).multiplyScalar(max); if (v.length() > min && v.length() < max) return v; } };

export default {
  id: "cell",
  view: { theta: 0.6, phi: 1.2, r: 11 },
  params: [{ key: "org", label: "অঙ্গাণু", value: "all", choices: Object.keys(ORG).map(v => ({ v, label: ORG[v][0] })) }],
  presets: [{ name: "পুরো কোষ", values: { org: "all" } }, { name: "নিউক্লিয়াস", values: { org: "nucleus" } }, { name: "মাইটোকন্ড্রিয়া", values: { org: "mito" } }, { name: "গলজি বস্তু", values: { org: "golgi" } }],
  init({ root }) {
    groups = Object.fromEntries(ids.map(k => [k, new THREE.Group()])); Object.values(groups).forEach(g => root.add(g));
    shell = new THREE.Mesh(new THREE.SphereGeometry(4, 40, 28), mat(0x98948a, 0.18)); shell.scale.set(1.15, 1, 1); groups.membrane.add(shell);
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(1.3, 28, 20), mat(0x4aa3ff, 0.8)); nuc.position.set(-0.6, 0.3, 0); groups.nucleus.add(nuc);
    const nl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), mat(0x1c4f87)); nl.position.set(-0.9, 0.5, 0.5); groups.nucleus.add(nl);
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 10), mat(0xff8a3d)); m.scale.set(1.8, 0.8, 0.8); m.position.copy(place(1.8, 3.2)); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); groups.mito.add(m); }
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1.45 + i * 0.12, 0.09, 8, 36), mat(0x4fd68a)); m.position.set(-0.6, 0.3, 0); m.rotation.set(1.1 + i * 0.5, i, 0); groups.er.add(m); }
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.9 - i * 0.07, 0.07, 8, 28, 4.2), mat(0xffd84a)); m.position.set(2.2 + i * 0.22, -1.8, 0.4); m.rotation.set(0.4, 1.2, 0); groups.golgi.add(m); }
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), mat(0xb48cff)); m.position.copy(place(1.8, 3.3)); groups.lyso.add(m); }
    const dots = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 70 }, () => place(1.7, 3.6))), new THREE.PointsMaterial({ color: 0xff4d4d, size: 0.12 })); groups.ribo.add(dots);
  },
  update(p, t) {
    for (const k of ids) { const on = p.org === "all" || p.org === k, g = groups[k];
      g.traverse(o => { if (o.material) { o.material.opacity = o.userData.o ??= o.material.opacity; if (!on) o.material.opacity = o.userData.o * 0.12; if (k === "membrane" && p.org === k) o.material.opacity = 0.5; } }); }
    groups.mito.rotation.y = t * 0.1;
  },
  readouts(p) { return [{ label: "নাম", value: ORG[p.org][0], color: 0xffb02e }, { label: "কাজ", value: ORG[p.org][1] }]; },
  steps(p) { return [ORG[p.org][1], "ঘুরিয়ে দেখো: অঙ্গাণুগুলো একে অপরের সাথে কাজ করে। নিউক্লিয়াস নির্দেশ দেয়, রাইবোসোম প্রোটিন বানায়, গলজি বস্তু মোড়ক করে, মাইটোকন্ড্রিয়া শক্তি জোগায়।", "প্রাণীকোষে কোষপ্রাচীর ও ক্লোরোপ্লাস্ট নেই; উদ্ভিদকোষে আছে।"]; },
  check(assert) {
    assert(ids.every(k => ORG[k] && ORG[k][0] && ORG[k][1].length > 20), "every organelle has a name and a function");
    assert(ids.length === 7, "seven organelles");
  },
};
