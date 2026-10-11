# Marvel vs. DC

A mid-2000s-arcade-style 2-on-2 tag fighting game that runs in the browser. Pick two heroes, pick the two you want to fight, and battle it out.

**20 heroes**: 10 Marvel (Spider-Man, Wolverine, Hulk, Ghost Rider, Scarlet Witch, Venom, Doctor Strange, Rocket & Groot, Vision, Storm) and 10 DC (Batman, Superman, Wonder Woman, The Flash, Green Lantern, Clayface, Swamp Thing, Raven, Mr. Terrific, Poison Ivy).

Every hero has 12 normals, a throw, 4 unique specials, 1–2 hypers, an assist, plus intro/taunt/win animations and quotes. Characters are skeletal rigs with anatomical, muscle-shaped limbs and 3/4-view torsos, painted per hero and cel-shaded from a single light source, then run through a pixel pass (alpha threshold and a colored 1px outline) so they read as hand-made sprites. Every pose is interpolated at 60fps.

## Features
- Arcade (vs CPU, Easy/Normal/Hard), 2-player Versus, and Training modes
- Tags, assists, launchers, air combos, hyper meter (3 levels), crossover hypers
- Hyper cut-ins using the hero portraits, hit-stop, screen shake, afterimages
- 6 parallax stages, synthesized SFX and music, speech-synthesis announcer
- Keyboard, PS5 DualSense / PS4 / Xbox controllers (with rumble), and mobile touch controls (floating stick, slide-between buttons, landscape fullscreen)

## Controls (Player 1)
| Action | Key |
| --- | --- |
| Move | W A S D |
| Light / Heavy Punch | U / I |
| Light / Heavy Kick | J / K |
| Special | O (combine with back / up / down) |
| Hyper | L (back + L for the second hyper) |
| Assist / Tag / Taunt | Y / H / T |

**PS5 controller:** Square/Triangle = light/heavy punch, Cross/Circle = light/heavy kick, R1 special, R2 hyper, L1 assist, L2 tag, Create taunt, Options pause. Menus: Cross select, Circle back. First controller is Player 1, second is Player 2.

**Phone/tablet:** play in landscape; drag on the left half for the joystick, buttons on the right.

Player 2 uses the arrow keys with `, . M N / ;` (or the numpad). Motion inputs (quarter-circles, dragon punch) also work.

## Run locally
```
python3 tools/serve.py 5173
```
Then open http://localhost:5173. Add `?fight=spiderman,wolverine:batman,superman&stage=gotham` to jump straight into a match.

Fan project. Marvel and DC characters belong to their respective owners.
