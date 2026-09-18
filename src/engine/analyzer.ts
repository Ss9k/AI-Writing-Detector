import { calculateStatistics } from './statistics.ts';
import { detectVocabulary } from './vocabulary.ts';
import {
  detectRuleOfThree,
  detectNegativeParallelism,
  detectOutlineConclusions,
  detectFalseRanges,
} from './structural.ts';
import {
  detectVagueAttributions,
  detectSuperficialAnalysis,
  detectOvergeneralisation,
} from './vague_language.ts';
import {
  detectUndueEmphasis,
  detectPromotionalLanguage,
  detectElegantVariation,
} from './promotional.ts';
import { analyzeLinguisticStatistics } from './linguistic_stats.ts';
import { aggregateScores } from './scoring.ts';
import {
  AnalysisReport,
  DetectedEvidence,
  DetectorResult,
} from '../types/detector.ts';

export const SCIENTIFIC_DISCLAIMER =
  'This application uses deterministic heuristic pattern matching and statistical stylometry. It evaluates linguistic markers frequently observed in machine-generated prose (such as uniform sentence cadence, formulaic rhetorical structures, and high-frequency AI vocabulary). It is NOT proof of authorship. Human writing can trigger these markers, and AI writing can intentionally avoid them.';

/**
 * Filter and resolve overlapping evidence spans so text highlighting is clean and deterministic.
 */
export function resolveEvidenceOverlaps(evidenceList: DetectedEvidence[]): DetectedEvidence[] {
  if (evidenceList.length === 0) return [];

  // Sort by start index ascending, then by scoreWeight descending
  const sorted = [...evidenceList].sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return b.scoreWeight - a.scoreWeight;
  });

  const resolved: DetectedEvidence[] = [];
  let currentEnd = -1;

  for (const item of sorted) {
    if (item.startIndex >= currentEnd) {
      resolved.push(item);
      currentEnd = item.endIndex;
    }
  }

  return resolved;
}

/**
 * Analyze an arbitrary piece of text and generate a comprehensive detection report.
 */
export function analyzeText(text: string): AnalysisReport {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('Input text cannot be empty. Please provide valid text for analysis.');
  }

  // 1. Basic Text Statistics
  const statistics = calculateStatistics(text);

  // 2. AI-Signature Vocabulary
  const vocabResult = detectVocabulary(text);

  // 3. Structural Patterns
  const ruleOfThreeResult = detectRuleOfThree(text);
  const negParallelResult = detectNegativeParallelism(text);
  const outlineConclusionResult = detectOutlineConclusions(text);
  const falseRangesResult = detectFalseRanges(text);

  // 4. Vague / Unspecific Language
  const vagueAttrResult = detectVagueAttributions(text);
  const superficialResult = detectSuperficialAnalysis(text);
  const overgenResult = detectOvergeneralisation(text);

  // 5. Emphasis & Promotional Language
  const undueEmphasisResult = detectUndueEmphasis(text);
  const promotionalResult = detectPromotionalLanguage(text);
  const elegantVarResult = detectElegantVariation(text);

  // 6. Statistical / Linguistic Stylometrics
  const { factors, detectorResult: statisticalResult } = analyzeLinguisticStatistics(text);

  // Collect all detector results
  const detectors: DetectorResult[] = [
    vocabResult,
    ruleOfThreeResult,
    negParallelResult,
    outlineConclusionResult,
    falseRangesResult,
    vagueAttrResult,
    superficialResult,
    overgenResult,
    undueEmphasisResult,
    promotionalResult,
    elegantVarResult,
    statisticalResult,
  ];

  // Aggregate scores and categories
  const { finalScore, rawScoreTotal, classification, categorySummaries } = aggregateScores(detectors);

  // Collect all raw evidence from all detectors and resolve overlaps
  const allEvidence: DetectedEvidence[] = [];
  for (const d of detectors) {
    allEvidence.push(...d.evidence);
  }

  const resolvedEvidence = resolveEvidenceOverlaps(allEvidence);

  return {
    score: finalScore,
    rawScore: rawScoreTotal,
    classification,
    timestamp: new Date().toISOString(),
    statistics,
    linguisticFactors: factors,
    detectors,
    categorySummaries,
    evidence: resolvedEvidence,
    disclaimer: SCIENTIFIC_DISCLAIMER,
  };
}

/**
 * Built-in Sample Datasets for testing and demonstrations.
 */
export const SAMPLE_TEXTS = {
  human: {
    title: 'Human-Authored Sample (Personal & Asymmetric)',
    description:
      'A naturally written reflection with irregular sentence rhythms, conversational cadence, personal context, and concrete details.',
    text: `Last Tuesday, my ancient espresso machine gave up the ghost with a sputtering hiss that sounded suspiciously like a dying radiator. I bought it second-hand off Craigslist six years ago from a grad student in Somerville who swore it had plenty of life left. Turns out he was right for 2,100 mornings, but yesterday morning wasn't one of them. Instead of calling a repair shop or buying some shiny four-hundred-dollar gadget on Amazon, I grabbed a battered French press from the back of the pantry, ground a handful of dark roast beans by hand, and waited four minutes. The coffee wasn't pristine crema or espresso shop perfection. But honestly? Standing by the drafty kitchen window while the neighborhood dog barked at the mail carrier, it hit the spot just fine.`,
  },
  ai: {
    title: 'AI-Style Sample (Formulaic & Promotional)',
    description:
      'Synthetically structured passage with hallmark AI vocabulary, uniform sentence cadence, rule-of-three triplets, vague authority attributions, and promotional buzzwords.',
    text: `In today's fast-paced digital ecosystem, organizations must continually navigate complex technological hurdles to streamline workflows and unlock unprecedented productivity. Delving into the realm of modern digital transformation, studies show that innovative solutions are of paramount importance for forward-thinking enterprises. This transformative approach is not only efficient, scalable, and maintainable, but also empowers teams to leverage cutting-edge tools with remarkable agility. 

Furthermore, industry insiders report that a robust framework serves as a beacon of operational excellence, allowing businesses to foster seamless collaboration across diverse teams. One could argue that it is worth noting the significant developments taking place from routine data entry to the very horizons of strategic human creativity. 

Despite numerous implementation challenges, adopting this revolutionary game-changer offers unmatched competitive advantages for any modern firm. Ultimately, while initial hurdles exist, embracing this multifaceted platform is widely recognized as a pivotal step toward sustainable organizational growth.`,
  },
  historical: {
    title: 'Historical Sample (Lincoln’s Gettysburg Address, 1863)',
    description:
      'A text that demonstrably predates modern LLMs by over a century. Note how formal rhetorical triads and balanced antithesis appear in classic human eloquence.',
    text: `Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.

Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.

But, in a larger sense, we can not dedicate—we can not consecrate—we can not hallow—this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced.`,
  },
};
