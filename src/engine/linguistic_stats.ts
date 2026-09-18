import { extractWords, extractSentences } from './statistics.ts';
import { LinguisticFactor, DetectorResult, DetectedEvidence } from '../types/detector.ts';

/**
 * Count syllables in an English word using phonetic heuristics.
 */
export function countWordSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;

  // Replace common endings that don't add syllables
  const cleaned = w
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');

  const vowelMatches = cleaned.match(/[aeiouy]{1,2}/g);
  return vowelMatches ? Math.max(1, vowelMatches.length) : 1;
}

/**
 * Common English transition words and discourse markers.
 */
export const DISCOURSE_TRANSITIONS = [
  'furthermore',
  'moreover',
  'consequently',
  'additionally',
  'in addition',
  'subsequently',
  'nevertheless',
  'nonetheless',
  'on the other hand',
  'hence',
  'therefore',
  'thus',
  'in contrast',
  'conversely',
  'as a result',
  'to illustrate',
  'for instance',
  'in summary',
  'in conclusion',
];

/**
 * Common English top words for rare word estimation.
 */
const COMMON_WORDS_SET = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','say','her','she',
  'or','an','will','my','one','all','would','there','their','what','so','up','out','if',
  'about','who','get','which','go','me','when','make','can','like','time','no','just','him',
  'know','take','people','into','year','your','good','some','could','them','see','other','than',
  'then','now','look','only','come','its','over','think','also','back','after','use','two','how',
  'our','work','first','well','way','even','new','want','because','any','these','give','day','most',
  'us','is','are','was','were','been','has','had','did','does','done','having','said','saying',
  'system','world','problem','life','state','child','group','number','night','part','place','case',
  'point','government','company','number','group','hand','part','problem','school','small','large',
  'next','early','young','important','few','public','bad','same','able','human','fact','idea',
  'right','left','long','big','high','old','great','best','better','very','much','little','far',
  'often','always','today','last','never','under','between','through','during','before','since',
  'around','both','each','few','more','most','other','same','such','than','too','very'
]);

export interface StatisticalAnalysisResult {
  factors: LinguisticFactor[];
  detectorResult: DetectorResult;
}

export function analyzeLinguisticStatistics(text: string, maxCap: number = 18): StatisticalAnalysisResult {
  const words = extractWords(text);
  const sentences = extractSentences(text);
  const totalWords = words.length;
  const totalSentences = sentences.length;
  const factors: LinguisticFactor[] = [];
  const evidence: DetectedEvidence[] = [];
  let rawScore = 0;

  // A. Lexical Diversity (Type-Token Ratio)
  if (totalWords < 30) {
    factors.push({
      id: 'ttr',
      name: 'Lexical Diversity (Type-Token Ratio)',
      measuredValue: 'Insufficient text (<30 words)',
      scoreContribution: 0,
      signalStrength: 'Neutral',
      isInsufficientData: true,
      explanation: 'Short texts produce misleading TTR. At least 30 words are needed for meaningful measurement.',
      interpretation: 'Insufficient data for lexical diversity calculation.',
    });
  } else {
    const lowerWords = words.map((w) => w.toLowerCase());
    const uniqueWords = new Set(lowerWords).size;
    const ttr = uniqueWords / totalWords;
    const ttrPercent = (ttr * 100).toFixed(1);

    let ttrScore = 0;
    let signal: 'Low' | 'Moderate' | 'High' | 'Neutral' = 'Neutral';
    let interp = 'Balanced vocabulary variety.';

    // Very low TTR or abnormally uniform mid-high range
    if (ttr < 0.42) {
      ttrScore = 3;
      signal = 'Moderate';
      interp = 'Low lexical variety (repetitive word usage).';
    } else if (ttr > 0.78 && totalWords > 80) {
      ttrScore = 2;
      signal = 'Low';
      interp = 'Unusually high lexical variation across long passage.';
    }

    rawScore += ttrScore;
    factors.push({
      id: 'ttr',
      name: 'Lexical Diversity (Type-Token Ratio)',
      measuredValue: `${ttr.toFixed(3)} (${ttrPercent}%)`,
      numericValue: ttr,
      scoreContribution: ttrScore,
      signalStrength: signal,
      explanation: `Type-token ratio of unique terms (${uniqueWords}) over total words (${totalWords}).`,
      interpretation: interp,
    });
  }

  // B. Sentence Length Variation & Coefficient of Variation (CV)
  if (totalSentences < 3) {
    factors.push({
      id: 'sentence_cv',
      name: 'Sentence Length Variation (Burstiness)',
      measuredValue: 'Insufficient text (<3 sentences)',
      scoreContribution: 0,
      signalStrength: 'Neutral',
      isInsufficientData: true,
      explanation: 'At least 3 sentences are required to evaluate sentence length dispersion.',
      interpretation: 'Insufficient data to compute coefficient of variation.',
    });
  } else {
    const sentenceLengths = sentences.map((s) => extractWords(s).length);
    const mean = sentenceLengths.reduce((acc, len) => acc + len, 0) / totalSentences;
    const variance =
      sentenceLengths.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) / (totalSentences > 1 ? totalSentences - 1 : 1);
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    let cvScore = 0;
    let signal: 'Low' | 'Moderate' | 'High' | 'Neutral' = 'Neutral';
    let interp = 'Natural human rhythmic variation in sentence cadence.';

    if (cv < 0.35 && totalSentences >= 4) {
      cvScore = 6;
      signal = 'High';
      interp = 'Low sentence variation (CV < 0.35); sentences exhibit unusually uniform rhythm.';
    } else if (cv < 0.45 && totalSentences >= 4) {
      cvScore = 3;
      signal = 'Moderate';
      interp = 'Moderate uniformity in sentence structure.';
    }

    rawScore += cvScore;
    factors.push({
      id: 'sentence_cv',
      name: 'Sentence Length Variation (CV)',
      measuredValue: `CV: ${cv.toFixed(2)} (Mean: ${mean.toFixed(1)} wps, SD: ${stdDev.toFixed(1)})`,
      numericValue: cv,
      scoreContribution: cvScore,
      signalStrength: signal,
      explanation: 'Coefficient of variation (CV = SD / Mean). Lower values indicate uniform, unvarying sentence lengths.',
      interpretation: interp,
    });
  }

  // C. Passive Voice Frequency
  const passiveSentenceIndices: number[] = [];
  const passivePattern = /\b(?:is|are|was|were|been|being|be)\s+([a-z]+ed|[a-z]+en|done|made|seen|found|given|known|taken|written|built|brought)\b/i;

  sentences.forEach((s, idx) => {
    if (passivePattern.test(s)) {
      passiveSentenceIndices.push(idx);
    }
  });

  const passivePct = totalSentences > 0 ? (passiveSentenceIndices.length / totalSentences) * 100 : 0;
  let passiveScore = 0;
  let passiveSignal: 'Low' | 'Moderate' | 'High' | 'Neutral' = 'Neutral';

  if (passivePct > 35 && totalSentences >= 3) {
    passiveScore = 4;
    passiveSignal = 'Moderate';
  }

  rawScore += passiveScore;
  factors.push({
    id: 'passive_voice',
    name: 'Passive Voice Frequency',
    measuredValue: `${passivePct.toFixed(1)}% (${passiveSentenceIndices.length}/${totalSentences} sentences)`,
    numericValue: passivePct,
    scoreContribution: passiveScore,
    signalStrength: passiveSignal,
    explanation: 'Estimated percentage of sentences utilizing passive construction ("to be" + past participle).',
    interpretation: passivePct > 35 ? 'Elevated passive voice density.' : 'Typical active voice balance.',
  });

  // D. Transition Word Density
  const transitionSentenceIndices: number[] = [];
  const transitionFoundList: string[] = [];

  sentences.forEach((s, idx) => {
    let hasTransition = false;
    for (const marker of DISCOURSE_TRANSITIONS) {
      const pattern = new RegExp(`\\b${marker}\\b`, 'i');
      if (pattern.test(s)) {
        hasTransition = true;
        if (!transitionFoundList.includes(marker)) {
          transitionFoundList.push(marker);
        }
      }
    }
    if (hasTransition) {
      transitionSentenceIndices.push(idx);
    }
  });

  const transitionPct = totalSentences > 0 ? (transitionSentenceIndices.length / totalSentences) * 100 : 0;
  let transitionScore = 0;
  let transitionSignal: 'Low' | 'Moderate' | 'High' | 'Neutral' = 'Neutral';

  if (transitionPct > 35 && totalSentences >= 3) {
    transitionScore = 4;
    transitionSignal = 'High';
  } else if (transitionPct > 25 && totalSentences >= 3) {
    transitionScore = 2;
    transitionSignal = 'Moderate';
  }

  rawScore += transitionScore;
  factors.push({
    id: 'transition_words',
    name: 'Transition Word Density',
    measuredValue: `${transitionPct.toFixed(1)}% (${transitionSentenceIndices.length}/${totalSentences} sentences)`,
    numericValue: transitionPct,
    scoreContribution: transitionScore,
    signalStrength: transitionSignal,
    explanation: 'Frequency of formal discourse markers (furthermore, moreover, consequently, etc.).',
    interpretation:
      transitionPct > 35
        ? 'High concentration of formal transitions linking consecutive thoughts.'
        : 'Natural discourse transition frequency.',
  });

  // E. Flesch-Kincaid Grade Level
  if (totalWords < 30 || totalSentences === 0) {
    factors.push({
      id: 'flesch_kincaid',
      name: 'Flesch-Kincaid Grade Level',
      measuredValue: 'Insufficient text (<30 words)',
      scoreContribution: 0,
      signalStrength: 'Neutral',
      isInsufficientData: true,
      explanation: 'At least 30 words required for reliable syllable-based readability grading.',
      interpretation: 'Readability score requires more sample text.',
    });
  } else {
    const totalSyllables = words.reduce((acc, w) => acc + countWordSyllables(w), 0);
    const fkGrade = 0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;
    const clampedGrade = Math.max(1, Math.min(20, Number(fkGrade.toFixed(1))));

    factors.push({
      id: 'flesch_kincaid',
      name: 'Flesch-Kincaid Grade Level',
      measuredValue: `Grade ${clampedGrade} (${clampedGrade >= 13 ? 'College/Professional' : clampedGrade >= 9 ? 'High School' : 'Middle School'})`,
      numericValue: clampedGrade,
      scoreContribution: 0, // Informational, does not penalize human academic texts
      signalStrength: 'Neutral',
      explanation: 'Readability index computed from syllables per word and words per sentence.',
      interpretation: `Estimated reading comprehension level: Grade ${clampedGrade}.`,
    });
  }

  // F. Punctuation Patterns
  const semicolons = (text.match(/;/g) || []).length;
  const emDashes = (text.match(/—|--/g) || []).length;
  const colons = (text.match(/(?<!https?):/g) || []).length;
  const ellipses = (text.match(/\.{3,}|…/g) || []).length;
  const punctuationTotal = semicolons + emDashes + colons + ellipses;

  const punctuationDensity = totalWords > 0 ? ((punctuationTotal / totalWords) * 100).toFixed(1) : '0.0';
  factors.push({
    id: 'punctuation_patterns',
    name: 'Stylistic Punctuation Patterns',
    measuredValue: `${punctuationTotal} marks (${punctuationDensity} per 100 words)`,
    numericValue: punctuationTotal,
    scoreContribution: 0,
    signalStrength: 'Neutral',
    explanation: `Semicolons: ${semicolons}, Em-dashes: ${emDashes}, Colons: ${colons}, Ellipses: ${ellipses}.`,
    interpretation: 'Punctuation distribution across clauses.',
  });

  // G. Rare Word Usage (Heuristic Estimate)
  if (totalWords >= 25) {
    const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')).filter((w) => w.length > 2);
    const uncommonCount = lowerWords.filter((w) => !COMMON_WORDS_SET.has(w)).length;
    const uncommonPct = lowerWords.length > 0 ? (uncommonCount / lowerWords.length) * 100 : 0;

    factors.push({
      id: 'rare_words',
      name: 'Uncommon Word Ratio (Heuristic Estimate)',
      measuredValue: `${uncommonPct.toFixed(1)}% uncommon vocabulary`,
      numericValue: uncommonPct,
      scoreContribution: 0,
      signalStrength: 'Neutral',
      explanation: 'Calculated against an algorithmic benchmark of fundamental English vocabulary.',
      interpretation: 'Stylometric vocabulary richness estimate.',
    });
  }

  const cappedScore = Math.min(rawScore, maxCap);

  const detectorResult: DetectorResult = {
    detectorId: 'statistical_metrics',
    name: 'Statistical & Linguistic Metrics',
    category: 'Statistical Stylometrics',
    group: 'statistical',
    detected: rawScore > 0,
    occurrences: factors.filter((f) => f.scoreContribution > 0).length,
    rawScore,
    cappedScore,
    maxCap,
    explanation:
      rawScore > 0
        ? `Statistical stylometrics (sentence CV, passive voice, transition density) contributed ${cappedScore}/${maxCap} points.`
        : 'Statistical stylometrics (sentence variation and transitions) fall within typical ranges.',
    evidence,
  };

  return {
    factors,
    detectorResult,
  };
}
