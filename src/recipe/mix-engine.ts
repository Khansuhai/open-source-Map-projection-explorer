/**
 * Recipe evaluation engine for Phase 2: Mix Station
 * Evaluates user selections against cartographic rules to produce a dish verdict.
 */
import type {
  RecipeRulesData,
  MixSelection,
  VerdictInfo,
  ProjectionEntry,
} from '../types';
import recipeData from '../../data/recipe-rules.json';
import { getProjectionById } from '../shelf/catalog-loader';

export const recipeRules = recipeData as RecipeRulesData;

export interface MixEvaluationResult {
  verdict: VerdictInfo;
  explanation: string;
  suggestedProjections: ProjectionEntry[];
}

/**
 * Evaluates the user's picked mix of variables and returns the verdict,
 * explanation, and recommended projections.
 */
export function evaluateMix(selection: MixSelection): MixEvaluationResult {
  const { verdicts, defaultVerdict, rules } = recipeRules;

  // ── Hard Law of the Kitchen: Conformal + Equal-Area = Impossible ──
  const hasConformal = selection.properties.includes('conformal');
  const hasEqualArea = selection.properties.includes('equal-area');

  if (hasConformal && hasEqualArea) {
    const hardRule = rules.find((r) => r.id === 'hard-conformal-equal-area');
    const suggestions = (hardRule?.suggest ?? ['albers-equal-area-conic', 'lambert-conformal-conic', 'winkel-tripel'])
      .map(getProjectionById)
      .filter((p): p is ProjectionEntry => p !== undefined);

    return {
      verdict: verdicts.impossible,
      explanation: hardRule?.explanation ??
        'Hard Law of the Kitchen: A map projection cannot be conformal and equal-area at the same time. Preserving local angular relationships requires stretching scale equally in all directions, while preserving relative area requires the product of scale factors to equal unity. When shapes distort to preserve area, angles must bend.',
      suggestedProjections: suggestions,
    };
  }

  // ── Match specific rules ──────────────────────────────────────
  for (const rule of rules) {
    if (rule.id === 'hard-conformal-equal-area') continue; // already evaluated

    const cond = rule.condition;
    let matches = true;

    // Check property condition
    if (cond.property) {
      if (Array.isArray(cond.property)) {
        const hasAll = cond.property.every((p) => selection.properties.includes(p));
        if (!hasAll) matches = false;
      } else {
        if (!selection.properties.includes(cond.property)) matches = false;
      }
    }

    // Check family condition
    if (matches && cond.family && cond.family !== 'any') {
      if (selection.family !== cond.family) matches = false;
    }

    // Check aspect condition
    if (matches && cond.aspect && cond.aspect !== 'any') {
      if (selection.aspect !== cond.aspect) matches = false;
    }

    // Check scope condition
    if (matches && cond.scope) {
      if (selection.scope !== cond.scope) matches = false;
    }

    // Check location condition
    if (matches && cond.location) {
      if (selection.location !== cond.location) matches = false;
    }

    // Check purpose condition
    if (matches && cond.purpose) {
      if (selection.purpose !== cond.purpose) matches = false;
    }

    if (matches) {
      const suggestions = (rule.suggest ?? [])
        .map(getProjectionById)
        .filter((p): p is ProjectionEntry => p !== undefined);

      return {
        verdict: verdicts[rule.verdict] ?? verdicts.workable,
        explanation: rule.explanation,
        suggestedProjections: suggestions,
      };
    }
  }

  // ── Default Fallthrough: Workable Dish ────────────────────────
  return {
    verdict: verdicts[defaultVerdict.verdict] ?? verdicts.workable,
    explanation: defaultVerdict.explanation,
    suggestedProjections: [],
  };
}
