/**
 * Loads and flattens the projections-catalog.json into a list of ProjectionEntry items
 * with family info attached to each projection for easy filtering and display.
 */
import type { ProjectionCatalog, ProjectionEntry, FamilyId, PropertyId } from '../types';
import catalogData from '../../data/projections-catalog.json';

const catalog = catalogData as ProjectionCatalog;

/** All property classes from the catalog */
export const propertyClasses = catalog.propertyClasses;

/** All families from the catalog */
export const families = catalog.families;

/** Flattened list of all projections with family info */
export const allProjections: ProjectionEntry[] = catalog.families.flatMap((family) =>
  family.projections.map((proj) => ({
    ...proj,
    familyId: family.id as FamilyId,
    familyName: family.name,
  }))
);

/** Get all unique family IDs */
export const familyIds: FamilyId[] = catalog.families.map((f) => f.id as FamilyId);

/** Get all unique property IDs */
export const propertyIds: PropertyId[] = catalog.propertyClasses.map((p) => p.id as PropertyId);

/** Find a single projection by its ID */
export function getProjectionById(id: string): ProjectionEntry | undefined {
  return allProjections.find((p) => p.id === id);
}

/** Get family info by ID */
export function getFamilyById(familyId: FamilyId) {
  return catalog.families.find((f) => f.id === familyId);
}

/** Get property class info by ID */
export function getPropertyClassById(propertyId: PropertyId) {
  return catalog.propertyClasses.find((p) => p.id === propertyId);
}

/** Filter projections by family and property */
export function filterProjections(
  familyFilter: FamilyId | 'all',
  propertyFilter: PropertyId | 'all',
  searchQuery: string
): ProjectionEntry[] {
  return allProjections.filter((p) => {
    if (familyFilter !== 'all' && p.familyId !== familyFilter) return false;
    if (propertyFilter !== 'all' && p.property !== propertyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.familyName.toLowerCase().includes(q) ||
        p.bestFor.some((b) => b.toLowerCase().includes(q)) ||
        (p.author && p.author.toLowerCase().includes(q))
      );
    }
    return true;
  });
}
