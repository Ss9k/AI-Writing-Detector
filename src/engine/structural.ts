import { DetectorResult, DetectedEvidence } from '../types/detector.ts';

/**
 * A. Rule of Three Detector
 * Detects groups of three parallel items/adjectives/nouns/phrases.
 */
export function detectRuleOfThree(text: string, maxCap: number = 12): DetectorResult {
  const evidence: DetectedEvidence[] = [];
  // Pattern 1: Triads of single-word or hyphenated adjectives/nouns: "X, Y, and Z" or "X, Y, or Z"
  const triadRegex = /\b([a-zA-Z-]+)\s*,\s*([a-zA-Z-]+)\s*,?\s+(?:and|or|as well as)\s+([a-zA-Z-]+)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = triadRegex.exec(text)) !== null) {
    const matchedText = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + matchedText.length;

    // Filter out common coordinate dates like "January 1, 2024, and" or false matches
    const parts = [match[1].toLowerCase(), match[2].toLowerCase(), match[3].toLowerCase()];
    if (parts.some((p) => /^\d+$/.test(p) || p.length < 2)) continue;

    evidence.push({
      id: `rule-of-three-${startIndex}`,
      detectorId: 'rule_of_three',
      category: 'Rule of Three',
      matchedText,
      startIndex,
      endIndex,
      explanation: `Parallel triad construction: "${matchedText}". AI text heavily favors symmetrical three-item lists.`,
      scoreWeight: 3,
    });
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 3;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'rule_of_three',
    name: 'Rule of Three (Triads)',
    category: 'Rule of Three',
    group: 'structural',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Found ${occurrences} parallel three-item construction(s), contributing ${cappedScore}/${maxCap} points.`
        : 'No prominent rule-of-three list patterns detected.',
    evidence,
  };
}

/**
 * B. Negative Parallelism Detector
 * Detects structures like "not only ... but also ...", "not just ... but also ...", etc.
 */
export function detectNegativeParallelism(text: string, maxCap: number = 12): DetectorResult {
  const evidence: DetectedEvidence[] = [];
  // Non-greedy match between "not only/just/merely/simply" and "but also/rather/even" within the same sentence
  const negPattern = /\bnot\s+(?:only|just|merely|simply)\s+([^.!?\n]{3,80}?)\s+but\s+(?:also|rather|even)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = negPattern.exec(text)) !== null) {
    const matchedText = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + matchedText.length;

    evidence.push({
      id: `neg-parallel-${startIndex}`,
      detectorId: 'negative_parallelism',
      category: 'Negative Parallelism',
      matchedText,
      startIndex,
      endIndex,
      explanation: `Rhetorical contrast structure ("not only... but also..."): "${matchedText}". Frequently over-indexed in LLM generated prose.`,
      scoreWeight: 4,
    });
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 4;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'negative_parallelism',
    name: 'Negative Parallelism',
    category: 'Negative Parallelism',
    group: 'structural',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Found ${occurrences} negative parallelism rhetorical structure(s), contributing ${cappedScore}/${maxCap} points.`
        : 'No negative parallelism patterns detected.',
    evidence,
  };
}

/**
 * C. Outline-Style Conclusions Detector
 * Detects formulaic structures resembling "Despite [challenges], [subject] offers [benefits/opportunities]."
 */
export function detectOutlineConclusions(text: string, maxCap: number = 10): DetectorResult {
  const evidence: DetectedEvidence[] = [];

  const patterns = [
    /\b(?:despite|in spite of)\s+([^,.;]{3,50}),\s+([^,.;]{2,30})\s+(?:offers?|provides?|presents?|holds?|remains?|serves?)\b/gi,
    /\bwhile\s+([^,.;]{3,50})\s+(?:challenges?|hurdles?|obstacles?|concerns?|drawbacks?)\s+remain[s]?,\s+([^,.;]{2,30})\s+(?:offers?|provides?|presents?|heralds?)\b/gi,
    /\bin\s+conclusion,\s+(?:while|although)\s+([^,.;]{3,50}),\s+([^,.;]{2,30})\b/gi,
    /\bultimately,\s+(?:while|despite)\s+([^,.;]{3,50}),\s+([^,.;]{2,30})\b/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;

      evidence.push({
        id: `conclusion-structure-${startIndex}`,
        detectorId: 'outline_conclusions',
        category: 'Outline-Style Conclusion',
        matchedText,
        startIndex,
        endIndex,
        explanation: `Formulaic outline conclusion ("Despite [X], [Y] offers [Z]"): "${matchedText}".`,
        scoreWeight: 5,
      });
    }
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 5;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'outline_conclusions',
    name: 'Outline-Style Conclusions',
    category: 'Outline Conclusions',
    group: 'structural',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Found ${occurrences} formulaic conclusion pattern(s), contributing ${cappedScore}/${maxCap} points.`
        : 'No outline-style formulaic conclusion patterns detected.',
    evidence,
  };
}

/**
 * D. False Ranges Detector
 * Detects "from X to Y" constructions spanning disparate or non-comparable concepts.
 * Conservative heuristic labeled as an estimate.
 */
export function detectFalseRanges(text: string, maxCap: number = 9): DetectorResult {
  const evidence: DetectedEvidence[] = [];
  // Match "from [phrase] to [phrase]" where phrases have descriptive words
  const falseRangePattern = /\bfrom\s+([a-zA-Z\s]{4,35})\s+to\s+([a-zA-Z\s]{4,35})\b/gi;

  let match: RegExpExecArray | null;
  while ((match = falseRangePattern.exec(text)) !== null) {
    const matchedText = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + matchedText.length;
    const fromPart = match[1].trim().toLowerCase();
    const toPart = match[2].trim().toLowerCase();

    // Skip numeric or temporal ranges: e.g. "from 1990 to 2020", "from Monday to Friday", "from 1 to 10"
    if (
      /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|am|pm|\d+)\b/i.test(
        matchedText
      )
    ) {
      continue;
    }

    // Heuristic: Check if endpoints cross between mundane/technical and grand/abstract domains
    const abstractKeywords = /\b(human|future|society|creativity|life|destiny|potential|fabric|universe|thought|horizons?|essence|world)\b/;
    const operationalKeywords = /\b(optimizing|code|data|workflows?|routine|tasks?|daily|processes?|automation|algorithms?)\b/;

    const isDomainCross =
      (operationalKeywords.test(fromPart) && abstractKeywords.test(toPart)) ||
      (abstractKeywords.test(fromPart) && operationalKeywords.test(toPart)) ||
      (fromPart.split(' ').length >= 2 && toPart.split(' ').length >= 2 && !fromPart.includes(toPart));

    if (isDomainCross) {
      evidence.push({
        id: `false-range-${startIndex}`,
        detectorId: 'false_ranges',
        category: 'False Ranges',
        matchedText,
        startIndex,
        endIndex,
        explanation: `Heuristic false-range sweep ("from ${fromPart} to ${toPart}") spanning disparate thematic poles. (Conservative heuristic estimate).`,
        scoreWeight: 3,
      });
    }
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 3;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'false_ranges',
    name: 'False Ranges (Heuristic)',
    category: 'False Ranges',
    group: 'structural',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Identified ${occurrences} expansive "from X to Y" false range sweep(s), contributing ${cappedScore}/${maxCap} points.`
        : 'No disparate false range sweeps detected.',
    evidence,
  };
}
