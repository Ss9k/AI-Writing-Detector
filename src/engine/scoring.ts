import {
  ClassificationType,
  DetectorResult,
  CategoryScoreSummary,
} from '../types/detector.ts';

export const SCORE_THRESHOLDS = {
  HUMAN_MAX: 29,
  POSSIBLY_AI_MIN: 30,
  POSSIBLY_AI_MAX: 59,
  LIKELY_AI_MIN: 60,
};

/**
 * Determine deterministic classification string based on 0-100 score.
 */
export function classifyScore(score: number): ClassificationType {
  const rounded = Math.round(score);
  if (rounded <= SCORE_THRESHOLDS.HUMAN_MAX) {
    return 'Likely Human-Written';
  }
  if (rounded <= SCORE_THRESHOLDS.POSSIBLY_AI_MAX) {
    return 'Possibly AI-Generated';
  }
  return 'Likely AI-Generated';
}

export interface ScoreAggregationResult {
  finalScore: number;
  rawScoreTotal: number;
  classification: ClassificationType;
  categorySummaries: CategoryScoreSummary[];
}

export function aggregateScores(detectors: DetectorResult[]): ScoreAggregationResult {
  const groupLabels: Record<DetectorResult['group'], string> = {
    vocabulary: 'AI Vocabulary',
    structural: 'Structural Patterns',
    vague_language: 'Vague Language',
    promotional: 'Promotional & Emphasis',
    statistical: 'Statistical Stylometrics',
  };

  const groupScores: Record<
    DetectorResult['group'],
    { raw: number; maxCap: number }
  > = {
    vocabulary: { raw: 0, maxCap: 0 },
    structural: { raw: 0, maxCap: 0 },
    vague_language: { raw: 0, maxCap: 0 },
    promotional: { raw: 0, maxCap: 0 },
    statistical: { raw: 0, maxCap: 0 },
  };

  for (const detector of detectors) {
    groupScores[detector.group].raw += detector.cappedScore;
    groupScores[detector.group].maxCap += detector.maxCap;
  }

  const rawScoreTotal = Object.values(groupScores).reduce((acc, curr) => acc + curr.raw, 0);

  // If raw score exceeds 100, normalize category contributions proportionally
  const finalScore = Math.min(100, Math.round(rawScoreTotal));
  const needsNormalization = rawScoreTotal > 100;

  const categorySummaries: CategoryScoreSummary[] = (
    Object.keys(groupScores) as Array<DetectorResult['group']>
  ).map((group) => {
    const raw = groupScores[group].raw;
    const maxCap = groupScores[group].maxCap;
    let normalized = raw;

    if (needsNormalization && rawScoreTotal > 0) {
      normalized = Math.round((raw / rawScoreTotal) * 100);
    }

    const percentContribution = finalScore > 0 ? Math.round((normalized / finalScore) * 100) : 0;

    return {
      group,
      label: groupLabels[group],
      rawScore: raw,
      normalizedScore: normalized,
      maxCap,
      percentContribution,
    };
  });

  const classification = classifyScore(finalScore);

  return {
    finalScore,
    rawScoreTotal,
    classification,
    categorySummaries,
  };
}
