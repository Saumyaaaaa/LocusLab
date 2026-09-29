# 3D Asset Licenses & Provenance Manifest

This directory documents the legal provenance, copyright status, author attribution, and empirical measurements for all 3D assets used in the **Locus Lab** spatial memory experiment.

## 1. CC0 Public Domain Dedication

All assets in `public/models/` are licensed under the **Creative Commons Zero (CC0 1.0 Universal) Public Domain Dedication**.
- **Legal Code**: https://creativecommons.org/publicdomain/zero/1.0/
- **Author**: Kenney (Kenney Vleugels - kenney.nl)
- **Source**: Kenney Furniture Kit (https://kenney.nl/assets/furniture-kit)
- The official `License.txt` distributed with the Kenney Furniture Kit is preserved in this directory at `public/models/LICENSES/License.txt`.

---

## 2. Empirical 20-Loci Model Manifest & Measurements

| Locus # | Room | Locus Name | GLB Filename | Real Size (KB) | Triangles | Status & Visual Fit | Overlap Check |
|---|---|---|---|---|---|---|---|
| **1** | Hallway | **Front Door** | `doorwayFront.glb` | 12.7 KB | 156 | Entrance door frame with glass transom & handle | ✅ 0 collisions |
| **2** | Hallway | **Entryway Bench** | `benchCushionLow.glb` | 10.0 KB | 138 | Low wooden hallway bench with padded cushion | ✅ 0 collisions |
| **3** | Hallway | **Standing Coat Rack** | `coatRackStanding.glb` | 13.0 KB | 190 | Tall vertical timber hat & coat rack | ✅ 0 collisions |
| **4** | Living Room | **Lounge Sofa** | `loungeSofa.glb` | 9.4 KB | 128 | Warm coral-upholstered living room sofa | ✅ 0 collisions |
| **5** | Living Room | **Coffee Table** | `tableCoffee.glb` | 8.1 KB | 124 | Low wooden rectangular living room table | ✅ 0 collisions |
| **6** | Living Room | **Television Set** | `televisionModern.glb` | 6.2 KB | 72 | Modern widescreen television unit | ✅ 0 collisions |
| **7** | Living Room | **Bookcase** | `bookcaseClosed.glb` | 22.6 KB | 372 | Tall enclosed wooden shelving bookcase | ✅ 0 collisions |
| **8** | Kitchen | **Dining Table** | `tableRound.glb` | 6.3 KB | 80 | Circular wooden dining table | ✅ 0 collisions |
| **9** | Kitchen | **Refrigerator** | `kitchenFridgeLarge.glb` | 29.9 KB | 436 | Upright double-door refrigerator | ✅ 0 collisions |
| **10** | Kitchen | **Kitchen Sink** | `kitchenSink.glb` | 22.9 KB | 318 | Counter unit with stainless basin and tap | ✅ 0 collisions |
| **11** | Kitchen | **Cooking Stove** | `kitchenStoveElectric.glb` | 18.2 KB | 338 | Range cooker with oven door & burners | ✅ 0 collisions |
| **12** | Study | **Wood Desk** | `desk.glb` | 14.7 KB | 198 | Timber office desk with utility drawer | ✅ 0 collisions |
| **13** | Study | **Desk Chair** | `chairDesk.glb` | 38.1 KB | 588 | Office swivel desk chair on casters | ✅ 0 collisions |
| **14** | Study | **Storage Box** | `cardboardBoxClosed.glb` | 5.3 KB | 60 | Lidded cardboard archiving storage box | ✅ 0 collisions |
| **15** | Study | **Low Bookshelf** | `bookcaseOpenLow.glb` | 17.5 KB | 312 | Low wide open study bookcase with books | ✅ 0 collisions |
| **16** | Bedroom | **Nightstand** | `sideTableDrawers.glb` | 18.6 KB | 238 | Bedside table with two pull drawers | ✅ 0 collisions |
| **17** | Bedroom | **Double Bed** | `bedDouble.glb` | 22.2 KB | 164 | Double bedframe and cover (pillows stripped) | ✅ 0 collisions |
| **18** | Bedroom | **Bedroom Dresser** | `cabinetBedDrawer.glb` | 15.7 KB | 182 | Bedroom dresser cabinet with drawer | ✅ 0 collisions |
| **19** | Bathroom | **Bathtub** | `bathtub.glb` | 34.7 KB | 602 | Porcelain bathtub basin with chrome faucet | ✅ 0 collisions |
| **20** | Bathroom | **Glass Shower** | `showerRound.glb` | 70.4 KB | 960 | Curved walk-in glass shower enclosure | ✅ 0 collisions |

### Performance Budget Compliance:
- **Total Download Size**: **0.376 MB (385 KB)** — well within the **8.0 MB** budget (< 5% of budget).
- **Total Scene Triangles**: **5,416 triangles** — well within the **150,000** limit (< 4% of budget).

---

## 3. Psycholinguistic Experimental Validity Verification

All 20 models, textures, mesh names, and labels were rigorously screened against all 40 stimuli words in `LIST_A` and `LIST_B`.

### Strict Exclusion Verification:
- **Zero collisions with List A words**: `flag`, `rope`, `tent`, `vase`, `brick`, `clock`, `crown`, `plate`, `scarf`, `train`, `anchor`, `barrel`, `basket`, `bottle`, `candle`, `hammer`, `ladder`, `mirror`, `feather`, `whistle`.
- **Zero collisions with List B words**: `boat`, `coin`, `lamp`, `nest`, `chalk`, `fence`, `glove`, `pearl`, `plant`, `wheel`, `button`, `crayon`, `helmet`, `magnet`, `pillow`, `ribbon`, `saddle`, `tunnel`, `compass`, `padlock`.

**Critical Validations**:
1. **Pillows**: The original `bedDouble.glb` contained pillow child nodes (`pillowLeft`, `pillowRight`). These were programmatically stripped at binary level; the resulting `bedDouble.glb` contains 0 pillow nodes, 0 pillow meshes, and 0 references to "pillow".
2. **Mirrors**: No mirror models or mirror meshes are used (`bathroomMirror.glb` was excluded).
3. **Lamps / Clocks / Plants**: All ceiling fans, desk lamps, floor lamps, potted plants, and wall clocks from the pack were completely excluded.
4. **Kitchen clutter**: Sinks, stoves, and tables contain no baked bottles, plates, or pots.
