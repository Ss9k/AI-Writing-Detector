import re
import math
from typing import List, Tuple
from ..models.schemas import LinguisticFactor, DetectorResult, DetectedEvidence
from .statistics import extract_words, extract_sentences

DISCOURSE_TRANSITIONS = [
    "furthermore",
    "moreover",
    "consequently",
    "additionally",
    "in addition",
    "subsequently",
    "nevertheless",
    "nonetheless",
    "on the other hand",
    "hence",
    "therefore",
    "thus",
    "in contrast",
    "conversely",
    "as a result",
    "to illustrate",
    "for instance",
    "in summary",
    "in conclusion",
]


def count_syllables(word: str) -> int:
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 0
    if len(w) <= 3:
        return 1
    cleaned = re.sub(r"(?:[^laeiouy]|ed|es|e)$", "", w)
    cleaned = re.sub(r"^y", "", cleaned)
    vowels = re.findall(r"[aeiouy]{1,2}", cleaned)
    return max(1, len(vowels)) if vowels else 1


def analyze_linguistic_statistics(text: str, max_cap: float = 18.0) -> Tuple[List[LinguisticFactor], DetectorResult]:
    words = extract_words(text)
    sentences = extract_sentences(text)
    total_words = len(words)
    total_sentences = len(sentences)
    factors: List[LinguisticFactor] = []
    raw_score = 0.0

    # A. Lexical Diversity
    if total_words < 30:
        factors.append(
            LinguisticFactor(
                id="ttr",
                name="Lexical Diversity (Type-Token Ratio)",
                measuredValue="Insufficient text (<30 words)",
                scoreContribution=0.0,
                signalStrength="Neutral",
                isInsufficientData=True,
                explanation="Short texts produce misleading TTR. At least 30 words are needed for meaningful measurement.",
                interpretation="Insufficient data for lexical diversity calculation.",
            )
        )
    else:
        lower_words = [w.lower() for w in words]
        unique_words = len(set(lower_words))
        ttr = unique_words / total_words
        ttr_score = 0.0
        signal = "Neutral"
        interp = "Balanced vocabulary variety."

        if ttr < 0.42:
            ttr_score = 3.0
            signal = "Moderate"
            interp = "Low lexical variety (repetitive word usage)."
        elif ttr > 0.78 and total_words > 80:
            ttr_score = 2.0
            signal = "Low"
            interp = "Unusually high lexical variation across long passage."

        raw_score += ttr_score
        factors.append(
            LinguisticFactor(
                id="ttr",
                name="Lexical Diversity (Type-Token Ratio)",
                measuredValue=f"{ttr:.3f} ({(ttr * 100):.1f}%)",
                numericValue=round(ttr, 3),
                scoreContribution=ttr_score,
                signalStrength=signal,
                explanation=f"Type-token ratio of unique terms ({unique_words}) over total words ({total_words}).",
                interpretation=interp,
            )
        )

    # B. Sentence Length Variation & CV
    if total_sentences < 3:
        factors.append(
            LinguisticFactor(
                id="sentence_cv",
                name="Sentence Length Variation (Burstiness)",
                measuredValue="Insufficient text (<3 sentences)",
                scoreContribution=0.0,
                signalStrength="Neutral",
                isInsufficientData=True,
                explanation="At least 3 sentences are required to evaluate sentence length dispersion.",
                interpretation="Insufficient data to compute coefficient of variation.",
            )
        )
    else:
        sentence_lengths = [len(extract_words(s)) for s in sentences]
        mean = sum(sentence_lengths) / total_sentences
        variance = sum((l - mean) ** 2 for l in sentence_lengths) / (total_sentences - 1 if total_sentences > 1 else 1)
        std_dev = math.sqrt(variance)
        cv = std_dev / mean if mean > 0 else 0.0

        cv_score = 0.0
        signal = "Neutral"
        interp = "Natural human rhythmic variation in sentence cadence."

        if cv < 0.35 and total_sentences >= 4:
            cv_score = 6.0
            signal = "High"
            interp = "Low sentence variation (CV < 0.35); sentences exhibit unusually uniform rhythm."
        elif cv < 0.45 and total_sentences >= 4:
            cv_score = 3.0
            signal = "Moderate"
            interp = "Moderate uniformity in sentence structure."

        raw_score += cv_score
        factors.append(
            LinguisticFactor(
                id="sentence_cv",
                name="Sentence Length Variation (CV)",
                measuredValue=f"CV: {cv:.2f} (Mean: {mean:.1f} wps, SD: {std_dev:.1f})",
                numericValue=round(cv, 2),
                scoreContribution=cv_score,
                signalStrength=signal,
                explanation="Coefficient of variation (CV = SD / Mean). Lower values indicate uniform sentence cadence.",
                interpretation=interp,
            )
        )

    # C. Passive Voice
    passive_count = 0
    passive_pat = re.compile(
        r"\b(?:is|are|was|were|been|being|be)\s+([a-z]+ed|[a-z]+en|done|made|seen|found|given|known|taken|written|built|brought)\b",
        flags=re.IGNORECASE,
    )
    for s in sentences:
        if passive_pat.search(s):
            passive_count += 1

    passive_pct = (passive_count / total_sentences) * 100 if total_sentences > 0 else 0.0
    passive_score = 4.0 if (passive_pct > 35 and total_sentences >= 3) else 0.0
    raw_score += passive_score

    factors.append(
        LinguisticFactor(
            id="passive_voice",
            name="Passive Voice Frequency",
            measuredValue=f"{passive_pct:.1f}% ({passive_count}/{total_sentences} sentences)",
            numericValue=round(passive_pct, 1),
            scoreContribution=passive_score,
            signalStrength="Moderate" if passive_score > 0 else "Neutral",
            explanation='Estimated percentage of sentences utilizing passive construction ("to be" + past participle).',
            interpretation="Elevated passive voice density." if passive_score > 0 else "Typical active voice balance.",
        )
    )

    # D. Transition Word Density
    trans_count = 0
    for s in sentences:
        if any(re.search(rf"\b{m}\b", s, flags=re.IGNORECASE) for m in DISCOURSE_TRANSITIONS):
            trans_count += 1

    trans_pct = (trans_count / total_sentences) * 100 if total_sentences > 0 else 0.0
    trans_score = 4.0 if (trans_pct > 35 and total_sentences >= 3) else (2.0 if (trans_pct > 25 and total_sentences >= 3) else 0.0)
    raw_score += trans_score

    factors.append(
        LinguisticFactor(
            id="transition_words",
            name="Transition Word Density",
            measuredValue=f"{trans_pct:.1f}% ({trans_count}/{total_sentences} sentences)",
            numericValue=round(trans_pct, 1),
            scoreContribution=trans_score,
            signalStrength="High" if trans_score >= 4 else ("Moderate" if trans_score > 0 else "Neutral"),
            explanation="Frequency of formal discourse markers (furthermore, moreover, consequently, etc.).",
            interpretation="High concentration of formal transitions." if trans_score > 0 else "Natural transition frequency.",
        )
    )

    # E. Flesch-Kincaid
    if total_words < 30 or total_sentences == 0:
        factors.append(
            LinguisticFactor(
                id="flesch_kincaid",
                name="Flesch-Kincaid Grade Level",
                measuredValue="Insufficient text (<30 words)",
                scoreContribution=0.0,
                signalStrength="Neutral",
                isInsufficientData=True,
                explanation="At least 30 words required for reliable syllable-based readability grading.",
                interpretation="Readability score requires more sample text.",
            )
        )
    else:
        total_syllables = sum(count_syllables(w) for w in words)
        fk_grade = 0.39 * (total_words / total_sentences) + 11.8 * (total_syllables / total_words) - 15.59
        clamped_grade = max(1.0, min(20.0, round(fk_grade, 1)))
        level_label = "College/Professional" if clamped_grade >= 13 else ("High School" if clamped_grade >= 9 else "Middle School")
        factors.append(
            LinguisticFactor(
                id="flesch_kincaid",
                name="Flesch-Kincaid Grade Level",
                measuredValue=f"Grade {clamped_grade} ({level_label})",
                numericValue=clamped_grade,
                scoreContribution=0.0,
                signalStrength="Neutral",
                explanation="Readability index computed from syllables per word and words per sentence.",
                interpretation=f"Estimated reading comprehension level: Grade {clamped_grade}.",
            )
        )

    # F. Punctuation Patterns
    semicolons = len(re.findall(r";", text))
    em_dashes = len(re.findall(r"—|--", text))
    colons = len(re.findall(r"(?<!https?):", text))
    ellipses = len(re.findall(r"\.{3,}|…", text))
    punc_total = semicolons + em_dashes + colons + ellipses
    punc_density = f"{(punc_total / total_words * 100):.1f}" if total_words > 0 else "0.0"

    factors.append(
        LinguisticFactor(
            id="punctuation_patterns",
            name="Stylistic Punctuation Patterns",
            measuredValue=f"{punc_total} marks ({punc_density} per 100 words)",
            numericValue=punc_total,
            scoreContribution=0.0,
            signalStrength="Neutral",
            explanation=f"Semicolons: {semicolons}, Em-dashes: {em_dashes}, Colons: {colons}, Ellipses: {ellipses}.",
            interpretation="Punctuation distribution across clauses.",
        )
    )

    capped_score = min(raw_score, max_cap)
    occurrences = len([f for f in factors if f.scoreContribution > 0])

    det_result = DetectorResult(
        detectorId="statistical_metrics",
        name="Statistical & Linguistic Metrics",
        category="Statistical Stylometrics",
        group="statistical",
        detected=raw_score > 0,
        occurrences=occurrences,
        detectedTerms=[],
        rawScore=raw_score,
        cappedScore=capped_score,
        maxCap=max_cap,
        explanation=(
            f"Statistical stylometrics contributed {int(capped_score)}/{int(max_cap)} points."
            if raw_score > 0
            else "Statistical stylometrics fall within typical natural ranges."
        ),
        evidence=[],
    )

    return factors, det_result
