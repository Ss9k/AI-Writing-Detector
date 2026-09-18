import { DetectorResult, DetectedEvidence } from '../types/detector.ts';

export interface VocabularyRule {
  term: string;
  pattern: RegExp;
  category: string;
  weight: number;
}

export const DEFAULT_AI_VOCABULARY_RULES: VocabularyRule[] = [
  { term: 'delve into', pattern: /\bdelv(?:e|es|ed|ing)\s+into\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'navigate', pattern: /\bnavigat(?:e|es|ed|ing)\s+(?:the|complex|challenges|landscape|intricacies|waters|realities)\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'robust', pattern: /\brobust(?:ly|ness)?\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'innovative solutions', pattern: /\binnovative\s+solutions?\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'transformative', pattern: /\btransformat(?:ive|ion)\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'leverage', pattern: /\bleverag(?:e|es|ed|ing)\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'streamline', pattern: /\bstreamlin(?:e|es|ed|ing)\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'ecosystem', pattern: /\becosystems?\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'tapestry', pattern: /\b(?:rich\s+)?tapestry\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'pivotal', pattern: /\bpivotal(?:\s+role)?\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'multifaceted', pattern: /\bmultifaceted\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'testament', pattern: /\btestament\s+to\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'beacon', pattern: /\bbeacon\s+(?:of|for)\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'realm', pattern: /\b(?:in\s+the\s+)?realm\s+of\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'paramount', pattern: /\b(?:of\s+)?paramount(?:\s+importance)?\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'underscore', pattern: /\bunderscor(?:e|es|ed|ing)\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'foster', pattern: /\bfoster(?:s|ed|ing)?\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'harness', pattern: /\bharness(?:es|ed|ing)?\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'seamless', pattern: /\bseamless(?:ly)?\b/gi, category: 'AI Vocabulary', weight: 3 },
  { term: 'align with', pattern: /\balign(?:s|ed|ing)?\s+with\b/gi, category: 'AI Vocabulary', weight: 3 },
];

export const VOCABULARY_MAX_CAP = 15;

/**
 * Detect AI-Signature Vocabulary terms and phrases.
 */
export function detectVocabulary(
  text: string,
  rules: VocabularyRule[] = DEFAULT_AI_VOCABULARY_RULES,
  maxCap: number = VOCABULARY_MAX_CAP
): DetectorResult {
  const detectedTermsSet = new Set<string>();
  const evidence: DetectedEvidence[] = [];
  let rawScore = 0;

  for (const rule of rules) {
    // Reset regex index
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    let matchedInRule = false;

    while ((match = rule.pattern.exec(text)) !== null) {
      matchedInRule = true;
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;

      evidence.push({
        id: `vocab-${rule.term.replace(/\s+/g, '-')}-${startIndex}`,
        detectorId: 'ai_vocabulary',
        category: 'AI Vocabulary',
        matchedText,
        startIndex,
        endIndex,
        explanation: `Commonly overused AI buzzword or phrase: "${rule.term}".`,
        scoreWeight: rule.weight,
      });

      // Avoid infinite loops on 0-length matches
      if (rule.pattern.lastIndex === startIndex) {
        rule.pattern.lastIndex++;
      }
    }

    if (matchedInRule) {
      detectedTermsSet.add(rule.term);
      rawScore += rule.weight;
    }
  }

  const detectedTerms = Array.from(detectedTermsSet);
  const occurrences = evidence.length;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'ai_vocabulary',
    name: 'AI-Signature Vocabulary',
    category: 'AI Vocabulary',
    group: 'vocabulary',
    detected: occurrences > 0,
    occurrences,
    detectedTerms,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Identified ${detectedTerms.length} distinct AI-associated terms (${occurrences} total occurrences), contributing ${cappedScore}/${maxCap} points.`
        : 'No prominent AI-associated signature vocabulary patterns detected.',
    evidence,
  };
}
