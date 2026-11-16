// Multiple-choice check questions with a one-line reason. Progress is kept on the phone only (localStorage).
const KEY = "lab.progress.v1";
export function getProgress() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save(id, score, total) {
  try { const all = getProgress(); all[id] = { score, total, at: Date.now() }; localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {}
}

// questions: [{ q, options[], answer (index), why, scene? }]. One question at a time; calls onDone(score) at the end.
export function renderQuiz(el, questions, { id, onDone } = {}) {
  let i = 0, score = 0, picked = false;
  const show = () => {
    if (i >= questions.length) {
      if (id) save(id, score, questions.length);
      el.innerHTML = `<p class="qres"><b>${score}/${questions.length}</b> সঠিক।</p><button type="button" class="again">আবার করো</button>`;
      el.querySelector(".again").onclick = () => { i = 0; score = 0; show(); };
      onDone && onDone(score); return;
    }
    const q = questions[i]; picked = false;
    el.innerHTML = `<p class="qn">প্রশ্ন ${i + 1}/${questions.length}</p><p class="q">${q.q}</p>
      <div class="opts">${q.options.map((o, k) => `<button type="button" data-k="${k}">${o}</button>`).join("")}</div><div class="why" hidden></div>`;
    el.querySelectorAll(".opts button").forEach(b => b.onclick = () => {
      if (picked) return; picked = true;
      const k = +b.dataset.k, ok = k === q.answer; if (ok) score++;
      b.classList.add(ok ? "right" : "wrong");
      el.querySelector(`.opts button[data-k="${q.answer}"]`).classList.add("right");
      const w = el.querySelector(".why");
      w.hidden = false; w.innerHTML = `<p>${ok ? "ঠিক।" : "ঠিক হয়নি।"} ${q.why}</p><button type="button" class="nx">${i === questions.length - 1 ? "ফল দেখো" : "পরের প্রশ্ন"}</button>`;
      w.querySelector(".nx").onclick = () => { i++; show(); };
    });
  };
  show();
}
