from typing import List, Dict, Tuple
from ..models.schemas import DetectorResult, CategoryScoreSummary

SCORE_THRESHOLDS = {
    "HUMAN_MAX": 29,
    "POSSIBLY_AI_MIN": 30,
    "POSSIBLY_AI_MAX": 59,
    "LIKELY_AI_MIN": 60,
}


def classify_score(score: float) -> str:
    rounded = round(score)
    if rounded <= SCORE_THRESHOLDS["HUMAN_MAX"]:
        return "Likely Human-Written"
    if rounded <= SCORE_THRESHOLDS["POSSIBLY_AI_MAX"]:
        return "Possibly AI-Generated"
    return "Likely AI-Generated"


def aggregate_scores(detectors: List[DetectorResult]) -> Tuple[int, float, str, List[CategoryScoreSummary]]:
    group_labels = {
        "vocabulary": "AI Vocabulary",
        "structural": "Structural Patterns",
        "vague_language": "Vague Language",
        "promotional": "Promotional & Emphasis",
        "statistical": "Statistical Stylometrics",
    }

    group_scores: Dict[str, Dict[str, float]] = {
        "vocabulary": {"raw": 0.0, "maxCap": 0.0},
        "structural": {"raw": 0.0, "maxCap": 0.0},
        "vague_language": {"raw": 0.0, "maxCap": 0.0},
        "promotional": {"raw": 0.0, "maxCap": 0.0},
        "statistical": {"raw": 0.0, "maxCap": 0.0},
    }

    for detector in detectors:
        group = detector.group
        if group in group_scores:
            group_scores[group]["raw"] += detector.cappedScore
            group_scores[group]["maxCap"] += detector.maxCap

    raw_score_total = sum(item["raw"] for item in group_scores.values())
    final_score = min(100, round(raw_score_total))
    needs_normalization = raw_score_total > 100

    summaries: List[CategoryScoreSummary] = []
    for group, data in group_scores.items():
        raw = data["raw"]
        max_cap = data["maxCap"]
        normalized = raw
        if needs_normalization and raw_score_total > 0:
            normalized = round((raw / raw_score_total) * 100)

        percent_contribution = round((normalized / final_score) * 100) if final_score > 0 else 0.0
        summaries.append(
            CategoryScoreSummary(
                group=group,
                label=group_labels[group],
                rawScore=raw,
                normalizedScore=normalized,
                maxCap=max_cap,
                percentContribution=percent_contribution,
            )
        )

    classification = classify_score(final_score)
    return final_score, raw_score_total, classification, summaries
