import re
from typing import List
from ..models.schemas import DetectorResult, DetectedEvidence


def detect_rule_of_three(text: str, max_cap: float = 12.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []
    triad_pattern = re.compile(
        r"\b([a-zA-Z-]+)\s*,\s*([a-zA-Z-]+)\s*,?\s+(?:and|or|as well as)\s+([a-zA-Z-]+)\b",
        flags=re.IGNORECASE,
    )

    for match in triad_pattern.finditer(text):
        matched_text = match.group(0)
        parts = [match.group(1).lower(), match.group(2).lower(), match.group(3).lower()]
        if any(p.isdigit() or len(p) < 2 for p in parts):
            continue

        start_index = match.start()
        end_index = match.end()
        evidence.append(
            DetectedEvidence(
                id=f"rule-of-three-{start_index}",
                detectorId="rule_of_three",
                category="Rule of Three",
                matchedText=matched_text,
                startIndex=start_index,
                endIndex=end_index,
                explanation=f'Parallel triad construction: "{matched_text}". AI text heavily favors symmetrical three-item lists.',
                scoreWeight=3.0,
            )
        )

    occurrences = len(evidence)
    raw_score = occurrences * 3.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Found {occurrences} parallel three-item construction(s), contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No prominent rule-of-three list patterns detected."
    )

    return DetectorResult(
        detectorId="rule_of_three",
        name="Rule of Three (Triads)",
        category="Rule of Three",
        group="structural",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )


def detect_negative_parallelism(text: str, max_cap: float = 12.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []
    pattern = re.compile(
        r"\bnot\s+(?:only|just|merely|simply)\s+([^.!?\n]{3,80}?)\s+but\s+(?:also|rather|even)\b",
        flags=re.IGNORECASE,
    )

    for match in pattern.finditer(text):
        matched_text = match.group(0)
        start_index = match.start()
        end_index = match.end()
        evidence.append(
            DetectedEvidence(
                id=f"neg-parallel-{start_index}",
                detectorId="negative_parallelism",
                category="Negative Parallelism",
                matchedText=matched_text,
                startIndex=start_index,
                endIndex=end_index,
                explanation=f'Rhetorical contrast structure ("not only... but also..."): "{matched_text}".',
                scoreWeight=4.0,
            )
        )

    occurrences = len(evidence)
    raw_score = occurrences * 4.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Found {occurrences} negative parallelism rhetorical structure(s), contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No negative parallelism patterns detected."
    )

    return DetectorResult(
        detectorId="negative_parallelism",
        name="Negative Parallelism",
        category="Negative Parallelism",
        group="structural",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )


def detect_outline_conclusions(text: str, max_cap: float = 10.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []
    patterns = [
        r"\b(?:despite|in spite of)\s+([^,.;]{3,50}),\s+([^,.;]{2,30})\s+(?:offers?|provides?|presents?|holds?|remains?|serves?)\b",
        r"\bwhile\s+([^,.;]{3,50})\s+(?:challenges?|hurdles?|obstacles?|concerns?|drawbacks?)\s+remain[s]?,\s+([^,.;]{2,30})\s+(?:offers?|provides?|presents?|heralds?)\b",
        r"\bin\s+conclusion,\s+(?:while|although)\s+([^,.;]{3,50}),\s+([^,.;]{2,30})\b",
        r"\bultimately,\s+(?:while|despite)\s+([^,.;]{3,50}),\s+([^,.;]{2,30})\b",
    ]

    for pat_str in patterns:
        pat = re.compile(pat_str, flags=re.IGNORECASE)
        for match in pat.finditer(text):
            matched_text = match.group(0)
            start_index = match.start()
            end_index = match.end()
            evidence.append(
                DetectedEvidence(
                    id=f"conclusion-structure-{start_index}",
                    detectorId="outline_conclusions",
                    category="Outline-Style Conclusion",
                    matchedText=matched_text,
                    startIndex=start_index,
                    endIndex=end_index,
                    explanation=f'Formulaic outline conclusion: "{matched_text}".',
                    scoreWeight=5.0,
                )
            )

    occurrences = len(evidence)
    raw_score = occurrences * 5.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Found {occurrences} formulaic conclusion pattern(s), contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No outline-style formulaic conclusion patterns detected."
    )

    return DetectorResult(
        detectorId="outline_conclusions",
        name="Outline-Style Conclusions",
        category="Outline Conclusions",
        group="structural",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )


def detect_false_ranges(text: str, max_cap: float = 9.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []
    pattern = re.compile(r"\bfrom\s+([a-zA-Z\s]{4,35})\s+to\s+([a-zA-Z\s]{4,35})\b", flags=re.IGNORECASE)

    for match in pattern.finditer(text):
        matched_text = match.group(0)
        from_part = match.group(1).strip().lower()
        to_part = match.group(2).strip().lower()

        if re.search(
            r"\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|am|pm|\d+)\b",
            matched_text,
            flags=re.IGNORECASE,
        ):
            continue

        abstract_kw = re.search(r"\b(human|future|society|creativity|life|destiny|potential|fabric|universe|thought|horizons?|essence|world)\b", from_part + " " + to_part)
        operational_kw = re.search(r"\b(optimizing|code|data|workflows?|routine|tasks?|daily|processes?|automation|algorithms?)\b", from_part + " " + to_part)

        if (abstract_kw and operational_kw) or (len(from_part.split()) >= 2 and len(to_part.split()) >= 2 and from_part not in to_part):
            start_index = match.start()
            end_index = match.end()
            evidence.append(
                DetectedEvidence(
                    id=f"false-range-{start_index}",
                    detectorId="false_ranges",
                    category="False Ranges",
                    matchedText=matched_text,
                    startIndex=start_index,
                    endIndex=end_index,
                    explanation=f'Heuristic false-range sweep ("from {from_part} to {to_part}"). (Conservative heuristic estimate).',
                    scoreWeight=3.0,
                )
            )

    occurrences = len(evidence)
    raw_score = occurrences * 3.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f'Identified {occurrences} expansive "from X to Y" false range sweep(s), contributing {int(capped_score)}/{int(max_cap)} points.'
        if occurrences > 0
        else "No disparate false range sweeps detected."
    )

    return DetectorResult(
        detectorId="false_ranges",
        name="False Ranges (Heuristic)",
        category="False Ranges",
        group="structural",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )
