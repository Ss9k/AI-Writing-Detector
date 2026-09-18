import re
from typing import List
from ..models.schemas import DetectorResult, DetectedEvidence


def has_concrete_citation_context(text: str, match_index: int, match_length: int) -> bool:
    start = max(0, match_index - 120)
    end = min(len(text), match_index + match_length + 120)
    window_text = text[start:end]

    has_year = bool(re.search(r"\b(?:in\s+)?\(?(?:19|20)\d{2}\)?\b", window_text))
    has_author = bool(
        re.search(
            r"\b(?:et\s+al\.?|Dr\.\s+[A-Z][a-z]+|Prof\.\s+[A-Z][a-z]+|by\s+[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)\b",
            window_text,
        )
    )
    has_publication = bool(
        re.search(
            r"\b(?:Nature|Science|Lancet|Cell|Journal|University|Institute|Association|Dept|Department|Press|Review)\b",
            window_text,
            flags=re.IGNORECASE,
        )
    )

    return (has_year and has_author) or (has_year and has_publication) or bool(re.search(r"et\s+al\.", window_text, flags=re.IGNORECASE))


def detect_vague_attributions(text: str, max_cap: float = 12.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []
    patterns = [
        r"\b(?:experts?|specialists?)\s+(?:agree|suggest|claim|point\s+out|argue|note|believe|state)\b",
        r"\b(?:studies?|surveys?)\s+(?:show|suggest|indicate|reveal|demonstrate|prove|find)\b",
        r"\bresearch\s+(?:shows?|indicates?|suggests?|reveals?|points?\s+to)\b",
        r"\bindustry\s+(?:insiders?|observers?|leaders?|analysts?)\s+(?:report|claim|predict|note|say)\b",
        r"\b(?:many|numerous)\s+(?:experts?|scholars?|critics?|analysts?)\s+(?:agree|argue|believe|point\s+out)\b",
        r"\b(?:observers?|commentators?)\s+(?:have\s+noted|note|observe)\b",
        r"\bit\s+is\s+(?:widely\s+)?believed\s+that\b",
    ]

    for pat_str in patterns:
        pat = re.compile(pat_str, flags=re.IGNORECASE)
        for match in pat.finditer(text):
            matched_text = match.group(0)
            start_index = match.start()
            end_index = match.end()

            if has_concrete_citation_context(text, start_index, len(matched_text)):
                continue

            evidence.append(
                DetectedEvidence(
                    id=f"vague-attr-{start_index}",
                    detectorId="vague_attributions",
                    category="Vague Attribution",
                    matchedText=matched_text,
                    startIndex=start_index,
                    endIndex=end_index,
                    explanation=f'Unnamed authority or phantom citation: "{matched_text}".',
                    scoreWeight=3.0,
                )
            )

    occurrences = len(evidence)
    raw_score = occurrences * 3.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Identified {occurrences} vague authority/attribution claim(s) lacking concrete citations, contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No vague or unnamed attributions detected."
    )

    return DetectorResult(
        detectorId="vague_attributions",
        name="Vague Attributions",
        category="Vague Attribution",
        group="vague_language",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )


def detect_superficial_analysis(text: str, max_cap: float = 9.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []
    patterns = [
        r"\bit\s+is\s+(?:worth|worthy\s+of)\s+not(?:ing|e)\b",
        r"\bsignificant\s+developments?\b",
        r"\bone\s+could\s+(?:argue|say|contend)\b",
        r"\bvarious\s+sources\s+indicate\b",
        r"\bit\s+is\s+important\s+to\s+(?:remember|note|recognize|keep\s+in\s+mind)\b",
        r"\ba\s+closer\s+(?:look|examination|inspection)\s+reveals\b",
        r"\bit\s+should\s+be\s+(?:noted|emphasized|highlighted)\s+that\b",
        r"\bit\s+remains\s+to\s+be\s+seen\b",
    ]

    for pat_str in patterns:
        pat = re.compile(pat_str, flags=re.IGNORECASE)
        for match in pat.finditer(text):
            matched_text = match.group(0)
            start_index = match.start()
            end_index = match.end()
            evidence.append(
                DetectedEvidence(
                    id=f"superficial-{start_index}",
                    detectorId="superficial_analysis",
                    category="Superficial Analysis",
                    matchedText=matched_text,
                    startIndex=start_index,
                    endIndex=end_index,
                    explanation=f'Superficial meta-commentary: "{matched_text}".',
                    scoreWeight=3.0,
                )
            )

    occurrences = len(evidence)
    raw_score = occurrences * 3.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Identified {occurrences} superficial meta-analytical filler phrase(s), contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No superficial analytical filler patterns detected."
    )

    return DetectorResult(
        detectorId="superficial_analysis",
        name="Superficial Analysis Fillers",
        category="Superficial Analysis",
        group="vague_language",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )


def detect_overgeneralisation(text: str, max_cap: float = 9.0) -> DetectorResult:
    evidence: List[DetectedEvidence] = []
    patterns = [
        r"\beveryone\s+knows\b",
        r"\bit\s+is\s+well\s+established\b",
        r"\buniversal\s+consensus\b",
        r"\bwidely\s+recognized\b",
        r"\bundeniable\s+fact\b",
        r"\bwithout\s+(?:a\s+)?doubt\b",
        r"\bcommon\s+knowledge\b",
        r"\bit\s+goes\s+without\s+saying\b",
    ]

    for pat_str in patterns:
        pat = re.compile(pat_str, flags=re.IGNORECASE)
        for match in pat.finditer(text):
            matched_text = match.group(0)
            start_index = match.start()
            end_index = match.end()
            evidence.append(
                DetectedEvidence(
                    id=f"overgen-{start_index}",
                    detectorId="overgeneralisation",
                    category="Overgeneralisation",
                    matchedText=matched_text,
                    startIndex=start_index,
                    endIndex=end_index,
                    explanation=f'Unwarranted consensus or absolutist claim: "{matched_text}".',
                    scoreWeight=3.0,
                )
            )

    occurrences = len(evidence)
    raw_score = occurrences * 3.0
    capped_score = min(raw_score, max_cap)

    explanation = (
        f"Found {occurrences} overgeneralising or absolutist assertion(s), contributing {int(capped_score)}/{int(max_cap)} points."
        if occurrences > 0
        else "No excessive overgeneralisation patterns detected."
    )

    return DetectorResult(
        detectorId="overgeneralisation",
        name="Overgeneralisation",
        category="Overgeneralisation",
        group="vague_language",
        detected=occurrences > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=explanation,
        evidence=evidence,
    )
