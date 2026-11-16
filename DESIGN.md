# Design: বিজ্ঞান ল্যাব (B&B Science Lab)

**One thing to remember:** "I finally saw it."

## Direction: the instrument
Same family as X-ray Biology (black film, bone-white light, one amber accent) so books and promos can show any of our products. The scene is the only image and is always on screen, including the home page (a slowly turning scene behind the headline). Nothing decorates; lines and type do the work.

## Colour
| Name | Value | Use |
|---|---|---|
| film | `#050607` | every background |
| bone | `#f1ece0` | text, the main button |
| dim | `#98948a` | secondary text, axes |
| line | `#2a2925` | hairlines |
| lamp | `#ffb02e` | the only interface accent: links to scenes, selection, projection/result highlight |

**Quantity colours** (inside scenes and as a dot beside a readout, never as interface colour), the same in every scene:
velocity `#4aa3ff` · acceleration `#ff8a3d` · force `#ff4d4d` · electric field `#ffd84a` · magnetic field `#4fd68a` · current/charge `#b48cff`. Defined once in `site/js/shell.js` (`COLORS`). Still to test with colour-blind simulation before more scenes depend on them. In the vectors scene A is blue and B orange only because there is no physical quantity yet.

## Type
Anek Bangla 700-800 (headlines, controls) · Hind Siliguri 400-600 (reading) · JetBrains Mono (symbols, units, readouts, English terms).

## Layout rules
- Phone: the scene is sticky at the top (48% of screen height), sliders and numbers scroll under it so the student sees the effect while dragging. Desktop (900px+): scene left, panel right.
- Left aligned. Hairline rows, not cards. 4px corners. No pills, glows or gradients except the fade that keeps text readable over the backdrop.
- One filled button per screen. Only the physics moves; interface changes are instant.
- Ads and promos: never on a scene screen. Reading pages only (Phase 3).
