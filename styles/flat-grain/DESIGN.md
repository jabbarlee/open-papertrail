# Design: Flat Grain

Bold flat shapes, hard-edged light, big black masses and a fine film grain on every colour. Add what new drawings
teach you to this file.

## The rules that make it this style
- **Shape first.** Each subject reads as one bold silhouette. If it doesn't read filled solid black, redraw it.
- **Push the proportions.** Long neck, huge goggles, small ear, a shoulder line that runs off the frame. Nothing is
  drawn at natural size.
- **Few flat colours.** About ten inks in the whole picture, no gradients.
- **Light is a shape.** Shadows are hard flat steps with a clean edge (the neck has three), never soft shading. The
  one exception is a small shadow that breaks into grain, as under the goggles.
- **Black is a mass.** Hair, beard and lenses are big solid blacks with no inner detail. They carry the composition.
- **Colour is not literal.** Skin is crimson. Pick colour for the picture, not for realism.
- **Faces are built from planes.** The nose is three flat facets. Eyes can be hidden entirely.
- **Grain on colour only.** Black and paper stay clean.
- **Line is a pen, not a stroke.** Width swells and tapers, thin around forms, heavier at collars and joints.
- **Empty paper.** A plain warm white with a low viewpoint looking up; the figure does all the work.

## At night (`street.ts`, 2026-11-04)
- The paper becomes a deep grainy blue (`#17294F`). Keep the palette inks for everything else.
- Light stays a flat shape: gold windows and one hard, faint lamp cone.
- Characters need a bright silhouette against dark walls: white hair, gold car, gold scarf.
- Keep the long neck and its three light steps as the family resemblance.
- Don't put a flat shadow across a wall of windows: the dark windows vanish and the lit ones float.

## Reference palette
| Ink | Hex | Grain sd |
|---|---|---|
| Paper | `#FBFAF8` | 0 |
| Black | `#0A070B` | 0 |
| Skin | `#BF3D52` | 8 |
| Skin, lit | `#C34D63` | 8.5 |
| Skin, shadow | `#78232D` | 5 |
| Skin, deep shadow | `#280F13` | 2 |
| Nose shadow | `#78191E` | 4 |
| Gold | `#EDA93D` | 4 |
| Gold, shadow | `#BC722A` | 9 |
| Gold, underside | `#8A5E29` | 6 |
| Green | `#1E4823` | 5 |

## Technique
`components/ink.ts`: point lists, per-ink grain tiles, `pen` lines, `stipple` shadows. `components/people.ts`: the bust
and the taxi. `components/street.ts`: the night street.
