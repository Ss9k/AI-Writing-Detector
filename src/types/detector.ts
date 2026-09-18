export interface TextStatistics {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordLength: number;
  avgSentenceLength: number;
}

export interface DetectedEvidence {
  id: string;
  detectorId: string;
  category: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  explanation: string;
  scoreWeight: number;
}

export interface DetectorResult {
  detectorId: string;
  name: string;
  category: string;
  group: 'vocabulary' | 'structural' | 'vague_language' | 'promotional' | 'statistical';
  detected: boolean;
  occurrences: number;
  detectedTerms?: string[];
  rawScore: number;
  cappedScore: number;
  maxCap: number;
  explanation: string;
  evidence: DetectedEvidence[];
}

export interface LinguisticFactor {
  id: string;
  name: string;
  measuredValue: string;
  numericValue?: number;
  scoreContribution: number;
  explanation: string;
  signalStrength: 'Low' | 'Moderate' | 'High' | 'Neutral';
  interpretation: string;
  isInsufficientData?: boolean;
}

export interface CategoryScoreSummary {
  group: 'vocabulary' | 'structural' | 'vague_language' | 'promotional' | 'statistical';
  label: string;
  rawScore: number;
  normalizedScore: number;
  maxCap: number;
  percentContribution: number;
}

export type ClassificationType =
  | 'Likely Human-Written'
  | 'Possibly AI-Generated'
  | 'Likely AI-Generated';

export interface AnalysisReport {
  score: number;
  rawScore: number;
  classification: ClassificationType;
  timestamp: string;
  statistics: TextStatistics;
  linguisticFactors: LinguisticFactor[];
  detectors: DetectorResult[];
  categorySummaries: CategoryScoreSummary[];
  evidence: DetectedEvidence[];
  disclaimer: string;
}

export interface AnalyzeRequest {
  text: string;
}

export interface AnalyzeResponse extends AnalysisReport {
  status: 'success' | 'error';
  message?: string;
}
