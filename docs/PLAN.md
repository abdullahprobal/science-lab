# B&B Science Lab: free 3D science for HSC, starting with Physics

Written for an implementer (Opus 5.5) who has not seen the conversation. First step after approval: create the project folder and save this file there as `docs/PLAN.md`.

## Context

X-ray Biology (`P:\Bandb Resources\biology-xray`, live at biology.bandb.academy) proved the idea: a free Bangla tool that shows students what the textbook can only draw flat. The owner wants the same for physics and chemistry by HSC chapter, then for medical students: a site students enjoy and that makes them understand faster.

Owner's decisions (2026-11-17, final):
- Launch subject: **HSC Physics**. Chemistry next, then non-camera biology and medical.
- **One lab, one shared engine.** X-ray Biology stays where it is and becomes the Biology door.
- **Fully free.** AdSense on reading pages only, plus promotion cards for Board Radar books, bandb.academy courses and storyvocabs.com. No login, no payment.
- The one thing to remember: **"I finally saw it."**

## What the three reference sites do (looked at 2026-11-17)

| Site | What it is | What we take | What we do differently |
|---|---|---|---|
| mastersab.com | Paid 3D biology/physics/chemistry. Windows installer + Android app, hotline sales. Its client list is teachers and coaching centres | Proof that Bangladeshi teachers pay for 3D; "click and hold to rotate" model on the home page | Free, in the browser, no install. Students are the audience |
| prottoy.com.bd/3d-lab | Free corner of a large edtech: 3 modules (molecules, anatomy, periodic table with PubChem data, Bangla/English switch) | Bangla/English switch; open data sources for chemistry | Organised by NCTB chapter, with explanation and exam link, not a loose gallery |
| ssc-physics-lab.onrender.com | 54 simulations in 13 SSC chapters, 112 quiz items, ranks (Archimedes to Einstein), most chapters locked behind payment, mostly flat 2D | Chapter list as the home screen; each simulation is one named textbook problem ("Atwood machine", "gun recoil"); quiz progress | HSC level, real 3D where 3D helps, nothing locked, calmer design |

Gap nobody fills: **HSC-level physics, in Bangla, in 3D, free, tied to the board chapter.**

## The product in one paragraph

A static website. Home is the NCTB chapter list for HSC Physics 1st and 2nd paper. Each chapter opens "scenes". A scene is one idea you can turn with a finger and change with two or three sliders, while the numbers and the formula update live. Each scene has a guided tour (5 to 7 captioned steps), a few check questions with a one-line "কেন", and a Bangla reading page for search traffic. No account. Progress is saved on the phone.

## My input (ideas the owner asked for)

1. **Hand rules with the camera (the signature feature).** Reuse the X-ray Biology hand tracker: the student holds up their own hand and the site draws current, field and force arrows on their real fingers (Fleming's left-hand rule, right-hand grip rule, direction of A × B). This is the physics version of "I saw inside my own head", and it is the clip students will share.
2. **One colour code for quantities, everywhere.** Velocity, force, acceleration, electric field, magnetic field and current each get one fixed colour in every scene and every reading page. After three scenes the student reads a diagram without a legend.
3. **Every scene is a textbook problem, not a toy.** Presets carry the numbers of a typical problem ("45° তে নিক্ষিপ্ত, u = 20 m/s"); the scene plays it and a side panel shows the working step by step, the same style as the Board Radar books.
4. **Tag every scene for SSC as well as HSC.** B&B's buyers today are SSC students, and vectors, projectile, circuits, lenses and waves are in both syllabuses. One extra field per scene doubles the audience and lets each scene promote the matching Board Radar SSC book chapter.
5. **Concept map later, not first.** A 3D "map of physics" linking chapters looks good but teaches little. Build it in Phase 3 as a simple link graph generated from the `related` fields. Skipped until scenes exist.
6. **No game layer at launch.** Ranks and streaks are SSC Physics Lab's ground. We keep a quiet progress mark per chapter and a daily five; add more only if the usage numbers ask for it.

## Technical shape (kept as small as possible)

- New folder `P:\Bandb Resources\science-lab`, own git repo, GitHub Pages, address `lab.bandb.academy` (owner adds DNS: CNAME `lab` → `abdullahprobal.github.io`). Same publish method as biology.
- Static files only. No framework, no bundler, no server, no database. ES modules, three.js copied into `site/vendor/`.
- **Do not put physics into the biology repo** (it is one 900-line camera app). Copy the pieces listed under "Reuse" instead.

```
science-lab/
  DESIGN.md  README.md  docs/PLAN.md  docs/TESTING.md
  content/chapters.json     # NCTB chapter list, both papers (names, order, scene ids)
  content/scenes/<id>.json  # Bangla text: title, intro, tour steps, questions, reading page, ssc/hsc tags, related, reviewed_by
  content/promos.json
  site/index.html  site/scene.html  site/style.css
  site/js/shell.js          # the only viewer: three.js setup, orbit, sliders, readouts, tour, quiz, labels
  site/js/scenes/<id>.js    # one file per scene
  site/js/hand.js           # camera hand tracking (from biology)
  site/vendor/three.module.js
  tools/build.mjs           # content -> site/data, reading pages, sitemap, version stamps
  tools/check.mjs           # runs every scene's check()
```

**Scene contract** (the whole "engine"; one file per scene, nothing else to learn):

```js
export default {
  id: 'projectile',
  params: [{ key:'u', label:'আদিবেগ', unit:'m/s', min:5, max:40, step:1, value:20 }, ...],
  presets: [{ name:'সর্বোচ্চ পাল্লা', values:{ u:20, angle:45 } }],
  init(ctx) {},              // build meshes once; ctx = { scene, camera, arrow(), label(), trail(), colors }
  update(p, t) {},           // called every frame with slider values and time
  readouts(p) { return [{ label:'পাল্লা R', value: p.u**2*Math.sin(2*a)/g, unit:'m' }] },
  steps(p) { return [...] }, // worked solution lines for the side panel
  check() {}                 // asserts: known inputs give textbook answers
}
```

`shell.js` supplies shared helpers once (`arrow`, `label`, `trail`, `grid`, `fieldLines`) so a scene file is mostly physics. No abstraction beyond that until a third scene needs it.

Formulas: plain HTML with `<sup>`/`<sub>` and Unicode. Add KaTeX (rendered at build time, no client script) only when a formula cannot be written that way.

## Reuse from X-ray Biology (copy, then trim)

| Need | Take from `P:\Bandb Resources\biology-xray` |
|---|---|
| Page generation, `?v=<hash>` stamps, sitemap, `AD_SLOT`, review gate | `tools/build.mjs` |
| Hand tracker loading and hand pose | `loadTrackers()`, `poseHand()` in `site/app.js` |
| Smoothing | the One-Euro filter in `site/app.js` |
| Dot + leader-line labels, 8-label budget | `collectDots()`, `drawHud()` in `site/app.js` |
| Quiz with "কেন", saved in localStorage | quiz code in `site/app.js` |
| Promotion cards by slot | `content/promos.json` and its renderer |
| Compression and caching | `site/.htaccess` (only if hosted on Hostever; not needed on GitHub Pages) |
| Policy pages, header/footer menu | whatever biology has shipped by then; same wording, new site name |
| Design tokens and fonts | `DESIGN.md` |

Question data: `P:\Bandb Resources\Science Suggession Book\02-board-questions` and `03-analysis` hold verified **SSC** board questions. Use them only for SSC-tagged links. There is no HSC question bank yet, so HSC scenes carry only our own reviewed check questions. **Never invent a board question or a statistic.**

## Design (same family as X-ray Biology, written to `DESIGN.md` in Phase 0)

- **Direction: the instrument.** Black film background, bone-white lines, the scene always on screen, including the home page (a slowly turning field or orbit you can grab). It serves "I finally saw it": nothing on screen competes with the thing being seen.
- **Tokens: unchanged from biology** (`film #050607`, `bone #f1ece0`, `dim #98948a`, `line #2a2925`, `lamp #ffb02e` as the only interface accent). One family across Biology, Physics and Chemistry, so books and promos can show any of them.
- **Type: unchanged.** Anek Bangla for headlines and controls, Hind Siliguri for reading, JetBrains Mono small capitals for symbols, units and English terms.
- **New for physics: the quantity colours**, used only inside the scene and as a dot beside the readout. Pick six that stay distinct for colour-blind students and on cheap screens; test before fixing them. Starting set: velocity blue, acceleration orange, force red, electric field yellow, magnetic field green, current/charge violet.
- **Layout.** Phone first: scene on top (60% of the height), sliders and readouts below in hairline rows, tour captions over the lower edge of the scene. Desktop: scene left, panel right. Left aligned, 4px corners, no cards, no pills, no glows, one filled button per screen.
- **Motion.** Only the physics moves. Interface changes are instant or a 150 ms fade.
- Reading pages may use a light background (bone paper, film text) for long reading and ads; the embedded scene block stays black.

## Launch content: 12 scenes for HSC Physics

Chosen because each shows something a flat page cannot. Chapter numbers follow the NCTB HSC syllabus; confirm names against the textbook contents page before writing `chapters.json`.

| # | Scene | Paper · chapter | What the student sees |
|---|---|---|---|
| 1 | Vectors in 3D | 1 · ভেক্টর | Components on three axes, addition, dot and cross product as a turning arrow |
| 2 | **Hand rules (camera)** | 1 · ভেক্টর; 2 · চৌম্বক ক্রিয়া | Arrows on the student's own hand |
| 3 | Projectile | 1 · গতিবিদ্যা | Path with velocity split into two arrows that change live |
| 4 | Circular motion and banking | 1 · নিউটনীয় বলবিদ্যা | Car on a banked road, forces resolved |
| 5 | Orbits and satellites | 1 · মহাকর্ষ ও অভিকর্ষ | Launch speed slider: falls, orbits, escapes |
| 6 | SHM | 1 · পর্যাবৃত্ত গতি | Spring, pendulum and the reference circle drawing the sine curve |
| 7 | Waves | 1 · তরঙ্গ | Transverse vs longitudinal, superposition, standing waves |
| 8 | Gas in a box | 1 · আদর্শ গ্যাস | Molecules hitting walls; P, V, T linked |
| 9 | Electric field | 2 · স্থির তড়িৎ | 3D field lines and equipotential surfaces for 1 to 3 charges |
| 10 | Magnetic field and moving charge | 2 · চৌম্বক ক্রিয়া | Field round a wire and solenoid; a charge spiralling |
| 11 | Induction and AC generator | 2 · তাড়িতচৌম্বক আবেশ | Coil turning in a field, flux and emf curves drawn together |
| 12 | Lens, mirror and double slit | 2 · আলোকবিজ্ঞান | Rays in 3D; fringes forming from two waves |

After launch, in this order: atom models and nuclear decay, PV cycles and heat engines, circuits and Kirchhoff, semiconductors and logic gates, structural properties of matter, astronomy.

## Implementation plan

Each phase ends with its checks passing, a commit and a push. Do not start a phase before the one above it passes.

### Phase 0. Skeleton and one finished scene (prove the whole path)
- 0.1 Create the repo and folders above. Write `DESIGN.md` from the Design section. Copy `tools/build.mjs` from biology and cut it down to: copy content, stamp versions, build the chapter list.
- 0.2 `site/js/shell.js`: three.js scene, touch orbit (one finger turn, two finger zoom), slider rows built from `params`, readout rows, preset buttons, resize, pause when the tab is hidden.
- 0.3 Scene 1 (Vectors in 3D) complete: sliders, readouts, worked steps, `check()`.
- 0.4 `tools/check.mjs`: import every scene, run `check()`, exit non-zero on failure.
- 0.5 Home page: chapter list from `chapters.json`, with the live scene behind the headline.
- **Stop here and show the owner on his phone** before building eleven more.

### Phase 1. The other 11 scenes
- One scene per commit, in table order. Each must have `check()` with at least two textbook values (for example range at 45° and 20 m/s is 40.8 m with g = 9.8).
- Scene 2 (hand rules): copy hand tracking into `site/js/hand.js`; camera video stays on the phone; a no-camera fallback shows a 3D model hand. Never an ad or promo on the camera screen.
- Add shared helpers to `shell.js` only when a second scene needs the same thing.
- Low-power rule from biology: measure frame rate for 3 seconds; under 20, drop pixel ratio to 1 and halve particle and field-line counts.

### Phase 2. Teach, not just show
- 2.1 Tours: `tour` array in each `content/scenes/<id>.json` (`{ values, camera, caption_bn, highlight }`); next/back in the shell.
- 2.2 Check questions: 3 to 5 per scene, own-written, each with a one-line "কেন"; results and weak scenes saved in localStorage (wrapped in try/catch); "আজকের ৫টি" on the home page.
- 2.3 Worked-steps panel from `steps(p)` for every preset.
- 2.4 Bangla / English name switch on labels (exams use English symbols and terms).
- 2.5 Review gate: build refuses to publish a scene whose `reviewed_by` is empty. A physics teacher reviews with the checklist in `docs/REVIEW.md`.

### Phase 3. Pages, search and launch
- 3.1 `tools/build.mjs` generates one reading page per scene (500+ words: idea, formula, worked example, common mistakes, the embedded scene, related scenes, FAQ, JSON-LD `Article` + `FAQPage` + `BreadcrumbList`) and one hub page per chapter.
- 3.2 Difference tables and "মনে রাখো" pages for the chapters covered (searched heavily before exams).
- 3.3 Policy pages, header and footer menu, `robots.txt`, `sitemap.xml`, 404, share image per scene (a snapshot of the scene).
- 3.4 Two fixed-height ad slots on reading pages only. Promotion card slots: end of tour, quiz result, reading-page foot. SSC-tagged scenes promote the matching Board Radar book.
- 3.5 Analytics (GA4): scene opened, tour finished, quiz score, promo click, frame-rate bucket. No personal data.
- 3.6 DNS and custom domain; Search Console; add a "Science Lab" door on biology.bandb.academy and a Biology door here. Next print run of the books: QR to lab.bandb.academy.
- 3.7 Concept map page generated from `related` (plain link graph; 3D only if it is cheap with the shell).

### Phase 4. Chemistry (same shell, new scenes)
Molecule viewer with VSEPR shapes and hybridisation, s/p/d orbitals, periodic trends in 3D, crystal lattices (NaCl, diamond, graphite), organic mechanisms as stepped tours, electrochemical cell, titration curve. Structures from PubChem (public domain); record sources in `MODELS-LICENSE.md`.

### Phase 5. Biology and medical
Non-camera biology on the same shell: cell and organelles, DNA replication and protein synthesis, mitosis and meiosis, plant tissue. Medical admission layer: the same scenes with admission-level questions once a verified question source exists. X-ray Biology remains the anatomy product.

## Rules for the implementer
- Edit `content/`, `tools/`, `site/js/`, `site/*.html`, `site/style.css`. Never hand-edit generated `site/data/` or `site/read/`.
- Every scene ships with `check()`; `node tools/check.mjs` must pass before each commit.
- Never invent a board or admission question or a statistic. Empty is better than made up.
- All physics text is unreviewed until `reviewed_by` is filled. Write in our own words, not textbook sentences.
- Bangla: plain short sentences, English term in brackets on first use, SI units, g = 9.8 m/s² unless the preset says otherwise.
- Camera video never leaves the phone.
- Relative links everywhere. Follow `DESIGN.md`. No new dependency without a reason written in the commit.
- Do not touch `P:\Bandb Resources\Science Suggession Book` or the biology repo except to copy files out.

## Decisions still open (defaults in brackets)
1. Site name and address. [বিজ্ঞান ল্যাব / B&B Science Lab at `lab.bandb.academy`]
2. Who reviews the physics text. [The physics co-author of the Board Radar physics book.]
3. HSC board and admission question source. [None yet: only own-written check questions.]
4. Hosting. [GitHub Pages, like biology.]

## Verification
1. `node tools/check.mjs` passes (every scene's numbers match textbook values).
2. `node tools/build.mjs` exits clean; `node --check` passes on every module.
3. `python -m http.server 8766 --directory site`; open each scene in the browser pane: move every slider to both ends, run each preset and the full tour; console has no errors.
4. Phone size (375×812) screenshots of home, one scene, tour, quiz result and one reading page, compared against `DESIGN.md`.
5. Hand-rule scene: test with the hand photos already in `biology-xray/site/_test/` through a `#test=` hook, then on the owner's phone.
6. Frame rate at least 30 on the owner's phone and usable on one cheap Android (low-power mode switches on by itself).
7. Before AdSense: Rich Results test on three reading pages, all footer links work, 30+ reviewed pages live.
