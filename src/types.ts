/** Types matching the structure of projections-catalog.json */

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
