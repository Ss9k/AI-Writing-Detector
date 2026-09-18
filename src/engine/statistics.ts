import { TextStatistics } from '../types/detector.ts';

/**
 * Split text into tokens and sentences using deterministic regex heuristics.
 */
export function extractWords(text: string): string[] {
  const matches = text.match(/\b[a-zA-Z0-9'-]+\b/g);
  return matches ? matches.filter((w) => /[a-zA-Z0-9]/.test(w)) : [];
}

/**
 * Split text into sentences, protecting common abbreviations and decimal numbers.
 */
export function extractSentences(text: string): string[] {
  if (!text.trim()) return [];

  // Temporarily mask common abbreviations and decimals to prevent erroneous sentence splits
  const protectedText = text
    .replace(/\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|e\.g|i\.e|U\.S|Jan|Feb|Mar|Apr|Aug|Sept|Oct|Nov|Dec)\./gi, '$1__DOT__')
    .replace(/(\d+)\.(\d+)/g, '$1__DEC__$2');

  const rawSplits = protectedText.split(/(?<=[.!?])\s+(?=[A-Z0-9"“'‘(])/);

  const sentences: string[] = [];
  for (const s of rawSplits) {
    const restored = s
      .replace(/__DOT__/g, '.')
      .replace(/__DEC__/g, '.')
      .trim();
    if (restored.length > 0) {
      sentences.push(restored);
    }
  }

  // Fallback if regex resulted in no sentences but text is present
  if (sentences.length === 0 && text.trim().length > 0) {
    return [text.trim()];
  }

  return sentences;
}

/**
 * Extract non-empty paragraphs.
 */
export function extractParagraphs(text: string): string[] {
  if (!text.trim()) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Compute Step 1 Basic Text Statistics.
 */
export function calculateStatistics(text: string): TextStatistics {
  const charCount = text.length;
  const words = extractWords(text);
  const wordCount = words.length;
  const sentences = extractSentences(text);
  const sentenceCount = sentences.length;
  const paragraphs = extractParagraphs(text);
  const paragraphCount = paragraphs.length;

  const totalWordChars = words.reduce((acc, w) => acc + w.replace(/['-]/g, '').length, 0);
  const avgWordLength = wordCount > 0 ? Number((totalWordChars / wordCount).toFixed(1)) : 0;
  const avgSentenceLength = sentenceCount > 0 ? Number((wordCount / sentenceCount).toFixed(1)) : 0;

  return {
    charCount,
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordLength,
    avgSentenceLength,
  };
}
