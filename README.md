# 🌍 The 3D → 2D Dish
### An open-source "kitchen" for understanding and choosing map projections

> **Phase 1 MVP**: Projection Shelf Browser & Interactive 2D Vector Previews.

---

## 📖 Overview

The **3D → 2D Dish** organizes map projections like a stocked kitchen:
- **Pantry (Shelf)**: Every major projection, tagged by developable surface family, preserved property, and aspect.
- **Plating (Detail View)**: Full-size 2D world map vector rendering using `d3-geo` and `d3-geo-projection` over Natural Earth 110m TopoJSON boundaries, accompanied by cartographic metadata (year, author, best-for recommendations, and plain-language distortion notes).

### Taxonomic Structure

Projections are classified across two primary axes per Snyder (1987):

1. **Developable Surface Families**:
   - **Cylindrical** (`mercator`, `transverse-mercator`, `utm`, `lambert-cylindrical-equal-area`, `plate-carree`, `miller-cylindrical`)
   - **Conic** (`lambert-conformal-conic`, `albers-equal-area-conic`, `equidistant-conic`, `polyconic`)
   - **Azimuthal (Planar)** (`azimuthal-equidistant`, `lambert-azimuthal-equal-area`, `stereographic`, `orthographic`, `gnomonic`, `general-perspective`)
   - **Pseudocylindrical** (`sinusoidal`, `mollweide`, `eckert-iv`, `robinson`, `goode-homolosine`)
   - **Compromise** (`winkel-tripel`, `van-der-grinten`, `natural-earth`)

2. **Preserved Properties**:
   - **Conformal**: Preserves local angles and shapes (e.g., Mercator, UTM, Lambert Conformal Conic, Stereographic).
   - **Equal-Area**: Preserves relative area and size proportions (e.g., Albers, Mollweide, Lambert Cylindrical Equal-Area).
   - **Equidistant**: Preserves true distance from a point or along standard parallels.
   - **True-Direction**: Preserves azimuths / compass bearing from a center point.
   - **Compromise (Aphylactic)**: Deliberately balances area and angular distortion for visual harmony.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/your-username/3d-to-2d-dish.git
cd 3d-to-2d-dish

# Install dependencies
npm install

# Start local development server with Vite
npm run dev

# Run automated catalog and rendering validation tests
npm test

# Build for static production deployment (e.g. GitHub Pages)
npm run build

# Preview production build locally
npm run preview
```

---

## 🗂️ Project Structure

```text
3d-to-2d-dish/
├── 3D-to-2D-Dish-Master-Plan.md   # Architectural blueprint and roadmap
├── data/
│   ├── projections-catalog.json   # 24 canonical map projections dataset
│   ├── recipe-rules.json          # Decision engine rules for Phase 2
│   └── world-110m.json            # Natural Earth 110m TopoJSON
├── docs/
│   └── CONTRIBUTING.md            # Guidelines for adding new projections
├── public/
│   └── world-110m.json            # Static public asset
├── src/
│   ├── main.ts                    # Application bootstrapping
│   ├── types.ts                   # TypeScript domain models
│   ├── d3-geo-projection.d.ts     # D3 projection type augmentations
│   ├── shelf/
│   │   ├── catalog-loader.ts      # Catalog filtering and querying
│   │   └── shelf-ui.ts            # Shelf UI, card grid, and detail modal
│   ├── projections/
│   │   ├── map-renderer.ts        # SVG vector map rendering engine
│   │   └── projection-registry.ts # D3 factory mappings
│   └── styles/
│       └── main.css               # Design system & dark mode aesthetics
├── tests/
│   └── validate-catalog.mjs       # Automated projection verification suite
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🗺️ Roadmap

- [x] **Phase 1: Shelf Browser & 2D Vector Preview** *(Current)*
  - Filterable card grid by family & property
  - Live SVG rendering for 24 projections with Natural Earth TopoJSON
  - Detail overlay with rich cartographic metadata & keyboard navigation
- [ ] **Phase 2: Recipe Engine**
  - Wizard recommending projections based on mapping goal, region, and purpose
- [ ] **Phase 3: 3D Globe Unwrap Animation**
  - Three.js globe that unwraps into flat 2D projections
- [ ] **Phase 4: Compare Mode & Tissot's Indicatrix**
  - Side-by-side projection distortion visualizer
- [ ] **Phase 5: GitHub Pages Automation & Polish**

---

## 📜 References & License

- Snyder, J. P. (1987). *Map Projections: A Working Manual*. USGS Professional Paper 1395.
- TopoJSON vector boundaries derived from [Natural Earth](https://www.naturalearthdata.com/) (Public Domain).
- Open-source under the MIT License.
