import { COMBAT_TUNING, PATTERNS, type AttackPattern, type BossVersionScript, type PatternId } from './patterns';

export interface FairnessRules {
  readonly minTelegraphMs: number;
  readonly minDashCatchTelegraphMs: number;
  readonly minOpeningMs: number;
  readonly maxPulseSpeed: number;
  readonly maxLanceCount: number;
  readonly maxLanceHalfWidth: number;
  readonly minCompressionSafeGap: number;
  readonly maxDashCatchMarkerRadius: number;
  readonly maxDashCatchPredictionDistance: number;
}

export const DEFAULT_FAIRNESS_RULES: FairnessRules = {
  minTelegraphMs: 650,
  minDashCatchTelegraphMs: 700,
  minOpeningMs: 900,
  maxPulseSpeed: 0.8,
  maxLanceCount: 3,
  maxLanceHalfWidth: 24,
  minCompressionSafeGap: COMBAT_TUNING.playerRadius * 6,
  maxDashCatchMarkerRadius: 60,
  maxDashCatchPredictionDistance: COMBAT_TUNING.dashDistance,
};

export type FairnessIssueCode =
  | 'telegraph-too-short'
  | 'opening-too-short'
  | 'invalid-duration'
  | 'pulse-too-fast'
  | 'invalid-pulse-ring'
  | 'too-many-lances'
  | 'lance-too-wide'
  | 'compression-gap-too-small'
  | 'dash-catch-telegraph-too-short'
  | 'dash-catch-marker-too-large'
  | 'dash-catch-prediction-too-far'
  | 'dash-catch-retargets'
  | 'empty-sequence'
  | 'unknown-pattern'
  | 'wrong-version-pattern'
  | 'baseline-has-mutation'
  | 'mutation-missing-dash-catch';

export interface FairnessIssue {
  readonly code: FairnessIssueCode;
  readonly patternId?: PatternId;
  readonly message: string;
}

function issue(
  code: FairnessIssueCode,
  message: string,
  patternId?: PatternId,
): FairnessIssue {
  return patternId === undefined ? { code, message } : { code, message, patternId };
}

export function validatePattern(
  pattern: AttackPattern,
  rules: FairnessRules = DEFAULT_FAIRNESS_RULES,
): readonly FairnessIssue[] {
  const issues: FairnessIssue[] = [];

  if (
    pattern.telegraphMs <= 0
    || pattern.activeMs <= 0
    || pattern.openingMs < 0
    || pattern.recoveryMs < 0
  ) {
    issues.push(issue('invalid-duration', 'Pattern phases must use valid durations.', pattern.id));
  }
  if (pattern.telegraphMs < rules.minTelegraphMs) {
    issues.push(issue('telegraph-too-short', 'Telegraph is below the reaction floor.', pattern.id));
  }
  if (pattern.openingMs < rules.minOpeningMs) {
    issues.push(issue('opening-too-short', 'Punish opening is too short.', pattern.id));
  }

  switch (pattern.kind) {
    case 'pulse':
      for (const ring of pattern.rings) {
        const travelMs = pattern.activeMs - ring.delayMs;
        if (
          ring.delayMs < 0
          || ring.startRadius < 0
          || ring.endRadius <= ring.startRadius
          || ring.halfWidth <= 0
          || travelMs <= 0
        ) {
          issues.push(issue('invalid-pulse-ring', 'Pulse ring geometry is invalid.', pattern.id));
          continue;
        }
        const speed = (ring.endRadius - ring.startRadius) / travelMs;
        if (speed > rules.maxPulseSpeed) {
          issues.push(issue('pulse-too-fast', 'Pulse crosses the arena too quickly.', pattern.id));
        }
      }
      break;
    case 'lances':
      if (pattern.count > rules.maxLanceCount) {
        issues.push(issue('too-many-lances', 'Lance count obscures the safe route.', pattern.id));
      }
      if (pattern.halfWidth > rules.maxLanceHalfWidth) {
        issues.push(issue('lance-too-wide', 'Lance width leaves too little correction room.', pattern.id));
      }
      break;
    case 'compression':
      if (pattern.safeGap < rules.minCompressionSafeGap) {
        issues.push(
          issue('compression-gap-too-small', 'Compression gap is smaller than the dodge floor.', pattern.id),
        );
      }
      break;
    case 'dashCatch':
      if (pattern.telegraphMs < rules.minDashCatchTelegraphMs) {
        issues.push(
          issue('dash-catch-telegraph-too-short', 'DASH CATCH warning is too short.', pattern.id),
        );
      }
      if (pattern.markerRadius > rules.maxDashCatchMarkerRadius) {
        issues.push(
          issue('dash-catch-marker-too-large', 'DASH CATCH marker erases redirection space.', pattern.id),
        );
      }
      if (pattern.maxPredictionDistance > rules.maxDashCatchPredictionDistance) {
        issues.push(
          issue('dash-catch-prediction-too-far', 'DASH CATCH predicts beyond one authored dash.', pattern.id),
        );
      }
      if (pattern.lockMode !== 'telegraph-start') {
        issues.push(issue('dash-catch-retargets', 'DASH CATCH must lock before damage.', pattern.id));
      }
      break;
  }

  return issues;
}

export function validateVersionScript(
  script: BossVersionScript,
  patterns: Readonly<Record<PatternId, AttackPattern>> = PATTERNS,
  rules: FairnessRules = DEFAULT_FAIRNESS_RULES,
): readonly FairnessIssue[] {
  const issues: FairnessIssue[] = [];

  if (script.sequence.length === 0) {
    issues.push(issue('empty-sequence', 'Version script must contain at least one attack.'));
  }

  let containsDashCatch = false;
  for (const patternId of script.sequence) {
    const pattern = patterns[patternId];
    if (pattern === undefined) {
      issues.push(issue('unknown-pattern', `Unknown pattern: ${patternId}.`, patternId));
      continue;
    }
    if (pattern.version !== script.version) {
      issues.push(
        issue('wrong-version-pattern', `${patternId} belongs to ${pattern.version}.`, patternId),
      );
    }
    containsDashCatch ||= pattern.kind === 'dashCatch';
    issues.push(...validatePattern(pattern, rules));
  }

  if (script.version === 'V01' && (script.mutation !== undefined || containsDashCatch)) {
    issues.push(issue('baseline-has-mutation', 'V.01 must teach the baseline without a mutation.'));
  }
  if (script.version === 'V37' && (script.mutation?.id !== 'dash-catch' || !containsDashCatch)) {
    issues.push(
      issue('mutation-missing-dash-catch', 'V.37 must explicitly name and use DASH CATCH.'),
    );
  }

  return issues;
}

export function assertFairVersionScript(
  script: BossVersionScript,
  patterns: Readonly<Record<PatternId, AttackPattern>> = PATTERNS,
  rules: FairnessRules = DEFAULT_FAIRNESS_RULES,
): void {
  const issues = validateVersionScript(script, patterns, rules);
  if (issues.length > 0) {
    throw new Error(issues.map((entry) => `${entry.code}: ${entry.message}`).join('\n'));
  }
}
