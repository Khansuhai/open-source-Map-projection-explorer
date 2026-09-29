/**
 * Mix Station UI for Phase 2
 * Interactive screen where users mix cartographic variables and taste the result.
 */
import type { MixSelection, PropertyId, ProjectionEntry } from '../types';
import { recipeRules, evaluateMix } from './mix-engine';
import { openDetail } from '../shelf/shelf-ui';

let currentSelection: MixSelection = {
  properties: ['equal-area'],
  family: 'any',
  aspect: 'any',
  scope: 'world',
  location: 'mid-latitude',
  purpose: 'thematic',
};

const familyColors: Record<string, string> = {
  cylindrical: 'var(--color-cylindrical)',
  conic: 'var(--color-conic)',
  azimuthal: 'var(--color-azimuthal)',
  pseudocylindrical: 'var(--color-pseudo)',
  compromise: 'var(--color-compromise)',
};

export function renderMixStation(container: HTMLElement): void {
  container.innerHTML = `
    <div class="mix-station">
      <div class="mix-station-header">
        <h2>🧑‍🍳 The Mix Station</h2>
        <p class="mix-subtitle">
          Tune your ingredients to taste your projection recipe before plating.
          Watch for kitchen rules and cartographic trade-offs.
        </p>
      </div>

      <div class="mix-layout">
        <!-- Controls Column -->
        <div class="mix-controls-card">
          <h3 class="mix-section-title">
            <span>🧂</span> Select Your Ingredients
          </h3>

          <!-- Preserved Property (Multi-select) -->
          <div class="mix-form-group">
            <label class="mix-label">
              ${recipeRules.variables.property.label}
              <span class="mix-badge-tag">Multi-select</span>
            </label>
            <p class="mix-hint">${recipeRules.variables.property.description}</p>
            <div class="mix-chips-grid" id="prop-chips">
              ${recipeRules.variables.property.options
                .map(
                  (opt) => `
                <button type="button" class="mix-chip ${currentSelection.properties.includes(opt.id as PropertyId) ? 'mix-chip--active' : ''}"
                        data-prop="${opt.id}">
                  ${opt.label}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Surface Family (Optional) -->
          <div class="mix-form-group">
            <label class="mix-label">
              ${recipeRules.variables.family.label}
              <span class="mix-badge-optional">Optional</span>
            </label>
            <select class="mix-select" id="family-select">
              ${recipeRules.variables.family.options
                .map(
                  (opt) => `
                <option value="${opt.id}" ${currentSelection.family === opt.id ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `
                )
                .join('')}
            </select>
          </div>

          <!-- Aspect (Optional) -->
          <div class="mix-form-group">
            <label class="mix-label">
              ${recipeRules.variables.aspect.label}
              <span class="mix-badge-optional">Optional</span>
            </label>
            <select class="mix-select" id="aspect-select">
              ${recipeRules.variables.aspect.options
                .map(
                  (opt) => `
                <option value="${opt.id}" ${currentSelection.aspect === opt.id ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `
                )
                .join('')}
            </select>
          </div>

          <!-- Region Scope -->
          <div class="mix-form-group">
            <label class="mix-label">${recipeRules.variables.scope.label}</label>
            <div class="mix-btn-row" id="scope-btns">
              ${recipeRules.variables.scope.options
                .map(
                  (opt) => `
                <button type="button" class="mix-pill ${currentSelection.scope === opt.id ? 'mix-pill--active' : ''}"
                        data-scope="${opt.id}">
                  ${opt.label}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Location -->
          <div class="mix-form-group">
            <label class="mix-label">${recipeRules.variables.location.label}</label>
            <div class="mix-btn-row" id="location-btns">
              ${recipeRules.variables.location.options
                .map(
                  (opt) => `
                <button type="button" class="mix-pill ${currentSelection.location === opt.id ? 'mix-pill--active' : ''}"
                        data-location="${opt.id}">
                  ${opt.label}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Purpose -->
          <div class="mix-form-group">
            <label class="mix-label">${recipeRules.variables.purpose.label}</label>
            <select class="mix-select" id="purpose-select">
              ${recipeRules.variables.purpose.options
                .map(
                  (opt) => `
                <option value="${opt.id}" ${currentSelection.purpose === opt.id ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `
                )
                .join('')}
            </select>
          </div>
        </div>

        <!-- Verdict Column -->
        <div class="mix-verdict-column">
          <div class="mix-verdict-card" id="verdict-box">
            <!-- Dynamic verdict inserted here -->
          </div>
        </div>
      </div>
    </div>
  `;

  bindMixEvents(container);
  updateVerdict();
}

function bindMixEvents(container: HTMLElement): void {
  // Property multi-select
  const propChips = container.querySelectorAll<HTMLButtonElement>('#prop-chips .mix-chip');
  propChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      const prop = btn.dataset.prop as PropertyId;
      if (currentSelection.properties.includes(prop)) {
        // Keep at least one or allow unselecting
        if (currentSelection.properties.length > 1) {
          currentSelection.properties = currentSelection.properties.filter((p) => p !== prop);
          btn.classList.remove('mix-chip--active');
        }
      } else {
        currentSelection.properties.push(prop);
        btn.classList.add('mix-chip--active');
      }
      updateVerdict();
    });
  });

  // Family select
  const familySelect = container.querySelector<HTMLSelectElement>('#family-select');
  familySelect?.addEventListener('change', () => {
    currentSelection.family = familySelect.value;
    updateVerdict();
  });

  // Aspect select
  const aspectSelect = container.querySelector<HTMLSelectElement>('#aspect-select');
  aspectSelect?.addEventListener('change', () => {
    currentSelection.aspect = aspectSelect.value;
    updateVerdict();
  });

  // Scope pills
  const scopeBtns = container.querySelectorAll<HTMLButtonElement>('#scope-btns .mix-pill');
  scopeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      scopeBtns.forEach((b) => b.classList.remove('mix-pill--active'));
      btn.classList.add('mix-pill--active');
      currentSelection.scope = btn.dataset.scope!;
      updateVerdict();
    });
  });

  // Location pills
  const locationBtns = container.querySelectorAll<HTMLButtonElement>('#location-btns .mix-pill');
  locationBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      locationBtns.forEach((b) => b.classList.remove('mix-pill--active'));
      btn.classList.add('mix-pill--active');
      currentSelection.location = btn.dataset.location!;
      updateVerdict();
    });
  });

  // Purpose select
  const purposeSelect = container.querySelector<HTMLSelectElement>('#purpose-select');
  purposeSelect?.addEventListener('change', () => {
    currentSelection.purpose = purposeSelect.value;
    updateVerdict();
  });
}

function updateVerdict(): void {
  const box = document.getElementById('verdict-box');
  if (!box) return;

  const result = evaluateMix(currentSelection);
  const { verdict, explanation, suggestedProjections } = result;

  box.innerHTML = `
    <div class="verdict-banner ${verdict.badgeClass}">
      <span class="verdict-icon">${verdict.icon}</span>
      <div class="verdict-header-text">
        <span class="verdict-label-sub">Tasting Verdict</span>
        <h3 class="verdict-title">${verdict.name}</h3>
      </div>
    </div>

    <div class="verdict-body">
      <div class="verdict-explanation">
        <h4 class="verdict-section-heading">Chef's Cartographic Assessment</h4>
        <p class="verdict-text">${explanation}</p>
      </div>

      ${
        suggestedProjections.length > 0
          ? `
        <div class="verdict-suggestions">
          <h4 class="verdict-section-heading">
            <span>💡</span> Recommended Ingredients — Try These Instead
          </h4>
          <div class="verdict-suggest-grid">
            ${suggestedProjections.map(buildSuggestedCardHTML).join('')}
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;

  // Attach card click handlers for suggestions to open Phase 1 detail modal!
  box.querySelectorAll<HTMLElement>('.suggest-card').forEach((card) => {
    card.addEventListener('click', () => {
      const projId = card.dataset.id;
      if (projId) openDetail(projId);
    });
  });
}

function buildSuggestedCardHTML(proj: ProjectionEntry): string {
  const accent = familyColors[proj.familyId] ?? 'var(--color-accent)';
  return `
    <div class="suggest-card" data-id="${proj.id}" style="--suggest-accent: ${accent}">
      <div class="suggest-card-top">
        <span class="suggest-badge" style="color: ${accent}">${proj.familyName}</span>
        <span class="suggest-property">${proj.property}</span>
      </div>
      <h5 class="suggest-card-title">${proj.name}</h5>
      <p class="suggest-best-for">${proj.bestFor[0] ?? ''}</p>
      <div class="suggest-footer">
        <span class="suggest-link">View Plate Preview →</span>
      </div>
    </div>
  `;
}
