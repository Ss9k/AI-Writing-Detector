import { DetectorResult, DetectedEvidence } from '../types/detector.ts';

/**
 * Check if the text surrounding an attribution contains concrete citation markers
 * (e.g., specific author names, "et al.", year like "2024", or recognized journals/institutes).
 */
export function hasConcreteCitationContext(text: string, matchIndex: number, matchLength: number): boolean {
  // Inspect a context window around the match (up to 120 chars before and after)
  const start = Math.max(0, matchIndex - 120);
  const end = Math.min(text.length, matchIndex + matchLength + 120);
  const windowText = text.slice(start, end);

  // Citation indicators:
  // 1. Year: (2024), in 2023, 1998
  const hasYear = /\b(?:in\s+)?\(?(?:19|20)\d{2}\)?\b/.test(windowText);
  // 2. Author markers: "et al.", "by Dr. Smith", "by Smith and Jones", "Prof. Doe"
  const hasAuthor = /\b(?:et\s+al\.?|Dr\.\s+[A-Z][a-z]+|Prof\.\s+[A-Z][a-z]+|by\s+[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)\b/.test(
    windowText
  );
  // 3. Named journal / institution / publication
  const hasPublication = /\b(?:Nature|Science|Lancet|Cell|Journal|University|Institute|Association|Dept|Department|Press|Review)\b/i.test(
    windowText
  );

  return (hasYear && hasAuthor) || (hasYear && hasPublication) || /et\s+al\./i.test(windowText);
}

/**
 * A. Vague Attributions Detector
 * Detects phrases like "experts agree", "studies show", "research indicates",
 * while deliberately exempting concrete citations.
 */
export function detectVagueAttributions(text: string, maxCap: number = 12): DetectorResult {
  const evidence: DetectedEvidence[] = [];

  const vagueAttributionPatterns = [
    /\b(?:experts?|specialists?)\s+(?:agree|suggest|claim|point\s+out|argue|note|believe|state)\b/gi,
    /\b(?:studies?|surveys?)\s+(?:show|suggest|indicate|reveal|demonstrate|prove|find)\b/gi,
    /\bresearch\s+(?:shows?|indicates?|suggests?|reveals?|points?\s+to)\b/gi,
    /\bindustry\s+(?:insiders?|observers?|leaders?|analysts?)\s+(?:report|claim|predict|note|say)\b/gi,
    /\b(?:many|numerous)\s+(?:experts?|scholars?|critics?|analysts?)\s+(?:agree|argue|believe|point\s+out)\b/gi,
    /\b(?:observers?|commentators?)\s+(?:have\s+noted|note|observe)\b/gi,
    /\bit\s+is\s+(?:widely\s+)?believed\s+that\b/gi,
  ];

  for (const pattern of vagueAttributionPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;

      // Check for concrete citation exemption
      if (hasConcreteCitationContext(text, startIndex, matchedText.length)) {
        continue;
      }

      evidence.push({
        id: `vague-attr-${startIndex}`,
        detectorId: 'vague_attributions',
        category: 'Vague Attribution',
        matchedText,
        startIndex,
        endIndex,
        explanation: `Unnamed authority or phantom citation: "${matchedText}". References general authority without a verifiable source or publication.`,
        scoreWeight: 3,
      });
    }
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 3;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'vague_attributions',
    name: 'Vague Attributions',
    category: 'Vague Attribution',
    group: 'vague_language',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Identified ${occurrences} vague authority/attribution claim(s) lacking concrete citations, contributing ${cappedScore}/${maxCap} points.`
        : 'No vague or unnamed attributions detected.',
    evidence,
  };
}

/**
 * B. Superficial Analysis Detector
 * Detects placeholder transitions like "it is worth noting", "significant developments", "one could argue", etc.
 */
export function detectSuperficialAnalysis(text: string, maxCap: number = 9): DetectorResult {
  const evidence: DetectedEvidence[] = [];

  const superficialPatterns = [
    /\bit\s+is\s+(?:worth|worthy\s+of)\s+not(?:ing|e)\b/gi,
    /\bsignificant\s+developments?\b/gi,
    /\bone\s+could\s+(?:argue|say|contend)\b/gi,
    /\bvarious\s+sources\s+indicate\b/gi,
    /\bit\s+is\s+important\s+to\s+(?:remember|note|recognize|keep\s+in\s+mind)\b/gi,
    /\ba\s+closer\s+(?:look|examination|inspection)\s+reveals\b/gi,
    /\bit\s+should\s+be\s+(?:noted|emphasized|highlighted)\s+that\b/gi,
    /\bit\s+remains\s+to\s+be\s+seen\b/gi,
  ];

  for (const pattern of superficialPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;

      evidence.push({
        id: `superficial-${startIndex}`,
        detectorId: 'superficial_analysis',
        category: 'Superficial Analysis',
        matchedText,
        startIndex,
        endIndex,
        explanation: `Superficial meta-commentary: "${matchedText}". Serves as formulaic filler common in machine-generated expositions.`,
        scoreWeight: 3,
      });
    }
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 3;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'superficial_analysis',
    name: 'Superficial Analysis Fillers',
    category: 'Superficial Analysis',
    group: 'vague_language',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Identified ${occurrences} superficial meta-analytical filler phrase(s), contributing ${cappedScore}/${maxCap} points.`
        : 'No superficial analytical filler patterns detected.',
    evidence,
  };
}

/**
 * C. Overgeneralisation Detector
 * Detects absolutist framing like "everyone knows", "it is well established", "universal consensus".
 */
export function detectOvergeneralisation(text: string, maxCap: number = 9): DetectorResult {
  const evidence: DetectedEvidence[] = [];

  const generalisationPatterns = [
    /\beveryone\s+knows\b/gi,
    /\bit\s+is\s+well\s+established\b/gi,
    /\buniversal\s+consensus\b/gi,
    /\bwidely\s+recognized\b/gi,
    /\bundeniable\s+fact\b/gi,
    /\bwithout\s+(?:a\s+)?doubt\b/gi,
    /\bcommon\s+knowledge\b/gi,
    /\bit\s+goes\s+without\s+saying\b/gi,
  ];

  for (const pattern of generalisationPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;

      evidence.push({
        id: `overgeneralisation-${startIndex}`,
        detectorId: 'overgeneralisation',
        category: 'Overgeneralisation',
        matchedText,
        startIndex,
        endIndex,
        explanation: `Unwarranted consensus or absolutist claim: "${matchedText}".`,
        scoreWeight: 3,
      });
    }
  }

  const occurrences = evidence.length;
  const rawScore = occurrences * 3;
  const cappedScore = Math.min(rawScore, maxCap);

  return {
    detectorId: 'overgeneralisation',
    name: 'Overgeneralisation',
    category: 'Overgeneralisation',
    group: 'vague_language',
    detected: occurrences > 0,
    occurrences,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      occurrences > 0
        ? `Found ${occurrences} overgeneralising or absolutist assertion(s), contributing ${cappedScore}/${maxCap} points.`
        : 'No excessive overgeneralisation patterns detected.',
    evidence,
  };
}
