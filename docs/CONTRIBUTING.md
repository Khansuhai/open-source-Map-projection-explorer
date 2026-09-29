# Contributing to The 3D → 2D Dish

Welcome to the **3D → 2D Dish** kitchen! We welcome community contributions: adding new projection ingredients, refining cartographic recipes, and improving visualization fidelity.

---

## Adding a New Projection Ingredient

All projection definitions live in [`data/projections-catalog.json`](../data/projections-catalog.json).

When proposing a new projection, follow Snyder (1987), *Map Projections: A Working Manual* (USGS Professional Paper 1395) as the primary reference standard.

### Contribution Checklist

1. **Family Classification**: Must belong to one of the 5 developable-surface families:
   - `cylindrical`
   - `conic`
   - `azimuthal`
   - `pseudocylindrical`
   - `compromise`
2. **Preserved Property**:
   - `conformal` (local angles & shapes)
   - `equal-area` (size ratios)
   - `equidistant` (distance along specific lines/points)
   - `true-direction` (bearing from center)
   - `compromise` (aphylactic balance)
3. **Historical Attribution**:
   - `year`: Integer publication or presentation year.
   - `author`: Originating cartographer or mathematician.
4. **EPSG Code**:
   - Provide an official EPSG code if one universally applies (e.g. `EPSG:3857` for Web Mercator).
   - If the projection is typically parameterized per regional project (e.g. Albers Equal-Area Conic, Lambert Conformal Conic), leave `epsg` as `null` rather than specifying an arbitrary regional zone.
5. **Plain-Language Distortion Note**:
   - Clearly explain what is preserved and what suffers distortion (e.g. polar compression, shearing at outer edges).
6. **Best-For Use Cases**:
   - List 2 to 3 practical, real-world mapping scenarios where this projection excels.

### JSON Entry Template

```json
{
  "id": "my-projection-slug",
  "name": "Full Formal Projection Name",
  "property": "equal-area",
  "aspect": "normal",
  "year": 1921,
  "author": "Cartographer Name",
  "epsg": null,
  "bestFor": [
    "primary use case",
    "secondary use case"
  ],
  "distortionNote": "Plain-language explanation of what is preserved and how distortion behaves across latitudes/longitudes."
}
```

### Adding d3-geo Rendering Support

If the projection is supported in `d3-geo` or `d3-geo-projection`, register its factory in [`src/projections/projection-registry.ts`](../src/projections/projection-registry.ts):

```typescript
'my-projection-slug': () => d3GeoProjection.geoMyProjection().precision(0.1),
```

---

## Development Setup

```bash
# Install dependencies
npm install

# Run Vite development server
npm run dev

# Run TypeScript checks and production build
npm run build
```

---

## References

- Snyder, J. P. (1987). *Map Projections: A Working Manual*. USGS Professional Paper 1395. Washington, D.C.: U.S. Government Printing Office.
- Natural Earth public domain map datasets ([naturalearthdata.com](https://www.naturalearthdata.com/)).
