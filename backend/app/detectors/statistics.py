import re
from typing import List
from ..models.schemas import TextStatistics


def extract_words(text: str) -> List[str]:
    matches = re.findall(r"\b[a-zA-Z0-9'-]+\b", text)
    return [w for w in matches if re.search(r"[a-zA-Z0-9]", w)]


def extract_sentences(text: str) -> List[str]:
    if not text.strip():
        return []

    # Protect abbreviations and decimals
    protected = re.sub(
        r"\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|e\.g|i\.e|U\.S|Jan|Feb|Mar|Apr|Aug|Sept|Oct|Nov|Dec)\.",
        r"\1__DOT__",
        text,
        flags=re.IGNORECASE,
    )
    protected = re.sub(r"(\d+)\.(\d+)", r"\1__DEC__\2", protected)

    raw_splits = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"“'‘(])", protected)

    sentences = []
    for s in raw_splits:
        restored = s.replace("__DOT__", ".").replace("__DEC__", ".").strip()
        if restored:
            sentences.push(restored) if hasattr(sentences, "push") else sentences.append(restored)

    if not sentences and text.strip():
        return [text.strip()]

    return sentences


def extract_paragraphs(text: str) -> List[str]:
    if not text.strip():
        return []
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def calculate_statistics(text: str) -> TextStatistics:
    char_count = len(text)
    words = extract_words(text)
    word_count = len(words)
    sentences = extract_sentences(text)
    sentence_count = len(sentences)
    paragraphs = extract_paragraphs(text)
    paragraph_count = len(paragraphs)

    total_word_chars = sum(len(re.sub(r"['-]", "", w)) for w in words)
    avg_word_length = round(total_word_chars / word_count, 1) if word_count > 0 else 0.0
    avg_sentence_length = round(word_count / sentence_count, 1) if sentence_count > 0 else 0.0

    return TextStatistics(
        charCount=char_count,
        wordCount=word_count,
        sentenceCount=sentence_count,
        paragraphCount=paragraph_count,
        avgWordLength=avg_word_length,
        avgSentenceLength=avg_sentence_length,
    )
