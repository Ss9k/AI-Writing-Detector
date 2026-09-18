import { DetectorResult, DetectedEvidence } from '../types/detector.ts';

/**
 * A. Undue Emphasis Detector
 * Detects excessive superlatives, intense adverbs, and emphatic repeated punctuation.
 */
export function detectUndueEmphasis(text: string, maxCap: number = 10): DetectorResult {
  const evidence: DetectedEvidence[] = [];

  const intensifierWords = [
    'tremendous',
    'remarkable',
    'remarkably',
    'groundbreaking',
    'absolutely',
    'incredible',
    'incredibly',
    'extremely',
    'unprecedented',
    'staggering',
    'astounding',
    'breathtaking',
    'profoundly',
    'immensely',
    'extraordinary',
    'monumental',
  ];

  // Match words with word boundaries
  for (const word of intensifierWords) {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;

      evidence.push({
        id: `intensifier-${word}-${startIndex}`,
        detectorId: 'undue_emphasis',
        category: 'Undue Emphasis',
        matchedText,
        startIndex,
        endIndex,
        explanation: `Hyperbolic intensifier / superlative: "${matchedText}". Uncalibrated high-intensity modifiers are frequent in synthetic copy.`,
        scoreWeight: 2,
      });
    }
  }

  // Emphatic punctuation: !!, !?, ?!, ???
  const punctuationPattern = /(?:!{2,}|\?{2,}|!\?|\?!)/g;
  let puncMatch: RegExpExecArray | null;
  while ((puncMatch = punctuationPattern.exec(text)) !== null) {
    const matchedText = puncMatch[0];
    const startIndex = puncMatch.index;
    const endIndex = startIndex + matchedText.length;

    evidence.push({
      id: `emphatic-punc-${startIndex}`,
      detectorId: 'undue_emphasis',
      category: 'Undue Emphasis',
      matchedText,
      startIndex,
      endIndex,
      explanation: `Emphatic repeated punctuation: "${matchedText}". Often signals unmoderated enthusiasm or marketing tone.`,
      scoreWeight: 2,
    });
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 2;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'undue_emphasis',
    name: 'Undue Emphasis & Intensifiers',
    category: 'Undue Emphasis',
    group: 'promotional',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Detected ${occurrences} instance(s) of hyperbolic emphasis or expressive punctuation, contributing ${cappedScore}/${maxCap} points.`
        : 'No undue emphasis or exaggerated intensifiers detected.',
    evidence,
  };
}

/**
 * B. Promotional Language Detector
 * Detects marketing buzzwords and synthetic hype terminology.
 */
export const DEFAULT_PROMOTIONAL_TERMS = [
  'game-changer',
  'game changer',
  'revolutionary',
  'impressive features',
  'transformative potential',
  'paradigm shift',
  'cutting-edge',
  'cutting edge',
  'next-generation',
  'next generation',
  'state-of-the-art',
  'state of the art',
  'unlock new possibilities',
  'unparalleled',
  'skyrocket',
  'take it to the next level',
  'poised to revolutionize',
];

export function detectPromotionalLanguage(
  text: string,
  terms: string[] = DEFAULT_PROMOTIONAL_TERMS,
  maxCap: number = 12
): DetectorResult {
  const evidence: DetectedEvidence[] = [];

  for (const term of terms) {
    // Escape special regex characters in term
    const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;

      evidence.push({
        id: `promotional-${startIndex}`,
        detectorId: 'promotional_language',
        category: 'Promotional Language',
        matchedText,
        startIndex,
        endIndex,
        explanation: `Promotional or marketing hype phrase: "${matchedText}".`,
        scoreWeight: 3,
      });
    }
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 3;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'promotional_language',
    name: 'Promotional Buzzwords',
    category: 'Promotional Language',
    group: 'promotional',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Identified ${occurrences} promotional hype term(s), contributing ${cappedScore}/${maxCap} points.`
        : 'No promotional or marketing buzzwords detected.',
    evidence,
  };
}

/**
 * C. Elegant Variation Detector
 * Heuristic detector for rotating synonym chains for the same entity class across proximate text.
 * Avoids claiming certainty; explicitly marked as a heuristic indicator.
 */
interface SynonymGroup {
  name: string;
  terms: string[];
}

const SYNONYM_CLUSTERS: SynonymGroup[] = [
  {
    name: 'Corporate Entity',
    terms: ['company', 'organisation', 'organization', 'firm', 'enterprise', 'corporation', 'business'],
  },
  {
    name: 'System / Tool',
    terms: ['platform', 'system', 'solution', 'tool', 'framework', 'mechanism', 'infrastructure'],
  },
  {
    name: 'Individual / User',
    terms: ['individual', 'user', 'customer', 'client', 'consumer', 'person', 'stakeholder'],
  },
  {
    name: 'Field / Sector',
    terms: ['field', 'sector', 'industry', 'domain', 'arena', 'landscape', 'space'],
  },
];

export function detectElegantVariation(text: string, maxCap: number = 8): DetectorResult {
  const evidence: DetectedEvidence[] = [];
  const lowerText = text.toLowerCase();

  for (const cluster of SYNONYM_CLUSTERS) {
    const foundTerms: { term: string; index: number; length: number }[] = [];

    for (const term of cluster.terms) {
      const pattern = new RegExp(`\\b${term}s?\\b`, 'gi');
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        foundTerms.push({
          term,
          index: match.index,
          length: match[0].length,
        });
      }
    }

    // Sort by position in text
    foundTerms.sort((a, b) => a.index - b.index);

    // If 3 or more distinct synonyms from the same entity cluster are used across the text
    const uniqueSynonyms = Array.from(new Set(foundTerms.map((t) => t.term)));
    if (uniqueSynonyms.length >= 3) {
      // Mark the earliest occurrences
      const sampleOccurrences = foundTerms.slice(0, 3);
      for (const occ of sampleOccurrences) {
        evidence.push({
          id: `elegant-var-${occ.index}`,
          detectorId: 'elegant_variation',
          category: 'Elegant Variation',
          matchedText: text.substring(occ.index, occ.index + occ.length),
          startIndex: occ.index,
          endIndex: occ.index + occ.length,
          explanation: `Heuristic elegant variation: synonym rotation in cluster "${cluster.name}" (${uniqueSynonyms.join(', ')}). High variation rate often reflects avoidance of word repetition by LLMs.`,
          scoreWeight: 2,
        });
      }
    }
  }

  const occurrences = evidence.length > 0 ? Math.floor(evidence.length / 3) : 0;
  const rawScore = occurrences * 4;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'elegant_variation',
    name: 'Elegant Variation (Heuristic)',
    category: 'Elegant Variation',
    group: 'promotional',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Identified ${occurrences} cluster(s) of rotational entity synonym substitutions, contributing ${cappedScore}/${maxCap} points. (Heuristic indicator).`
        : 'No noticeable elegant variation synonym hopping detected.',
    evidence,
  };
}
