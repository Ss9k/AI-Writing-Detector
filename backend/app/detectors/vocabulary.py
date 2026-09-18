import re
from typing import List, Set, Tuple
from ..models.schemas import DetectorResult, DetectedEvidence

DEFAULT_AI_VOCABULARY_RULES: List[Tuple[str, str, float]] = [
    ("delve into", r"\bdelv(?:e|es|ed|ing)\s+into\b", 3.0),
    ("navigate", r"\bnavigat(?:e|es|ed|ing)\s+(?:the|complex|challenges|landscape|intricacies|waters|realities)\b", 3.0),
    ("robust", r"\brobust(?:ly|ness)?\b", 3.0),
    ("innovative solutions", r"\binnovative\s+solutions?\b", 3.0),
    ("transformative", r"\btransformat(?:ive|ion)\b", 3.0),
    ("leverage", r"\bleverag(?:e|es|ed|ing)\b", 3.0),
    ("streamline", r"\bstreamlin(?:e|es|ed|ing)\b", 3.0),
    ("ecosystem", r"\becosystems?\b", 3.0),
    ("tapestry", r"\b(?:rich\s+)?tapestry\b", 3.0),
    ("pivotal", r"\bpivotal(?:\s+role)?\b", 3.0),
    ("multifaceted", r"\bmultifaceted\b", 3.0),
    ("testament", r"\btestament\s+to\b", 3.0),
    ("beacon", r"\bbeacon\s+(?:of|for)\b", 3.0),
    ("realm", r"\b(?:in\s+the\s+)?realm\s+of\b", 3.0),
    ("paramount", r"\b(?:of\s+)?paramount(?:\s+importance)?\b", 3.0),
    ("underscore", r"\bunderscor(?:e|es|ed|ing)\b", 3.0),
    ("foster", r"\bfoster(?:s|ed|ing)?\b", 3.0),
    ("harness", r"\bharness(?:es|ed|ing)?\b", 3.0),
    ("seamless", r"\bseamless(?:ly)?\b", 3.0),
    ("align with", r"\balign(?:s|ed|ing)?\s+with\b", 3.0),
]

VOCABULARY_MAX_CAP = 15.0


def detect_vocabulary(
    text: str,
    rules: List[Tuple[str, str, float]] = DEFAULT_AI_VOCABULARY_RULES,
    max_cap: float = VOCABULARY_MAX_CAP,
) -> DetectorResult:
    detected_terms_set: Set[str] = set()
    evidence: List[DetectedEvidence] = []
    raw_score = 0.0

    for term, pattern_str, weight in rules:
        pattern = re.compile(pattern_str, flags=re.IGNORECASE)
        matched_in_rule = False

        for match in pattern.finditer(text):
            matched_in_rule = True
            matched_text = match.group(0)
            start_index = match.start()
            end_index = match.end()

            safe_term = re.sub(r'\s+', '-', term)
            evidence.append(
                DetectedEvidence(
                    id=f"vocab-{safe_term}-{start_index}",
                    detectorId="ai_vocabulary",
                    category="AI Vocabulary",
                    matchedText=matched_text,
                    startIndex=start_index,
                    endIndex=end_index,
                    explanation=f'Commonly overused AI buzzword or phrase: "{term}".',
                    scoreWeight=weight,
                )
            )

        if matched_in_rule:
            detected_terms_set.add(term)
            raw_score += weight

    detected_terms = sorted(list(detected_terms_set))
    occurrences = len(evidence)
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Identified {len(detected_terms)} distinct AI-associated terms ({occurrences} total occurrences), contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No prominent AI-associated signature vocabulary patterns detected."
    )

    return DetectorResult(
        detectorId="ai_vocabulary",
        name="AI-Signature Vocabulary",
        category="AI Vocabulary",
        group="vocabulary",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=detected_terms,
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )
