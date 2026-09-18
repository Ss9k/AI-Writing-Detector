import React, { useState } from 'react';
import { DetectorResult, DetectedEvidence } from '../types/detector.ts';
import { CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Quote } from 'lucide-react';

interface PatternDetectionListProps {
  detectors: DetectorResult[];
  onSelectEvidence?: (evidence: DetectedEvidence) => void;
}

export const PatternDetectionList: React.FC<PatternDetectionListProps> = ({
  detectors,
  onSelectEvidence,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [expandedDetectors, setExpandedDetectors] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedDetectors((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredDetectors = detectors.filter((d) => {
    if (d.detectorId === 'statistical_metrics') return false; // Handled in linguistic factors section
    if (selectedGroup === 'all') return true;
    return d.group === selectedGroup;
  });

  const detectedCount = filteredDetectors.filter((d) => d.detected).length;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            Detected AI-Style Patterns & Rhetoric
          </h3>
          <p className="text-xs text-neutral-500">
            Rule-based detection across formulaic syntax, vague attributions, and promotional buzzwords.
          </p>
        </div>

        {/* Group Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 rounded-xl text-xs font-medium text-neutral-600">
          {[
            { id: 'all', label: 'All Patterns' },
            { id: 'vocabulary', label: 'Vocabulary' },
            { id: 'structural', label: 'Structural' },
            { id: 'vague_language', label: 'Vague Language' },
            { id: 'promotional', label: 'Promotional' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedGroup(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedGroup === tab.id
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredDetectors.map((detector) => {
          const isExpanded = expandedDetectors[detector.detectorId] ?? detector.detected;

          return (
            <div
              key={detector.detectorId}
              className={`border rounded-xl transition-colors ${
                detector.detected
                  ? 'border-neutral-300 bg-neutral-50/40'
                  : 'border-neutral-200/70 bg-white opacity-85'
              }`}
            >
              <div
                onClick={() => toggleExpand(detector.detectorId)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-neutral-50/80 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      detector.detected
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {detector.detected ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">
                        {detector.name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                        {detector.category}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                      {detector.explanation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-neutral-900">
                      +{detector.cappedScore} pts
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {detector.occurrences} {detector.occurrences === 1 ? 'match' : 'matches'} (cap: {detector.maxCap})
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-neutral-200/60 mt-1">
                  <p className="text-neutral-600 mb-2.5 leading-relaxed">
                    {detector.explanation}
                  </p>

                  {/* Detected terms pill list for vocabulary */}
                  {detector.detectedTerms && detector.detectedTerms.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[11px] font-mono uppercase text-neutral-400 block mb-1.5 font-semibold">
                        Distinct Terms Identified ({detector.detectedTerms.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {detector.detectedTerms.map((term, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-800 font-mono text-xs shadow-2xs"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence Quotes */}
                  {detector.evidence.length > 0 ? (
                    <div>
                      <span className="text-[11px] font-mono uppercase text-neutral-400 block mb-1.5 font-semibold">
                        Evidence Quotes ({detector.evidence.length}):
                      </span>
                      <div className="space-y-1.5">
                        {detector.evidence.slice(0, 4).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => onSelectEvidence?.(ev)}
                            className="flex items-start gap-2 p-2 rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-2xs transition-all cursor-pointer"
                          >
                            <Quote className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-mono text-xs font-semibold text-neutral-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-100">
                                "{ev.matchedText}"
                              </span>
                              <span className="text-neutral-500 text-[11px] block mt-0.5">
                                {ev.explanation}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400 self-center">
                              +{ev.scoreWeight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-neutral-400 text-xs italic">
                      No patterns matched in this text.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
