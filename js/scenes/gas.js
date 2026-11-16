// Scene: gas molecules in a box. Pressure from wall hits; P V = N k T (shown in relative units).
import * as THREE from "../../vendor/three.module.js";
const f = n => Math.round(n * 100) / 100, N = 140;

export function pressure(p) { return p.n * p.T / p.V; }     // relative units: P ∝ nT/V
let pos, vel, pts, box, seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, gauss = () => (rnd() + rnd() + rnd() - 1.5) * 2;

export default {
  id: "gas",
  view: { theta: 0.7, phi: 1.1, r: 14 },
  params: [
    { key: "T", label: "তাপমাত্রা T", unit: "K", min: 100, max: 600, step: 50, value: 300 },
    { key: "V", label: "আয়তন V (আপেক্ষিক)", min: 1, max: 4, step: 0.5, value: 4 },
    { key: "n", label: "অণুর পরিমাণ n (আপেক্ষিক)", min: 1, max: 2, step: 0.5, value: 1 },
  ],
  presets: [{ name: "বয়েলের সূত্র: আয়তন অর্ধেক", values: { T: 300, V: 2, n: 1 } }, { name: "চার্লসের সূত্র: তাপ বেশি", values: { T: 600, V: 4, n: 1 } }, { name: "দ্বিগুণ গ্যাস", values: { T: 300, V: 4, n: 2 } }],
  init({ root }) {
    pos = new Float32Array(3 * N); vel = new Float32Array(3 * N);
    for (let i = 0; i < 3 * N; i++) { pos[i] = (rnd() - 0.5) * 3.6; vel[i] = gauss(); }
    pts = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3)), new THREE.PointsMaterial({ color: 0xffb02e, size: 0.2 })); pts.frustumCulled = false; root.add(pts);
    box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xf1ece0 })); root.add(box);
  },
  update(p, t, dt = 0.016) {
    const Lx = 2 * p.V, Ly = 4, Lz = 4, s = Math.sqrt(p.T / 300) * 3;     // speed ∝ √T
    box.scale.set(Lx, Ly, Lz); const half = [Lx / 2, Ly / 2, Lz / 2];
    for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) {
      const j = 3 * i + k; pos[j] += vel[j] * s * dt;
      if (Math.abs(pos[j]) > half[k]) { pos[j] = Math.sign(pos[j]) * half[k]; vel[j] = -vel[j]; }
    }
    pts.geometry.attributes.position.needsUpdate = true;
  },
  readouts(p) { return [{ label: "তাপমাত্রা T", value: p.T, unit: "K" }, { label: "চাপ P (শুরুর অবস্থার তুলনায়)", value: f(pressure(p) / 75) }, { label: "P × V ÷ (nT)", value: "ধ্রুবক", color: 0xffb02e }, { label: "গড় বর্গবেগের বর্গমূল ∝ √T", value: f(Math.sqrt(p.T / 300)), unit: "× (300 K এর)" }]; },
  steps(p) { return [
    "PV = nRT। এখানে তিনটির যেকোনোটি বদলালে বাকিগুলো মিলে যায়।",
    "আয়তন কমালে অণুগুলো দেয়ালে বেশি বার ধাক্কা দেয়, তাই চাপ বাড়ে (বয়েলের সূত্র: T স্থির হলে PV ধ্রুবক)।",
    "তাপমাত্রা বাড়ালে অণুর গড় গতিশক্তি বাড়ে (½mv² ∝ T), তাই ধাক্কা জোরে ও বেশি বার হয়।",
    `এখন: n T / V = ${p.n} × ${p.T} / ${p.V} = ${f(pressure(p))} (আপেক্ষিক চাপ)।`]; },
  check(assert) {
    const a = { T: 300, V: 4, n: 1 };
    assert(pressure({ ...a, V: 2 }) === 2 * pressure(a), "Boyle: halve V at fixed T, P doubles");
    assert(pressure({ ...a, T: 600 }) === 2 * pressure(a), "double T at fixed V: P doubles");
    assert(pressure({ ...a, n: 2 }) === 2 * pressure(a), "double the gas: P doubles");
    assert(pressure({ ...a, V: 2, T: 150 }) === pressure(a), "V/2 and T/2 leave P unchanged");
  },
};
