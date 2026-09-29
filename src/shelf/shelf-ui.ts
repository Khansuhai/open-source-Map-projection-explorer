/**
 * The "shelf" — a filterable card grid showing all projections,
 * grouped by family and filterable by preserved property.
 */
import type { FamilyId, PropertyId, ProjectionEntry } from '../types';
import {
  allProjections,
  families,
  propertyClasses,
  filterProjections,
} from './catalog-loader';
import { renderMap } from '../projections/map-renderer';
import { getProjectionFactory } from '../projections/projection-registry';

// ── State ────────────────────────────────────────────────────
let currentFamily: FamilyId | 'all' = 'all';
let currentProperty: PropertyId | 'all' = 'all';
let currentSearch = '';
let selectedProjection: ProjectionEntry | null = null;

// ── Family display config ────────────────────────────────────
const familyIcons: Record<string, string> = {
  cylindrical: '🗞️',
  conic: '📐',
  azimuthal: '🎯',
  pseudocylindrical: '🌊',
  compromise: '⚖️',
};

const familyColors: Record<string, string> = {
  cylindrical: 'var(--color-cylindrical)',
  conic: 'var(--color-conic)',
  azimuthal: 'var(--color-azimuthal)',
  pseudocylindrical: 'var(--color-pseudo)',
  compromise: 'var(--color-compromise)',
};

const propertyIcons: Record<string, string> = {
  conformal: '📐',
  'equal-area': '📊',
  equidistant: '📏',
  'true-direction': '🧭',
  compromise: '⚖️',
};

// ── Public API ───────────────────────────────────────────────

export function initShelf(appEl: HTMLElement): void {
  appEl.innerHTML = buildShellHTML();
  bindFilterEvents();
  renderCards();
}

// ── HTML builders ────────────────────────────────────────────

function buildShellHTML(): string {
  return `
    <header class="site-header">
      <div class="header-content">
        <div class="logo-group">
          <span class="logo-icon">🌍</span>
          <div class="logo-text">
            <h1>The 3D → 2D Dish</h1>
            <p class="tagline">An open-source map projection explorer</p>
          </div>
        </div>
        <div class="header-stats">
          <span class="stat-badge" id="projection-count">${allProjections.length} projections</span>
          <span class="stat-badge">${families.length} families</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <aside class="filter-panel" id="filter-panel">
        <div class="filter-section">
          <h3 class="filter-title">
            <span class="filter-icon">🔍</span>
            Search
          </h3>
          <input
            type="text"
            id="search-input"
            class="search-input"
            placeholder="Search projections…"
            autocomplete="off"
          />
        </div>

        <div class="filter-section">
          <h3 class="filter-title">
            <span class="filter-icon">📂</span>
            Surface Family
          </h3>
          <div class="filter-chips" id="family-filters">
            <button class="chip chip--active" data-family="all">All</button>
            ${families
              .map(
                (f) =>
                  `<button class="chip" data-family="${f.id}" style="--chip-color: ${familyColors[f.id] ?? 'var(--color-accent)'}">
                    <span class="chip-icon">${familyIcons[f.id] ?? '📁'}</span>
                    ${f.name}
                  </button>`
              )
              .join('')}
          </div>
        </div>

        <div class="filter-section">
          <h3 class="filter-title">
            <span class="filter-icon">🎯</span>
            Preserved Property
          </h3>
          <div class="filter-chips" id="property-filters">
            <button class="chip chip--active" data-property="all">All</button>
            ${propertyClasses
              .map(
                (p) =>
                  `<button class="chip" data-property="${p.id}">
                    <span class="chip-icon">${propertyIcons[p.id] ?? '📌'}</span>
                    ${p.name}
                  </button>`
              )
              .join('')}
          </div>
        </div>
      </aside>

      <section class="card-area">
        <div class="card-area-header">
          <h2 id="results-heading">All Projections</h2>
          <span class="result-count" id="result-count">${allProjections.length} results</span>
        </div>
        <div class="card-grid" id="card-grid"></div>
      </section>
    </main>

    <!-- Detail overlay -->
    <div class="detail-overlay" id="detail-overlay">
      <div class="detail-panel" id="detail-panel"></div>
    </div>
  `;
}

function buildCardHTML(proj: ProjectionEntry): string {
  return `
    <article class="projection-card" data-id="${proj.id}" tabindex="0"
             style="--card-accent: ${familyColors[proj.familyId] ?? 'var(--color-accent)'}">
      <div class="card-header">
        <span class="card-family-icon">${familyIcons[proj.familyId] ?? '📁'}</span>
        <span class="card-family-label" style="color: ${familyColors[proj.familyId] ?? 'var(--color-accent)'}">${proj.familyName}</span>
      </div>
      <div class="card-map-preview" id="preview-${proj.id}">
        <div class="card-map-placeholder">
          <span class="map-loading-icon">🗺️</span>
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${proj.name}</h3>
        <div class="card-tags">
          <span class="tag tag--property">${propertyIcons[proj.property] ?? ''} ${capitalize(proj.property)}</span>
          ${proj.year ? `<span class="tag tag--year">${proj.year}</span>` : ''}
        </div>
        <p class="card-best-for">${proj.bestFor[0]}</p>
      </div>
      <div class="card-footer">
        <button class="card-action-btn">
          Explore →
        </button>
      </div>
    </article>
  `;
}

function buildDetailHTML(proj: ProjectionEntry): string {
  const currentIndex = allProjections.findIndex((p) => p.id === proj.id);
  const prevProj = allProjections[(currentIndex - 1 + allProjections.length) % allProjections.length];
  const nextProj = allProjections[(currentIndex + 1) % allProjections.length];

  return `
    <div class="detail-top-bar">
      <div class="detail-nav-group">
        <button class="detail-nav-btn" id="detail-prev" data-id="${prevProj.id}" title="Previous projection (← key)">
          ← <span class="nav-btn-label">${prevProj.name}</span>
        </button>
        <span class="detail-nav-counter">${currentIndex + 1} / ${allProjections.length}</span>
        <button class="detail-nav-btn" id="detail-next" data-id="${nextProj.id}" title="Next projection (→ key)">
          <span class="nav-btn-label">${nextProj.name}</span> →
        </button>
      </div>
      <button class="detail-close" id="detail-close" aria-label="Close detail view" title="Close (Esc)">✕</button>
    </div>

    <div class="detail-header">
      <div class="detail-title-row">
        <span class="detail-icon">${familyIcons[proj.familyId] ?? '📁'}</span>
        <div>
          <h2 class="detail-title">${proj.name}</h2>
          <p class="detail-subtitle">${proj.familyName} · ${capitalize(proj.property)}</p>
        </div>
      </div>
    </div>

    <div class="detail-map-container" id="detail-map">
      <div class="detail-map-loading">
        <span class="map-loading-icon">🗺️</span>
        <span>Rendering ${proj.name}...</span>
      </div>
    </div>

    <div class="detail-metadata">
      <div class="meta-grid">
        ${proj.year ? buildMetaItem('Year', `${proj.year}`) : ''}
        ${proj.author ? buildMetaItem('Author', proj.author) : ''}
        ${buildMetaItem('Family', proj.familyName)}
        ${buildMetaItem('Property', capitalize(proj.property))}
        ${buildMetaItem('Aspect', proj.aspect)}
        ${proj.epsg ? buildMetaItem('EPSG', proj.epsg) : ''}
      </div>

      <div class="meta-section">
        <h4 class="meta-heading">Best For</h4>
        <ul class="best-for-list">
          ${proj.bestFor.map((b) => `<li>${b}</li>`).join('')}
        </ul>
      </div>

      <div class="meta-section">
        <h4 class="meta-heading">Distortion Note</h4>
        <p class="distortion-note">${proj.distortionNote}</p>
      </div>
    </div>
  `;
}

function buildMetaItem(label: string, value: string): string {
  return `
    <div class="meta-item">
      <span class="meta-label">${label}</span>
      <span class="meta-value">${value}</span>
    </div>
  `;
}

// ── Event binding ────────────────────────────────────────────

function bindFilterEvents(): void {
  // Family filters
  const familyContainer = document.getElementById('family-filters')!;
  familyContainer.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (!btn) return;
    const family = btn.dataset.family as FamilyId | 'all';
    currentFamily = family;
    updateChipStates(familyContainer, 'family', family);
    renderCards();
  });

  // Property filters
  const propertyContainer = document.getElementById('property-filters')!;
  propertyContainer.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (!btn) return;
    const prop = btn.dataset.property as PropertyId | 'all';
    currentProperty = prop;
    updateChipStates(propertyContainer, 'property', prop);
    renderCards();
  });

  // Search
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  let searchTimeout: ReturnType<typeof setTimeout>;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = searchInput.value.trim();
      renderCards();
    }, 200);
  });

  // Overlay close on background click
  const overlay = document.getElementById('detail-overlay')!;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDetail();
  });

  // Keyboard navigation & close
  document.addEventListener('keydown', (e) => {
    if (!selectedProjection) return;
    if (e.key === 'Escape') {
      closeDetail();
    } else if (e.key === 'ArrowLeft') {
      const idx = allProjections.findIndex((p) => p.id === selectedProjection!.id);
      const prev = allProjections[(idx - 1 + allProjections.length) % allProjections.length];
      openDetail(prev.id);
    } else if (e.key === 'ArrowRight') {
      const idx = allProjections.findIndex((p) => p.id === selectedProjection!.id);
      const next = allProjections[(idx + 1) % allProjections.length];
      openDetail(next.id);
    }
  });
}

function updateChipStates(container: HTMLElement, dataAttr: string, activeValue: string): void {
  const chips = container.querySelectorAll<HTMLButtonElement>('.chip');
  chips.forEach((c) => {
    const val = c.dataset[dataAttr];
    c.classList.toggle('chip--active', val === activeValue);
  });
}

// ── Rendering ────────────────────────────────────────────────

function renderCards(): void {
  const grid = document.getElementById('card-grid')!;
  const filtered = filterProjections(currentFamily, currentProperty, currentSearch);

  // Update heading
  const heading = document.getElementById('results-heading')!;
  const countEl = document.getElementById('result-count')!;
  countEl.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;

  if (currentFamily === 'all' && currentProperty === 'all' && !currentSearch) {
    heading.textContent = 'All Projections';
  } else {
    const parts: string[] = [];
    if (currentFamily !== 'all') {
      const fam = families.find((f) => f.id === currentFamily);
      parts.push(fam?.name ?? currentFamily);
    }
    if (currentProperty !== 'all') {
      parts.push(capitalize(currentProperty));
    }
    heading.textContent = parts.join(' · ') || 'Filtered Projections';
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔭</span>
        <h3>No projections match your filters</h3>
        <p>Try broadening your search or clearing filters</p>
      </div>
    `;
    return;
  }

  // Group by family if showing all families
  if (currentFamily === 'all') {
    const grouped = groupByFamily(filtered);
    grid.innerHTML = families
      .filter((f) => grouped[f.id as FamilyId]?.length)
      .map(
        (f) => `
        <div class="family-group">
          <div class="family-group-header" style="--group-color: ${familyColors[f.id] ?? 'var(--color-accent)'}">
            <span class="group-icon">${familyIcons[f.id] ?? '📁'}</span>
            <h3 class="group-title">${f.name}</h3>
            <span class="group-count">${grouped[f.id as FamilyId]!.length}</span>
          </div>
          <div class="family-group-cards">
            ${grouped[f.id as FamilyId]!.map(buildCardHTML).join('')}
          </div>
        </div>
      `
      )
      .join('');
  } else {
    grid.innerHTML = `
      <div class="family-group-cards">
        ${filtered.map(buildCardHTML).join('')}
      </div>
    `;
  }

  // Bind card click events
  grid.querySelectorAll<HTMLElement>('.projection-card').forEach((card) => {
    card.addEventListener('click', () => openDetail(card.dataset.id!));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetail(card.dataset.id!);
      }
    });
  });

  // Lazy-render mini map previews (stagger for performance)
  const cards = grid.querySelectorAll<HTMLElement>('.projection-card');
  cards.forEach((card, i) => {
    setTimeout(() => renderCardPreview(card.dataset.id!), i * 50);
  });
}

async function renderCardPreview(projId: string): Promise<void> {
  const container = document.getElementById(`preview-${projId}`);
  if (!container) return;

  const factory = getProjectionFactory(projId);
  if (!factory) {
    container.innerHTML = `<div class="card-map-placeholder"><span class="map-na">N/A</span></div>`;
    return;
  }

  try {
    const projection = factory();
    await renderMap({
      width: 320,
      height: 180,
      projection,
      container,
    });
  } catch {
    container.innerHTML = `<div class="card-map-placeholder"><span class="map-na">⚠️</span></div>`;
  }
}

async function openDetail(projId: string): Promise<void> {
  const proj = allProjections.find((p) => p.id === projId);
  if (!proj) return;

  selectedProjection = proj;
  const overlay = document.getElementById('detail-overlay')!;
  const panel = document.getElementById('detail-panel')!;

  panel.innerHTML = buildDetailHTML(proj);
  overlay.classList.add('active');
  document.body.classList.add('no-scroll');

  // Bind close
  document.getElementById('detail-close')!.addEventListener('click', closeDetail);

  // Bind prev/next navigation
  const prevBtn = document.getElementById('detail-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const prevId = prevBtn.getAttribute('data-id');
      if (prevId) openDetail(prevId);
    });
  }

  const nextBtn = document.getElementById('detail-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const nextId = nextBtn.getAttribute('data-id');
      if (nextId) openDetail(nextId);
    });
  }

  // Render the full-size map
  const mapContainer = document.getElementById('detail-map')!;
  const factory = getProjectionFactory(projId);
  if (factory) {
    try {
      const projection = factory();
      await renderMap({
        width: 900,
        height: 500,
        projection,
        container: mapContainer,
      });
    } catch {
      mapContainer.innerHTML = `<div class="map-error">Could not render this projection</div>`;
    }
  } else {
    mapContainer.innerHTML = `<div class="map-error">No d3 projection available for this entry</div>`;
  }
}

function closeDetail(): void {
  selectedProjection = null;
  const overlay = document.getElementById('detail-overlay')!;
  overlay.classList.remove('active');
  document.body.classList.remove('no-scroll');
}

// ── Helpers ──────────────────────────────────────────────────

function groupByFamily(projections: ProjectionEntry[]): Partial<Record<FamilyId, ProjectionEntry[]>> {
  const result: Partial<Record<FamilyId, ProjectionEntry[]>> = {};
  for (const p of projections) {
    if (!result[p.familyId]) result[p.familyId] = [];
    result[p.familyId]!.push(p);
  }
  return result;
}

function capitalize(s: string): string {
  return s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}
