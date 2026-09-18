import unittest
from backend.app.detectors.statistics import calculate_statistics, extract_words, extract_sentences
from backend.app.detectors.vocabulary import detect_vocabulary
from backend.app.detectors.structural import (
    detect_rule_of_three,
    detect_negative_parallelism,
    detect_outline_conclusions,
    detect_false_ranges,
)
from backend.app.detectors.vague_language import (
    detect_vague_attributions,
    detect_superficial_analysis,
    detect_overgeneralisation,
)
from backend.app.detectors.promotional import (
    detect_undue_emphasis,
    detect_promotional_language,
    detect_elegant_variation,
)
from backend.app.detectors.scoring import classify_score, aggregate_scores
from backend.app.analyzer import analyze_text, resolve_evidence_overlaps
from backend.app.models.schemas import DetectorResult


class TestAIWritingDetectorPython(unittest.TestCase):
    def test_statistics(self):
        text = "Hello world! This is a test. Dr. Smith agrees."
        words = extract_words(text)
        self.assertEqual(len(words), 9)
        sentences = extract_sentences(text)
        self.assertEqual(len(sentences), 3)

        stats = calculate_statistics("One two three.\n\nFour five six.")
        self.assertEqual(stats.wordCount, 6)
        self.assertEqual(stats.charCount, 30)
        self.assertEqual(stats.paragraphCount, 2)
        self.assertEqual(stats.sentenceCount, 2)

    def test_vocabulary(self):
        text = "We must delve into the realm of our robust ecosystem to leverage modern tools."
        res = detect_vocabulary(text)
        self.assertTrue(res.detected)
        self.assertIn("delve into", res.detectedTerms)
        self.assertIn("robust", res.detectedTerms)
        self.assertIn("ecosystem", res.detectedTerms)
        self.assertIn("leverage", res.detectedTerms)
        self.assertLessEqual(res.cappedScore, res.maxCap)

    def test_structural_patterns(self):
        triad_text = "This platform is efficient, scalable, and maintainable."
        triad = detect_rule_of_three(triad_text)
        self.assertTrue(triad.detected)
        self.assertGreaterEqual(triad.occurrences, 1)

        neg_text = "It is not only cost-effective but also remarkably secure."
        neg = detect_negative_parallelism(neg_text)
        self.assertTrue(neg.detected)

        concl_text = "Despite various obstacles, the new system offers substantial performance benefits."
        concl = detect_outline_conclusions(concl_text)
        self.assertTrue(concl.detected)

        false_range_text = "The system spans from optimizing routine database queries to the very horizons of human thought."
        fr = detect_false_ranges(false_range_text)
        self.assertTrue(fr.detected)

    def test_vague_language_and_citation_exclusion(self):
        vague_text = "Studies show that productivity improves, and experts agree on this topic."
        vague = detect_vague_attributions(vague_text)
        self.assertTrue(vague.detected)
        self.assertEqual(vague.occurrences, 2)

        # Concrete citation should NOT be flagged
        citation_text = "According to a 2024 study by Smith et al. in Nature, sleep improves memory."
        citation = detect_vague_attributions(citation_text)
        self.assertEqual(citation.occurrences, 0)

        superficial_text = "It is worth noting that significant developments occurred, and one could argue the outcome."
        superficial = detect_superficial_analysis(superficial_text)
        self.assertGreaterEqual(superficial.occurrences, 2)

        overgen_text = "It is an undeniable fact that everyone knows this universal consensus."
        overgen = detect_overgeneralisation(overgen_text)
        self.assertGreaterEqual(overgen.occurrences, 2)

    def test_promotional_and_emphasis(self):
        promo_text = "This revolutionary game-changer offers cutting-edge capabilities and incredible features!!!"
        promo = detect_promotional_language(promo_text)
        self.assertTrue(promo.detected)

        emphasis = detect_undue_emphasis(promo_text)
        self.assertTrue(emphasis.detected)

        elegant_text = "The company grew rapidly. The firm then invested in talent. Later, the enterprise expanded overseas."
        elegant = detect_elegant_variation(elegant_text)
        self.assertTrue(elegant.detected)

    def test_classification_boundaries(self):
        self.assertEqual(classify_score(0), "Likely Human-Written")
        self.assertEqual(classify_score(29), "Likely Human-Written")
        self.assertEqual(classify_score(30), "Possibly AI-Generated")
        self.assertEqual(classify_score(59), "Possibly AI-Generated")
        self.assertEqual(classify_score(60), "Likely AI-Generated")
        self.assertEqual(classify_score(100), "Likely AI-Generated")

    def test_empty_input(self):
        with self.assertRaises(ValueError):
            analyze_text("")

        with self.assertRaises(ValueError):
            analyze_text("   \n\t  ")

    def test_score_normalization_and_caps(self):
        d1 = DetectorResult(
            detectorId="d1",
            name="D1",
            category="C1",
            group="vocabulary",
            detected=True,
            occurrences=10,
            detectedTerms=[],
            rawScore=80.0,
            cappedScore=15.0,
            maxCap=15.0,
            explanation="test",
            evidence=[],
        )
        d2 = DetectorResult(
            detectorId="d2",
            name="D2",
            category="C2",
            group="structural",
            detected=True,
            occurrences=10,
            detectedTerms=[],
            rawScore=120.0,
            cappedScore=90.0,
            maxCap=90.0,
            explanation="test",
            evidence=[],
        )
        final_score, raw_total, classification, summaries = aggregate_scores([d1, d2])
        self.assertEqual(final_score, 100)
        for s in summaries:
            self.assertLessEqual(s.normalizedScore, s.rawScore)


if __name__ == "__main__":
    unittest.main()
