import { AnalysisReport } from '../types/detector.ts';
import { analyzeText } from '../engine/analyzer.ts';

/**
 * Service to execute analysis via REST API endpoint `/api/analyze`,
 * with seamless fallback to client-side engine execution.
 */
export async function analyzeTextAPI(text: string): Promise<AnalysisReport> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }

    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Server responded with status ${response.status}`);
  } catch (err) {
    console.warn('API route /api/analyze unavailable, executing local deterministic engine:', err);
    // Client-side fallback to the exact same deterministic engine
    return analyzeText(text);
  }
}
