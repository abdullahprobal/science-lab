# বিজ্ঞান ল্যাব (B&B Science Lab)

Free Bangla 3D science for HSC: physics, chemistry, biology, by chapter. Plan: `docs/PLAN.md`. Design: `DESIGN.md`.

```
node tools/check.mjs                 # every scene's physics/maths check + content check; must pass before a commit
node tools/build.mjs                 # content -> site/data, reading pages, sitemap, version stamps
node tools/build.mjs --release       # same, but refuses while any scene has an empty reviewed_by
python -m http.server 8766 --directory site     # http://localhost:8766/
```

Add a scene: `content/scenes/<id>.json` (tour, questions, reading text) + `site/js/scenes/<id>.js` (copy `vectors.js`) + add the id to a chapter in `content/chapters.json`. Never hand-edit `site/data/` or `site/read/`.

Switches in `content/site.json`: `adsense_client` (after approval), `ga_id` (analytics). Both empty = off.

Test the camera hand rules without a camera: `scene.html?s=hand-rules#test=_test/<photo>` (photos in `site/_test/`, git-ignored).

three.js 0.160.0 (MIT) is copied into `site/vendor/`. See `MODELS-LICENSE.md`.
