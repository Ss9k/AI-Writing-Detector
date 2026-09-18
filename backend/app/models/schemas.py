"""
AI Writing Detector - Python Data Models
Compatible with both Pydantic (if installed) and Python Standard Library dataclasses.
"""
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field, asdict

try:
    from pydantic import BaseModel, Field

    class TextStatisticsModel(BaseModel):
        charCount: int
        wordCount: int
        sentenceCount: int
        paragraphCount: int
        avgWordLength: float
        avgSentenceLength: float

    class DetectedEvidenceModel(BaseModel):
        id: str
        detectorId: str
        category: str
        matchedText: str
        startIndex: int
        endIndex: int
        explanation: str
        scoreWeight: float

    class DetectorResultModel(BaseModel):
        detectorId: str
        name: str
        category: str
        group: str
        detected: bool
        occurrences: int
        detectedTerms: Optional[List[str]] = None
        rawScore: float
        cappedScore: float
        maxCap: float
        explanation: str
        evidence: List[DetectedEvidenceModel] = []

    class LinguisticFactorModel(BaseModel):
        id: str
        name: str
        measuredValue: str
        numericValue: Optional[float] = None
        scoreContribution: float
        explanation: str
        signalStrength: str
        interpretation: str
        isInsufficientData: Optional[bool] = False

    class CategoryScoreSummaryModel(BaseModel):
        group: str
        label: str
        rawScore: float
        normalizedScore: float
        maxCap: float
        percentContribution: float

    class AnalysisReportModel(BaseModel):
        score: int
        rawScore: float
        classification: str
        timestamp: str
        statistics: TextStatisticsModel
        linguisticFactors: List[LinguisticFactorModel]
        detectors: List[DetectorResultModel]
        categorySummaries: List[CategoryScoreSummaryModel]
        evidence: List[DetectedEvidenceModel]
        disclaimer: str

    class AnalyzeRequestModel(BaseModel):
        text: str

    PYDANTIC_AVAILABLE = True

except ImportError:
    PYDANTIC_AVAILABLE = False


@dataclass
class TextStatistics:
    charCount: int
    wordCount: int
    sentenceCount: int
    paragraphCount: int
    avgWordLength: float
    avgSentenceLength: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class DetectedEvidence:
    id: str
    detectorId: str
    category: str
    matchedText: str
    startIndex: int
    endIndex: int
    explanation: str
    scoreWeight: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class DetectorResult:
    detectorId: str
    name: str
    category: str
    group: str
    detected: bool
    occurrences: int
    detectedTerms: List[str]
    rawScore: float
    cappedScore: float
    maxCap: float
    explanation: str
    evidence: List[DetectedEvidence] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class LinguisticFactor:
    id: str
    name: str
    measuredValue: str
    scoreContribution: float
    explanation: str
    signalStrength: str
    interpretation: str
    numericValue: Optional[float] = None
    isInsufficientData: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class CategoryScoreSummary:
    group: str
    label: str
    rawScore: float
    normalizedScore: float
    maxCap: float
    percentContribution: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AnalysisReport:
    score: int
    rawScore: float
    classification: str
    timestamp: str
    statistics: TextStatistics
    linguisticFactors: List[LinguisticFactor]
    detectors: List[DetectorResult]
    categorySummaries: List[CategoryScoreSummary]
    evidence: List[DetectedEvidence]
    disclaimer: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": self.score,
            "rawScore": self.rawScore,
            "classification": self.classification,
            "timestamp": self.timestamp,
            "statistics": self.statistics.to_dict(),
            "linguisticFactors": [f.to_dict() for f in self.linguisticFactors],
            "detectors": [d.to_dict() for d in self.detectors],
            "categorySummaries": [c.to_dict() for c in self.categorySummaries],
            "evidence": [e.to_dict() for e in self.evidence],
            "disclaimer": self.disclaimer,
        }
