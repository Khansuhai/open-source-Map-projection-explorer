/** Types matching the structure of projections-catalog.json, recipe-rules.json, and distortion-lab.json */

export type PropertyId = 'conformal' | 'equal-area' | 'equidistant' | 'true-direction' | 'compromise';
export type FamilyId = 'cylindrical' | 'conic' | 'azimuthal' | 'pseudocylindrical' | 'compromise';

export interface PropertyClass {
  id: PropertyId;
  name: string;
  preserves: string;
  distorts: string;
}

export interface Projection {
  id: string;
  name: string;
  property: PropertyId;
  aspect: string;
  year?: number;
  author?: string;
  epsg?: string | null;
  bestFor: string[];
  distortionNote: string;
}

export interface Family {
  id: FamilyId;
  name: string;
  surface: string;
  bestFor: string[];
  projections: Projection[];
}

export interface ProjectionCatalog {
  meta: {
    title: string;
    reference: string;
    note: string;
  };
  propertyClasses: PropertyClass[];
  families: Family[];
  stretchGoals: Array<{
    id: string;
    name: string;
    note: string;
  }>;
}

/** Flattened projection with family info attached */
export interface ProjectionEntry extends Projection {
  familyId: FamilyId;
  familyName: string;
}

// ── Phase 2: Recipe & Mix Station Types ─────────────────────────

export type VerdictId = 'impossible' | 'clashing' | 'workable' | 'great';

export interface VerdictInfo {
  id: VerdictId;
  name: string;
  icon: string;
  badgeClass: string;
  color: string;
}

export interface MixSelection {
  properties: PropertyId[];
  family: string;
  aspect: string;
  scope: string;
  location: string;
  purpose: string;
}

export interface RecipeRuleCondition {
  property?: PropertyId | PropertyId[];
  family?: string;
  aspect?: string;
  scope?: string;
  location?: string;
  purpose?: string;
}

export interface RecipeRule {
  id: string;
  condition: RecipeRuleCondition;
  verdict: VerdictId;
  explanation: string;
  suggest?: string[];
}

export interface RecipeVariableOption {
  id: string;
  label: string;
}

export interface RecipeVariable {
  id: string;
  label: string;
  description: string;
  isMulti: boolean;
  required: boolean;
  options: RecipeVariableOption[];
}

export interface RecipeRulesData {
  meta: {
    title: string;
    description: string;
    version: string;
  };
  verdicts: Record<VerdictId, VerdictInfo>;
  defaultVerdict: {
    verdict: VerdictId;
    explanation: string;
  };
  variables: Record<string, RecipeVariable>;
  rules: RecipeRule[];
}

// ── Phase 3: Distortion Lab Types ─────────────────────────────

export interface DistortionLabAspect {
  id: string;
  label: string;
  tangentLine: string;
  secantParallels: string;
}

export interface AzimuthalPerspective {
  id: string;
  name: string;
  position: number;
  viewpoint: string;
  d3Function: string;
  property: string;
}

export interface DistortionLabCase {
  id: string;
  label: string;
  description: string;
}

export interface DistortionLabConfig {
  meta: {
    title: string;
    description: string;
    version: string;
  };
  gridSettings: {
    stepLatitude: number;
    stepLongitude: number;
    circleRadiusDegrees: number;
    circleSegments: number;
  };
  distortionMeasures: Record<string, {
    id: string;
    name: string;
    formula?: string;
    explanation: string;
  }>;
  aspectByFamily: Record<string, DistortionLabAspect[]>;
  azimuthalPerspectiveType: AzimuthalPerspective[];
  cases: DistortionLabCase[];
}
