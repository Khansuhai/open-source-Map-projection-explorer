/**
 * Bridge Course UI — Phase 4
 * An interactive, in-depth educational guide to map projection classification.
 * Renders interactive trees, taxonomy cards, comparison tables, flowcharts,
 * glossary, and a "how to use this portal" walkthrough.
 */
import bridgeCourseData from '../../data/bridge-course.json';

interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  highlight?: boolean;
  children?: TreeNode[];
  leaves?: string[];
}

interface Chapter {
  id: string;
  title: string;
  icon: string;
  color: string;
  sections: any[];
}

const data = bridgeCourseData as { meta: any; chapters: Chapter[] };

// ── State ────────────────────────────────────────────────────
let activeChapter = 0;
let expandedTreeNodes = new Set<string>();
let activeFlowchartStep = 'q1';
let glossaryFilter = '';

// ── Public API ───────────────────────────────────────────────

export function renderBridgeCourse(container: HTMLElement): void {
  container.innerHTML = buildBridgeCourseHTML();
  bindBridgeCourseEvents(container);
}

// ── Main HTML Builder ────────────────────────────────────────

function buildBridgeCourseHTML(): string {
  const chapters = data.chapters;

  return `
    <div class="bridge-course">
      <div class="bridge-header">
        <div class="bridge-header-content">
          <div class="bridge-title-area">
            <h2>🎓 The Bridge Course</h2>
            <p class="bridge-subtitle">${data.meta.subtitle}</p>
          </div>
          <div class="bridge-progress">
            <span class="bridge-progress-label">Chapter ${activeChapter + 1} of ${chapters.length}</span>
            <div class="bridge-progress-bar">
              <div class="bridge-progress-fill" style="width: ${((activeChapter + 1) / chapters.length) * 100}%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bridge-layout">
        <!-- Chapter Nav Sidebar -->
        <nav class="bridge-nav" id="bridge-nav">
          ${chapters
            .map(
              (ch, i) => `
            <button type="button" class="bridge-nav-item ${i === activeChapter ? 'bridge-nav-item--active' : ''}"
                    data-chapter="${i}" style="--ch-color: ${ch.color}">
              <span class="bridge-nav-icon">${ch.icon}</span>
              <span class="bridge-nav-label">${ch.title}</span>
              <span class="bridge-nav-arrow">›</span>
            </button>
          `
            )
            .join('')}

          <div class="bridge-nav-refs">
            <h4>📖 References</h4>
            <ul>
              ${data.meta.references
                .map((r: any) => `<li class="bridge-ref">${r.label}</li>`)
                .join('')}
            </ul>
          </div>
        </nav>

        <!-- Chapter Content Area -->
        <div class="bridge-content" id="bridge-content">
          ${renderChapterContent(chapters[activeChapter])}
        </div>
      </div>
    </div>
  `;
}

function renderChapterContent(chapter: Chapter): string {
  return `
    <div class="bridge-chapter" style="--ch-color: ${chapter.color}">
      <div class="bridge-chapter-header">
        <span class="bridge-chapter-icon">${chapter.icon}</span>
        <h2 class="bridge-chapter-title">${chapter.title}</h2>
      </div>

      ${chapter.sections.map(renderSection).join('')}
    </div>
  `;
}

// ── Section Renderers ────────────────────────────────────────

function renderSection(section: any): string {
  switch (section.type) {
    case 'guide-cards':
      return renderGuideCards(section);
    case 'steps':
      return renderSteps(section);
    case 'tree':
      return renderTreeSection(section);
    case 'callout':
      return renderCallout(section);
    case 'comparison-table':
      return renderComparisonTable(section);
    case 'taxonomy-cards':
      return renderTaxonomyCards(section);
    case 'property-breakdown':
      return renderPropertyBreakdown(section);
    case 'aspect-diagram':
      return renderAspectDiagram(section);
    case 'matrix':
      return renderMatrix(section);
    case 'concept-pair':
      return renderConceptPair(section);
    case 'concept-list':
      return renderConceptList(section);
    case 'family-tree':
      return renderFamilyTree(section);
    case 'flowchart':
      return renderFlowchart(section);
    case 'mistakes':
      return renderMistakes(section);
    case 'glossary':
      return renderGlossary(section);
    default:
      return '';
  }
}

function renderGuideCards(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <div class="guide-cards-grid">
        ${section.cards
          .map(
            (card: any) => `
          <div class="guide-card" style="--guide-accent: ${card.color}">
            <div class="guide-card-icon">${card.icon}</div>
            <h4 class="guide-card-title">${card.title}</h4>
            <p class="guide-card-desc">${card.description}</p>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderSteps(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <div class="steps-timeline">
        ${section.steps
          .map(
            (step: any) => `
          <div class="step-item">
            <div class="step-number">${step.number}</div>
            <div class="step-body">
              <h4 class="step-title">${step.title}</h4>
              <p class="step-detail">${step.detail}</p>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderTreeSection(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>
      <div class="tree-container" id="tree-${section.id}">
        ${renderTreeNode(section.tree, 0)}
      </div>
    </div>
  `;
}

function renderTreeNode(node: TreeNode, depth: number): string {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedTreeNodes.has(node.id);
  const highlightClass = node.highlight ? 'tree-node--highlight' : '';

  return `
    <div class="tree-node tree-depth-${Math.min(depth, 4)} ${highlightClass}" data-tree-id="${node.id}">
      <div class="tree-node-header ${hasChildren ? 'tree-node--expandable' : ''}" data-tree-toggle="${node.id}">
        ${hasChildren ? `<span class="tree-expand-icon ${isExpanded ? 'tree-expand-icon--open' : ''}">${isExpanded ? '▾' : '▸'}</span>` : '<span class="tree-leaf-dot">•</span>'}
        ${node.icon ? `<span class="tree-node-icon">${node.icon}</span>` : ''}
        <span class="tree-node-label">${node.label}</span>
      </div>
      ${node.description ? `<p class="tree-node-desc">${node.description}</p>` : ''}
      ${hasChildren ? `
        <div class="tree-node-children ${isExpanded ? 'tree-children--visible' : 'tree-children--hidden'}">
          ${node.children!.map((child) => renderTreeNode(child, depth + 1)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderCallout(section: any): string {
  const variantIcons: Record<string, string> = {
    important: '⚡',
    tip: '💡',
    warning: '⚠️',
    note: '📝',
  };
  return `
    <div class="bridge-section">
      <div class="bridge-callout bridge-callout--${section.variant}">
        <div class="callout-icon">${variantIcons[section.variant] ?? '📌'}</div>
        <div class="callout-body">
          <h4 class="callout-title">${section.title}</h4>
          <p class="callout-text">${section.text}</p>
        </div>
      </div>
    </div>
  `;
}

function renderComparisonTable(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <div class="bridge-table-wrap">
        <table class="bridge-table">
          <thead>
            <tr>
              ${section.headers.map((h: string) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${section.rows
              .map(
                (row: string[]) => `
              <tr>
                ${row.map((cell: string, i: number) => `<td class="${i === 0 ? 'table-label-cell' : ''}">${cell}</td>`).join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTaxonomyCards(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>
      <div class="taxonomy-cards-grid">
        ${section.cards
          .map(
            (card: any) => `
          <div class="taxonomy-card" style="--tax-color: ${card.color}">
            <div class="taxonomy-card-header">
              <span class="taxonomy-icon">${card.icon}</span>
              <h4 class="taxonomy-name">${card.name}</h4>
              <span class="taxonomy-count">${card.projectionCount} projections</span>
            </div>
            <div class="taxonomy-card-body">
              <div class="taxonomy-field">
                <span class="taxonomy-field-label">Surface</span>
                <span class="taxonomy-field-value">${card.surface}</span>
              </div>
              <div class="taxonomy-field">
                <span class="taxonomy-field-label">Graticule</span>
                <span class="taxonomy-field-value">${card.graticule}</span>
              </div>
              <div class="taxonomy-field">
                <span class="taxonomy-field-label">Best For</span>
                <span class="taxonomy-field-value taxonomy-field--highlight">${card.bestFor}</span>
              </div>
              <div class="taxonomy-field">
                <span class="taxonomy-field-label">Weakness</span>
                <span class="taxonomy-field-value taxonomy-field--warning">${card.weakness}</span>
              </div>
              <div class="taxonomy-examples">
                <span class="taxonomy-field-label">Examples</span>
                <div class="taxonomy-example-tags">
                  ${card.examples.map((ex: string) => `<span class="taxonomy-tag">${ex}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderPropertyBreakdown(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>
      <div class="bridge-callout bridge-callout--warning">
        <div class="callout-icon">⚡</div>
        <div class="callout-body">
          <h4 class="callout-title">The Fundamental Trade-Off</h4>
          <p class="callout-text">${section.tradeoff}</p>
        </div>
      </div>
      <div class="property-cards-grid">
        ${section.properties
          .map(
            (prop: any) => `
          <div class="property-card" style="--prop-color: ${prop.color}">
            <div class="property-card-header">
              <span class="property-icon">${prop.icon}</span>
              <h4 class="property-name">${prop.name}</h4>
            </div>
            <div class="property-card-body">
              <div class="property-field property-field--preserves">
                <span class="property-field-badge">✅ Preserves</span>
                <p>${prop.preserves}</p>
              </div>
              <div class="property-field property-field--distorts">
                <span class="property-field-badge">⚠️ Distorts</span>
                <p>${prop.distorts}</p>
              </div>
              <div class="property-field">
                <span class="property-field-badge">🔍 How to Spot (Tissot)</span>
                <p>${prop.howToSpot}</p>
              </div>
              <div class="property-use-cases">
                <span class="property-field-badge">🗺️ Use Cases</span>
                <ul>
                  ${prop.useCases.map((u: string) => `<li>${u}</li>`).join('')}
                </ul>
              </div>
              <div class="property-projections">
                <span class="property-field-badge">📌 Key Projections</span>
                <div class="property-proj-tags">
                  ${prop.keyProjections.map((p: string) => `<span class="property-proj-tag">${p}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderAspectDiagram(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>
      <div class="aspect-cards">
        ${section.aspects
          .map(
            (asp: any) => `
          <div class="aspect-card">
            <div class="aspect-card-header">
              <span class="aspect-icon">${asp.icon}</span>
              <h4 class="aspect-name">${asp.name}</h4>
            </div>
            <p class="aspect-desc">${asp.description}</p>
            <div class="aspect-best-for">
              <strong>Best for:</strong> ${asp.bestFor}
            </div>
            <div class="aspect-example">
              <strong>Example:</strong> ${asp.example}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderMatrix(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>
      <div class="bridge-table-wrap matrix-table-wrap">
        <table class="bridge-table matrix-table">
          <thead>
            <tr>
              <th class="matrix-corner">${section.rowHeader} \\ ${section.colHeader}</th>
              ${section.columns.map((col: string) => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${section.rows
              .map(
                (row: any) => `
              <tr>
                <td class="matrix-row-header">${row.family}</td>
                ${row.cells
                  .map(
                    (cell: any) => `
                  <td class="matrix-cell">
                    <div class="matrix-projs">${cell.projections.join(', ')}</div>
                    ${cell.note ? `<div class="matrix-note">${cell.note}</div>` : ''}
                  </td>
                `
                  )
                  .join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderConceptPair(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>
      <div class="concept-pair-grid">
        ${section.pairs
          .map(
            (pair: any) => `
          <div class="concept-card">
            <div class="concept-card-header">
              <span class="concept-icon">${pair.icon}</span>
              <h4>${pair.name}</h4>
            </div>
            <p class="concept-desc">${pair.description}</p>
            <div class="concept-details">${pair.details}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderConceptList(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>
      <div class="concept-list">
        ${section.items
          .map(
            (item: any) => `
          <div class="concept-list-item">
            <div class="concept-list-icon">${item.icon}</div>
            <div class="concept-list-body">
              <h4 class="concept-list-name">${item.name}</h4>
              <p class="concept-list-source"><strong>Light Source:</strong> ${item.source}</p>
              <p class="concept-list-special">${item.special}</p>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderFamilyTree(section: any): string {
  const tree = section.tree;
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>
      <div class="family-tree-diagram">
        <div class="ft-root">
          <span class="ft-root-label">${tree.label}</span>
        </div>
        <div class="ft-branches">
          ${tree.children
            .map(
              (branch: any) => `
            <div class="ft-branch">
              <div class="ft-branch-label">${branch.label}</div>
              <div class="ft-branch-children">
                ${branch.children
                  .map(
                    (child: any) => `
                  <div class="ft-child">
                    <div class="ft-child-label">${child.label}</div>
                    ${
                      child.leaves
                        ? `<div class="ft-leaves">${child.leaves.map((l: string) => `<span class="ft-leaf">${l}</span>`).join('')}</div>`
                        : ''
                    }
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function renderFlowchart(section: any): string {
  const currentStep = section.steps.find((s: any) => s.id === activeFlowchartStep) ?? section.steps[0];

  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <p class="bridge-section-desc">${section.description}</p>

      <div class="flowchart-container" id="flowchart-container">
        <div class="flowchart-step">
          <div class="flowchart-question">
            <span class="flowchart-q-icon">❓</span>
            <h4>${currentStep.question}</h4>
          </div>
          <div class="flowchart-options">
            ${currentStep.options
              .map(
                (opt: any) => `
              <button type="button" class="flowchart-option-btn" data-next="${opt.next ?? ''}" data-result="${opt.result ?? ''}">
                <span class="flowchart-option-label">${opt.label}</span>
                ${opt.result ? `<span class="flowchart-option-result">→ ${opt.result}</span>` : '<span class="flowchart-option-arrow">→</span>'}
              </button>
            `
              )
              .join('')}
          </div>
          ${activeFlowchartStep !== 'q1' ? `
            <button type="button" class="flowchart-back-btn" id="flowchart-back">
              ← Start Over
            </button>
          ` : ''}
        </div>

        <div class="flowchart-breadcrumb">
          ${buildFlowchartBreadcrumb(section.steps)}
        </div>
      </div>
    </div>
  `;
}

function buildFlowchartBreadcrumb(steps: any[]): string {
  // Simple breadcrumb showing which steps have been visited
  const allIds = steps.map((s: any) => s.id);
  return `
    <div class="flowchart-dots">
      ${allIds
        .map(
          (id: string) => `
        <span class="flowchart-dot ${id === activeFlowchartStep ? 'flowchart-dot--active' : ''}"></span>
      `
        )
        .join('')}
    </div>
  `;
}

function renderMistakes(section: any): string {
  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <div class="mistakes-grid">
        ${section.items
          .map(
            (item: any) => `
          <div class="mistake-card">
            <div class="mistake-header">
              <span class="mistake-icon">${item.icon}</span>
              <h4 class="mistake-myth">"${item.myth}"</h4>
            </div>
            <div class="mistake-truth">
              <span class="truth-badge">✅ Actually:</span>
              <p>${item.truth}</p>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderGlossary(section: any): string {
  const filtered = glossaryFilter
    ? section.terms.filter(
        (t: any) =>
          t.term.toLowerCase().includes(glossaryFilter.toLowerCase()) ||
          t.definition.toLowerCase().includes(glossaryFilter.toLowerCase())
      )
    : section.terms;

  return `
    <div class="bridge-section">
      <h3 class="bridge-section-title">${section.title}</h3>
      <div class="glossary-search-wrap">
        <input type="text" id="glossary-search" class="glossary-search" placeholder="Filter terms…" value="${glossaryFilter}" autocomplete="off" />
      </div>
      <div class="glossary-list">
        ${filtered
          .map(
            (term: any) => `
          <div class="glossary-item">
            <dt class="glossary-term">${term.term}</dt>
            <dd class="glossary-def">${term.definition}</dd>
          </div>
        `
          )
          .join('')}
        ${filtered.length === 0 ? '<p class="glossary-empty">No matching terms found.</p>' : ''}
      </div>
    </div>
  `;
}

// ── Event Binding ────────────────────────────────────────────

function bindBridgeCourseEvents(container: HTMLElement): void {
  // Chapter navigation
  const navItems = container.querySelectorAll<HTMLButtonElement>('.bridge-nav-item');
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeChapter = parseInt(btn.dataset.chapter ?? '0', 10);
      activeFlowchartStep = 'q1';
      glossaryFilter = '';
      renderBridgeCourse(container);
    });
  });

  // Tree node expand/collapse
  container.querySelectorAll<HTMLElement>('.tree-node--expandable').forEach((header) => {
    header.addEventListener('click', () => {
      const nodeId = header.dataset.treeToggle;
      if (!nodeId) return;
      if (expandedTreeNodes.has(nodeId)) {
        expandedTreeNodes.delete(nodeId);
      } else {
        expandedTreeNodes.add(nodeId);
      }
      // Re-render just the chapter content
      const contentEl = container.querySelector('#bridge-content');
      if (contentEl) {
        contentEl.innerHTML = renderChapterContent(data.chapters[activeChapter]);
        // Re-bind tree + flowchart + glossary events
        rebindContentEvents(container);
      }
    });
  });

  // Flowchart navigation
  container.querySelectorAll<HTMLButtonElement>('.flowchart-option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.next;
      if (next) {
        activeFlowchartStep = next;
        const contentEl = container.querySelector('#bridge-content');
        if (contentEl) {
          contentEl.innerHTML = renderChapterContent(data.chapters[activeChapter]);
          rebindContentEvents(container);
        }
      }
    });
  });

  const backBtn = container.querySelector('#flowchart-back');
  backBtn?.addEventListener('click', () => {
    activeFlowchartStep = 'q1';
    const contentEl = container.querySelector('#bridge-content');
    if (contentEl) {
      contentEl.innerHTML = renderChapterContent(data.chapters[activeChapter]);
      rebindContentEvents(container);
    }
  });

  // Glossary search
  const glossaryInput = container.querySelector<HTMLInputElement>('#glossary-search');
  let glossaryTimeout: ReturnType<typeof setTimeout>;
  glossaryInput?.addEventListener('input', () => {
    clearTimeout(glossaryTimeout);
    glossaryTimeout = setTimeout(() => {
      glossaryFilter = glossaryInput.value.trim();
      const contentEl = container.querySelector('#bridge-content');
      if (contentEl) {
        contentEl.innerHTML = renderChapterContent(data.chapters[activeChapter]);
        rebindContentEvents(container);
        // Re-focus the search input and restore cursor position
        const newInput = container.querySelector<HTMLInputElement>('#glossary-search');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      }
    }, 200);
  });
}

function rebindContentEvents(container: HTMLElement): void {
  // Re-bind tree toggles
  container.querySelectorAll<HTMLElement>('.tree-node--expandable').forEach((header) => {
    header.addEventListener('click', () => {
      const nodeId = header.dataset.treeToggle;
      if (!nodeId) return;
      if (expandedTreeNodes.has(nodeId)) {
        expandedTreeNodes.delete(nodeId);
      } else {
        expandedTreeNodes.add(nodeId);
      }
      const contentEl = container.querySelector('#bridge-content');
      if (contentEl) {
        contentEl.innerHTML = renderChapterContent(data.chapters[activeChapter]);
        rebindContentEvents(container);
      }
    });
  });

  // Re-bind flowchart
  container.querySelectorAll<HTMLButtonElement>('.flowchart-option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.next;
      if (next) {
        activeFlowchartStep = next;
        const contentEl = container.querySelector('#bridge-content');
        if (contentEl) {
          contentEl.innerHTML = renderChapterContent(data.chapters[activeChapter]);
          rebindContentEvents(container);
        }
      }
    });
  });

  const backBtn = container.querySelector('#flowchart-back');
  backBtn?.addEventListener('click', () => {
    activeFlowchartStep = 'q1';
    const contentEl = container.querySelector('#bridge-content');
    if (contentEl) {
      contentEl.innerHTML = renderChapterContent(data.chapters[activeChapter]);
      rebindContentEvents(container);
    }
  });

  // Re-bind glossary search
  const glossaryInput = container.querySelector<HTMLInputElement>('#glossary-search');
  let glossaryTimeout: ReturnType<typeof setTimeout>;
  glossaryInput?.addEventListener('input', () => {
    clearTimeout(glossaryTimeout);
    glossaryTimeout = setTimeout(() => {
      glossaryFilter = glossaryInput.value.trim();
      const contentEl = container.querySelector('#bridge-content');
      if (contentEl) {
        contentEl.innerHTML = renderChapterContent(data.chapters[activeChapter]);
        rebindContentEvents(container);
        const newInput = container.querySelector<HTMLInputElement>('#glossary-search');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      }
    }, 200);
  });
}
