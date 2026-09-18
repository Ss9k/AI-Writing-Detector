import re
from typing import List, Set
from ..models.schemas import DetectorResult, DetectedEvidence

INTENSIFIER_WORDS = [
    "tremendous",
    "remarkable",
    "remarkably",
    "groundbreaking",
    "absolutely",
    "incredible",
    "incredibly",
    "extremely",
    "unprecedented",
    "staggering",
    "astounding",
    "breathtaking",
    "profoundly",
    "immensely",
    "extraordinary",
    "monumental",
]

DEFAULT_PROMOTIONAL_TERMS = [
    "game-changer",
    "game changer",
    "revolutionary",
    "impressive features",
    "transformative potential",
    "paradigm shift",
    "cutting-edge",
    "cutting edge",
    "next-generation",
    "next generation",
    "state-of-the-art",
    "state of the art",
    "unlock new possibilities",
    "unparalleled",
    "skyrocket",
    "take it to the next level",
    "poised to revolutionize",
]


def detect_undue_emphasis(text: str, max_cap: float = 10.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []

    for word in INTENSIFIER_WORDS:
        pattern = re.compile(rf"\b{word}\b", flags=re.IGNORECASE)
        for match in pattern.finditer(text):
            matched_text = match.group(0)
            start_index = match.start()
            end_index = match.end()
            evidence.append(
                DetectedEvidence(
                    id=f"intensifier-{word}-{start_index}",
                    detectorId="undue_emphasis",
                    category="Undue Emphasis",
                    matchedText=matched_text,
                    startIndex=start_index,
                    endIndex=end_index,
                    explanation=f'Hyperbolic intensifier / superlative: "{matched_text}".',
                    scoreWeight=2.0,
                )
            )

    punc_pattern = re.compile(r"(?:!{2,}|\?{2,}|!\?|\?!)")
    for match in punc_pattern.finditer(text):
        matched_text = match.group(0)
        start_index = match.start()
        end_index = match.end()
        evidence.append(
            DetectedEvidence(
                id=f"emphatic-punc-{start_index}",
                detectorId="undue_emphasis",
                category="Undue Emphasis",
                matchedText=matched_text,
                startIndex=start_index,
                endIndex=end_index,
                explanation=f'Emphatic repeated punctuation: "{matched_text}".',
                scoreWeight=2.0,
            )
        )

    occurrences = len(evidence)
    raw_score = occurrences * 2.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Detected {occurrences} instance(s) of hyperbolic emphasis or expressive punctuation, contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No undue emphasis or exaggerated intensifiers detected."
    )

    return DetectorResult(
        detectorId="undue_emphasis",
        name="Undue Emphasis & Intensifiers",
        category="Undue Emphasis",
        group="promotional",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )


def detect_promotional_language(
    text: str, terms: List[str] = DEFAULT_PROMOTIONAL_TERMS, max_cap: float = 12.0
) -> DetectorResult:
    evidence: List[DetectedEvidence] = []

    for term in terms:
        escaped = re.escape(term).replace(r"\ ", r"\s+")
        pattern = re.compile(rf"\b{escaped}\b", flags=re.IGNORECASE)
        for match in pattern.finditer(text):
            matched_text = match.group(0)
            start_index = match.start()
            end_index = match.end()
            evidence.append(
                DetectedEvidence(
                    id=f"promotional-{start_index}",
                    detectorId="promotional_language",
                    category="Promotional Language",
                    matchedText=matched_text,
                    startIndex=start_index,
                    endIndex=end_index,
                    explanation=f'Promotional or marketing hype phrase: "{matched_text}".',
                    scoreWeight=3.0,
                )
            )

    occurrences = len(evidence)
    raw_score = occurrences * 3.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Identified {occurrences} promotional hype term(s), contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No promotional or marketing buzzwords detected."
    )

    return DetectorResult(
        detectorId="promotional_language",
        name="Promotional Buzzwords",
        category="Promotional Language",
        group="promotional",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )


SYNONYM_CLUSTERS = [
    {"name": "Corporate Entity", "terms": ["company", "organisation", "organization", "firm", "enterprise", "corporation", "business"]},
    {"name": "System / Tool", "terms": ["platform", "system", "solution", "tool", "framework", "mechanism", "infrastructure"]},
    {"name": "Individual / User", "terms": ["individual", "user", "customer", "client", "consumer", "person", "stakeholder"]},
    {"name": "Field / Sector", "terms": ["field", "sector", "industry", "domain", "arena", "landscape", "space"]},
]


def detect_elegant_variation(text: str, max_cap: float = 8.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []

    for cluster in SYNONYM_CLUSTERS:
        found_terms = []
        for term in cluster["terms"]:
            pattern = re.compile(rf"\b{term}s?\b", flags=re.IGNORECASE)
            for match in pattern.finditer(text):
                found_terms.append((term, match.start(), len(match.group(0))))

        found_terms.sort(key=lambda x: x[1])
        unique_synonyms = set(t[0] for t in found_terms)

        if len(unique_synonyms) >= 3:
            for term, idx, length in found_terms[:3]:
                evidence.append(
                    DetectedEvidence(
                        id=f"elegant-var-{idx}",
                        detectorId="elegant_variation",
                        category="Elegant Variation",
                        matchedText=text[idx : idx + length],
                        startIndex=idx,
                        endIndex=idx + length,
                        explanation=f'Heuristic elegant variation: synonym rotation in cluster "{cluster["name"]}" ({", ".join(sorted(list(unique_synonyms)))}).',
                        scoreWeight=2.0,
                    )
                )

    occurrences = len(evidence) // 3 if evidence else 0
    raw_score = occurrences * 4.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Identified {occurrences} cluster(s) of rotational entity synonym substitutions, contributing {int(capped_score)}/{int(max_cap)} points. (Heuristic indicator)."
        if occurrences > 0
        else "No noticeable elegant variation synonym hopping detected."
    )

    return DetectorResult(
        detectorId="elegant_variation",
        name="Elegant Variation (Heuristic)",
        category="Elegant Variation",
        group="promotional",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )
