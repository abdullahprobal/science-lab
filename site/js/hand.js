// Camera hand rules: draws force, field and current arrows on the student's own hand (Fleming's left-hand rule).
// The video never leaves the phone. Trackers load from a CDN on first use (hand model about 8 MB).
const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
// finger -> [base landmark, tip landmark, label, colour]. Thumb = force, first finger = field, middle finger = current.
const FINGERS = [[2, 4, "F বল", "#ff4d4d"], [5, 8, "B ক্ষেত্র", "#4fd68a"], [9, 12, "I প্রবাহ", "#b48cff"]];

export async function startHandCamera(stage, { testPhoto = "" } = {}) {
  const box = document.createElement("div"); box.className = "handcam";
  const video = document.createElement("video"); video.playsInline = true; video.muted = true;
  const cv = document.createElement("canvas"), g = cv.getContext("2d");
  const note = document.createElement("p"); note.className = "handnote";
  const close = document.createElement("button"); close.type = "button"; close.className = "stagebtn handx"; close.textContent = "ক্যামেরা বন্ধ";
  box.append(video, cv, note, close); stage.append(box);
  let stream = null, raf = 0, tracker = null, alive = true;
  const stop = () => { alive = false; cancelAnimationFrame(raf); stream && stream.getTracks().forEach(t => t.stop()); try { tracker && tracker.close(); } catch (e) {} box.remove(); };
  close.onclick = stop;
  try {
    note.textContent = "ক্যামেরা চালু হচ্ছে…";
    if (testPhoto) {                                   // test hook: a still photo from this site stands in for the camera
      if (!/^[\w\-/.]+$/.test(testPhoto) || testPhoto.includes("..")) throw new Error("test photo must be a path inside this site");
      const img = new Image(); img.src = testPhoto; await img.decode();
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const cg = c.getContext("2d"); cg.drawImage(img, 0, 0); setInterval(() => cg.drawImage(img, 0, 0), 66); stream = c.captureStream(15);
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("এই ব্রাউজারে ক্যামেরা চালু করা যায় না। Chrome ব্যবহার করো।");
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
    }
    video.srcObject = stream; await video.play();
    if (!testPhoto) video.style.transform = "scaleX(-1)";   // mirror like a mirror; the overlay is mirrored in code below
    note.textContent = "হাতের মডেল লোড হচ্ছে (প্রথমবার একটু সময় লাগে)…";
    const v = await import(MP + "/vision_bundle.mjs"), files = await v.FilesetResolver.forVisionTasks(MP + "/wasm");
    const make = delegate => v.HandLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: HAND_MODEL, delegate }, runningMode: "VIDEO", numHands: 2 });
    tracker = await make("GPU").catch(() => make("CPU"));
    if (!alive) return { stop };
    note.textContent = "বাম হাত তোলো। বুড়ো আঙুল, তর্জনী আর মধ্যমা পরস্পরের সাথে সমকোণে ছড়াও।";
    const mirror = !testPhoto;
    const loop = now => {
      if (!alive) return; raf = requestAnimationFrame(loop);
      const W = cv.width = box.clientWidth, H = cv.height = box.clientHeight, vw = video.videoWidth || 1, vh = video.videoHeight || 1;
      const sc = Math.max(W / vw, H / vh), ox = (W - vw * sc) / 2, oy = (H - vh * sc) / 2;   // object-fit: cover
      const pt = l => ({ x: mirror ? W - (l.x * vw * sc + ox) : l.x * vw * sc + ox, y: l.y * vh * sc + oy, z: l.z * vw * sc });
      const res = tracker.detectForVideo(video, now);
      g.clearRect(0, 0, W, H); g.lineCap = "round"; g.font = "600 15px 'Anek Bangla', sans-serif";
      const hands = res.landmarks || [];
      if (hands.length) note.textContent = "বুড়ো আঙুল = বল F · তর্জনী = চৌম্বক ক্ষেত্র B · মধ্যমা = তড়িৎ প্রবাহ I";
      for (const lm of hands) {
        const dirs = [];
        for (const [a, b, name, col] of FINGERS) {
          const A = pt(lm[a]), B = pt(lm[b]), d = { x: B.x - A.x, y: B.y - A.y, z: B.z - A.z }, n = Math.hypot(d.x, d.y, d.z) || 1;
          dirs.push(d);
          const L = Math.max(70, n * 0.9), ex = B.x + d.x / n * L, ey = B.y + d.y / n * L;
          g.strokeStyle = g.fillStyle = col; g.lineWidth = 5;
          g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(ex, ey); g.stroke();
          const ang = Math.atan2(ey - B.y, ex - B.x);
          g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - 16 * Math.cos(ang - 0.4), ey - 16 * Math.sin(ang - 0.4)); g.lineTo(ex - 16 * Math.cos(ang + 0.4), ey - 16 * Math.sin(ang + 0.4)); g.closePath(); g.fill();
          g.fillStyle = "#050607"; g.fillText(name, ex + 9, ey + 1); g.fillStyle = col; g.fillText(name, ex + 8, ey);
        }
        const ang = (i, j) => Math.round(Math.acos(Math.max(-1, Math.min(1, (dirs[i].x * dirs[j].x + dirs[i].y * dirs[j].y + dirs[i].z * dirs[j].z) / (Math.hypot(dirs[i].x, dirs[i].y, dirs[i].z) * Math.hypot(dirs[j].x, dirs[j].y, dirs[j].z) || 1))) * 180 / Math.PI));
        g.fillStyle = "#f1ece0"; g.fillText(`কোণ: F-B ${ang(0, 1)}° · B-I ${ang(1, 2)}° · F-I ${ang(0, 2)}°`, 12, H - 16);
      }
    };
    raf = requestAnimationFrame(loop);
  } catch (e) { console.error(e); note.textContent = e && e.message && /[ঀ-৿]/.test(e.message) ? e.message : "ক্যামেরা বা হাতের মডেল চালু করা গেল না। অনুমতি দিয়েছ কি? ইন্টারনেট চালু আছে কি?"; }
  return { stop };
}
