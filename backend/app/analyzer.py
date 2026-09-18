import datetime
from typing import List
from .models.schemas import AnalysisReport, DetectedEvidence, DetectorResult
from .detectors.statistics import calculate_statistics
from .detectors.vocabulary import detect_vocabulary
from .detectors.structural import (
    detect_rule_of_three,
    detect_negative_parallelism,
    detect_outline_conclusions,
    detect_false_ranges,
)
from .detectors.vague_language import (
    detect_vague_attributions,
    detect_superficial_analysis,
    detect_overgeneralisation,
)
from .detectors.promotional import (
    detect_undue_emphasis,
    detect_promotional_language,
    detect_elegant_variation,
)
from .detectors.linguistic_stats import analyze_linguistic_statistics
from .detectors.scoring import aggregate_scores

SCIENTIFIC_DISCLAIMER = (
    "This application uses deterministic heuristic pattern matching and statistical stylometry. "
    "It evaluates linguistic markers frequently observed in machine-generated prose (such as uniform "
    "sentence cadence, formulaic rhetorical structures, and high-frequency AI vocabulary). It is NOT "
    "proof of authorship. Human writing can trigger these markers, and AI writing can intentionally avoid them."
)


def resolve_evidence_overlaps(evidence_list: List[DetectedEvidence]) -> List[DetectedEvidence]:
    if not evidence_list:
        return []

    sorted_evidence = sorted(evidence_list, key=lambda x: (x.startIndex, -x.scoreWeight))
    resolved: List[DetectedEvidence] = []
    current_end = -1

    for item in sorted_evidence:
        if item.startIndex >= current_end:
            resolved.append(item)
            current_end = item.endIndex

    return resolved


def analyze_text(text: str) -> AnalysisReport:
    trimmed = text.strip()
    if not trimmed:
        raise ValueError("Input text cannot be empty. Please provide valid text for analysis.")

    statistics = calculate_statistics(text)
    vocab_result = detect_vocabulary(text)
    rule_of_three = detect_rule_of_three(text)
    neg_parallel = detect_negative_parallelism(text)
    outline_concl = detect_outline_conclusions(text)
    false_ranges = detect_false_ranges(text)
    vague_attr = detect_vague_attributions(text)
    superficial = detect_superficial_analysis(text)
    overgen = detect_overgeneralisation(text)
    undue_emphasis = detect_undue_emphasis(text)
    promotional = detect_promotional_language(text)
    elegant_var = detect_elegant_variation(text)
    factors, stat_result = analyze_linguistic_statistics(text)

    detectors: List[DetectorResult] = [
        vocab_result,
        rule_of_three,
        neg_parallel,
        outline_concl,
        false_ranges,
        vague_attr,
        superficial,
        overgen,
        undue_emphasis,
        promotional,
        elegant_var,
        stat_result,
    ]

    final_score, raw_score_total, classification, summaries = aggregate_scores(detectors)

    all_evidence: List[DetectedEvidence] = []
    for d in detectors:
        all_evidence.extend(d.evidence)

    resolved_evidence = resolve_evidence_overlaps(all_evidence)

    return AnalysisReport(
        score=final_score,
        rawScore=raw_score_total,
        classification=classification,
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        statistics=statistics,
        linguisticFactors=factors,
        detectors=detectors,
        categorySummaries=summaries,
        evidence=resolved_evidence,
        disclaimer=SCIENTIFIC_DISCLAIMER,
    )
