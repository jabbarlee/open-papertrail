# Fonts

Every font here is under the **SIL Open Font License 1.1** (full text in `styles/<style>/fonts/OFL.txt`). You may use,
embed and redistribute them, including in videos you sell; you may not sell the font files on their own.

| Style | File | Font | Copyright |
|---|---|---|---|
| flat-grain | `Inter.ttf` | Inter (variable, 100-900) | Copyright 2016 The Inter Project Authors (github.com/rsms/inter) |
| ink-line | `InstrumentSerif-Regular.ttf` | Instrument Serif | Copyright 2022 The Instrument Serif Project Authors (github.com/Instrument/instrument-serif) |
| ink-line | `Kalam-Bold.ttf` | Kalam Bold | Copyright 2014 Indian Type Foundry (info@indiantypefoundry.com) |
| knife-paint | `InstrumentSerif-Regular.ttf`, `InstrumentSerif-Italic.ttf` | Instrument Serif | Copyright 2022 The Instrument Serif Project Authors |
| painted | `Gaegu-Regular.ttf` | Gaegu | Copyright 2018 The Gaegu Project Authors |
| painted | `PatrickHand-Regular.ttf` | Patrick Hand | Copyright 2012 Patrick Wagesreiter (mail@patrickwagesreiter.at) |
| painted | `CaveatBrush-Regular.ttf` | Caveat Brush | Copyright 2015 Google Inc. |

All were taken unmodified from [github.com/google/fonts](https://github.com/google/fonts) (`ofl/`).

A scene loads its fonts by URL from the repo root, e.g. `fonts: [{ family: 'Inter', url: '/styles/flat-grain/fonts/Inter.ttf', weight: '100 900' }]`.
To add one, drop the `.ttf` into the style's `fonts/` folder and add a row here.
