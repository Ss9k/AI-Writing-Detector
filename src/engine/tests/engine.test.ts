import { calculateStatistics, extractWords, extractSentences } from '../statistics.ts';
import { detectVocabulary, DEFAULT_AI_VOCABULARY_RULES } from '../vocabulary.ts';
import {
  detectRuleOfThree,
  detectNegativeParallelism,
  detectOutlineConclusions,
  detectFalseRanges,
} from '../structural.ts';
import {
  detectVagueAttributions,
  detectSuperficialAnalysis,
  detectOvergeneralisation,
  hasConcreteCitationContext,
} from '../vague_language.ts';
import {
  detectUndueEmphasis,
  detectPromotionalLanguage,
  detectElegantVariation,
} from '../promotional.ts';
import {
  analyzeLinguisticStatistics,
  countWordSyllables,
} from '../linguistic_stats.ts';
import { classifyScore, aggregateScores } from '../scoring.ts';
import { analyzeText, resolveEvidenceOverlaps, SAMPLE_TEXTS } from '../analyzer.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

console.log('=== RUNNING AI WRITING DETECTOR TEST SUITE ===\n');

// 1. Basic Text Statistics Tests
console.log('--- Test 1: Basic Text Statistics ---');
const sampleText = 'Hello world! This is a test. Dr. Smith agrees.';
const words = extractWords(sampleText);
assert(words.length === 9, 'word counting: correctly identifies 9 words');
assert(extractSentences(sampleText).length === 3, 'sentence detection: protects Dr. abbreviation and yields 3 sentences');

const stats = calculateStatistics('One two three.\n\nFour five six.');
assert(stats.wordCount === 6, 'word count handles newlines and punctuation');
assert(stats.charCount === 30, 'character counting accurate');
assert(stats.paragraphCount === 2, 'paragraph counting identifies 2 paragraphs');
assert(stats.sentenceCount === 2, 'sentence counting identifies 2 sentences');
assert(stats.avgWordLength > 0, 'avg word length computed');
assert(stats.avgSentenceLength === 3, 'avg sentence length computed correctly');

// 2. Vocabulary Detection Tests
console.log('\n--- Test 2: AI Vocabulary Detection ---');
const vocabSample = 'We must delve into the realm of our robust ecosystem to leverage modern tools.';
const vocabResult = detectVocabulary(vocabSample);
assert(vocabResult.detected, 'vocabulary detection triggers on AI terms');
assert(vocabResult.detectedTerms?.includes('delve into') ?? false, 'identifies "delve into"');
assert(vocabResult.detectedTerms?.includes('robust') ?? false, 'identifies "robust"');
assert(vocabResult.detectedTerms?.includes('ecosystem') ?? false, 'identifies "ecosystem"');
assert(vocabResult.detectedTerms?.includes('leverage') ?? false, 'identifies "leverage"');
assert(vocabResult.cappedScore <= vocabResult.maxCap, 'vocabulary score respects maximum cap');

// 3. Structural Patterns Tests
console.log('\n--- Test 3: Structural Pattern Detection ---');
const triadSample = 'This platform is efficient, scalable, and maintainable.';
const ruleOfThree = detectRuleOfThree(triadSample);
assert(ruleOfThree.detected && ruleOfThree.occurrences >= 1, 'rule-of-three detection identifies triads');

const negParallelSample = 'It is not only cost-effective but also remarkably secure.';
const negParallel = detectNegativeParallelism(negParallelSample);
assert(negParallel.detected && negParallel.occurrences === 1, 'negative parallelism detects "not only... but also..."');

const conclusionSample = 'Despite various obstacles, the new system offers substantial performance benefits.';
const conclusion = detectOutlineConclusions(conclusionSample);
assert(conclusion.detected && conclusion.occurrences >= 1, 'outline conclusion detects "Despite X, Y offers Z"');

const falseRangeSample = 'The initiative spans from optimizing routine database queries to the very horizons of human thought.';
const falseRange = detectFalseRanges(falseRangeSample);
assert(falseRange.detected, 'false range heuristic detects broad conceptual sweep');

// 4. Vague Language Tests (with citation check!)
console.log('\n--- Test 4: Vague Language & Citation Disambiguation ---');
const vagueSample = 'Studies show that productivity improves, and experts agree on this topic.';
const vagueResult = detectVagueAttributions(vagueSample);
assert(vagueResult.detected && vagueResult.occurrences === 2, 'vague attribution flags unnamed studies and experts');

const citationSample = 'According to a 2024 study by Smith et al. in Nature, sleep improves memory.';
const citationResult = detectVagueAttributions(citationSample);
assert(citationResult.occurrences === 0, 'vague attribution DOES NOT flag concrete citation (Smith et al., 2024 in Nature)');

const superficialSample = 'It is worth noting that significant developments occurred, and one could argue the outcome.';
const superficialResult = detectSuperficialAnalysis(superficialSample);
assert(superficialResult.occurrences >= 2, 'superficial analysis flags filler analytical phrases');

const overgenSample = 'It is an undeniable fact that everyone knows this universal consensus.';
const overgenResult = detectOvergeneralisation(overgenSample);
assert(overgenResult.occurrences >= 2, 'overgeneralisation flags absolutist phrases');

// 5. Promotional Language & Emphasis Tests
console.log('\n--- Test 5: Promotional Language & Undue Emphasis ---');
const promoSample = 'This revolutionary game-changer offers cutting-edge capabilities and incredible features!!!';
const promoResult = detectPromotionalLanguage(promoSample);
assert(promoResult.detected && promoResult.occurrences >= 2, 'promotional language flags buzzwords');

const emphasisResult = detectUndueEmphasis(promoSample);
assert(emphasisResult.detected && emphasisResult.occurrences >= 2, 'undue emphasis flags intensifiers and emphatic punctuation');

const elegantVarSample = 'The company grew rapidly. The firm then invested in talent. Later, the enterprise expanded overseas.';
const elegantVarResult = detectElegantVariation(elegantVarSample);
assert(elegantVarResult.detected, 'elegant variation flags corporate synonym rotation cluster');

// 6. Statistical / Linguistic Stylometrics Tests
console.log('\n--- Test 6: Statistical & Linguistic Stylometrics ---');
const shortStats = analyzeLinguisticStatistics('Too short.');
assert(
  shortStats.factors.find((f) => f.id === 'ttr')?.isInsufficientData === true,
  'lexical diversity: handles short text gracefully with insufficient text flag'
);

const syllableTest1 = countWordSyllables('technology');
assert(syllableTest1 === 4, `syllable counter for 'technology' yields 4 (got ${syllableTest1})`);
const syllableTest2 = countWordSyllables('make');
assert(syllableTest2 === 1, `syllable counter for 'make' (silent e) yields 1 (got ${syllableTest2})`);

const longSample = SAMPLE_TEXTS.ai.text;
const longStats = analyzeLinguisticStatistics(longSample);
assert(
  longStats.factors.some((f) => f.id === 'flesch_kincaid' && !f.isInsufficientData),
  'Flesch-Kincaid grade level computed for sufficient text'
);
assert(
  longStats.factors.some((f) => f.id === 'transition_words'),
  'transition word density calculated'
);
assert(
  longStats.factors.some((f) => f.id === 'punctuation_patterns'),
  'punctuation pattern analysis calculated'
);

// 7. Classification Boundary Tests
console.log('\n--- Test 7: Classification Boundaries ---');
assert(classifyScore(0) === 'Likely Human-Written', 'Score = 0 -> Likely Human-Written');
assert(classifyScore(29) === 'Likely Human-Written', 'Score = 29 -> Likely Human-Written');
assert(classifyScore(30) === 'Possibly AI-Generated', 'Score = 30 -> Possibly AI-Generated');
assert(classifyScore(59) === 'Possibly AI-Generated', 'Score = 59 -> Possibly AI-Generated');
assert(classifyScore(60) === 'Likely AI-Generated', 'Score = 60 -> Likely AI-Generated');
assert(classifyScore(100) === 'Likely AI-Generated', 'Score = 100 -> Likely AI-Generated');

// 8. Score Normalization & Caps Tests
console.log('\n--- Test 8: Score Normalization and Caps ---');
const dummyDetectors = [
  {
    detectorId: 'd1',
    name: 'D1',
    category: 'C1',
    group: 'vocabulary' as const,
    detected: true,
    occurrences: 10,
    rawScore: 80,
    cappedScore: 15,
    maxCap: 15,
    explanation: 'Test',
    evidence: [],
  },
  {
    detectorId: 'd2',
    name: 'D2',
    category: 'C2',
    group: 'structural' as const,
    detected: true,
    occurrences: 10,
    rawScore: 120,
    cappedScore: 90,
    maxCap: 90,
    explanation: 'Test',
    evidence: [],
  },
];
const aggResult = aggregateScores(dummyDetectors);
assert(aggResult.finalScore === 100, 'Score is capped at 100 when raw sum exceeds 100');
assert(
  aggResult.categorySummaries.every((c) => c.normalizedScore <= c.rawScore),
  'Category scores are normalized proportionally when sum > 100'
);

// 9. Empty Input Validation Test
console.log('\n--- Test 9: Empty Input Validation ---');
try {
  analyzeText('');
  assert(false, 'empty input should throw validation error');
} catch (e: any) {
  assert(true, 'empty input prevented with clear validation error');
}

try {
  analyzeText('   \n\t  ');
  assert(false, 'whitespace-only input should throw validation error');
} catch (e: any) {
  assert(true, 'whitespace-only input prevented with clear validation error');
}

// 10. Master Analyzer End-to-End Tests
console.log('\n--- Test 10: End-to-End Sample Analysis ---');
const humanReport = analyzeText(SAMPLE_TEXTS.human.text);
assert(humanReport.score <= 35, `Human sample scores in lower bracket (got ${humanReport.score})`);

const aiReport = analyzeText(SAMPLE_TEXTS.ai.text);
assert(aiReport.score >= 60, `AI sample scores in Likely AI-Generated bracket (got ${aiReport.score})`);
assert(aiReport.evidence.length > 0, 'Evidence list generated for AI sample');

// Test overlap resolution
const resolvedOverlaps = resolveEvidenceOverlaps(aiReport.evidence);
for (let i = 0; i < resolvedOverlaps.length - 1; i++) {
  assert(
    resolvedOverlaps[i].endIndex <= resolvedOverlaps[i + 1].startIndex,
    'Evidence highlights strictly non-overlapping'
  );
}

console.log(`\n========================================`);
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
