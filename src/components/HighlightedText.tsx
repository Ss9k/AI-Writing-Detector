import React, { useState } from 'react';
import { DetectedEvidence } from '../types/detector.ts';
import { Sparkles, Eye, Info } from 'lucide-react';

interface HighlightedTextProps {
  rawText: string;
  evidence: DetectedEvidence[];
  activeEvidenceId?: string | null;
  onSelectEvidence?: (ev: DetectedEvidence | null) => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  'AI Vocabulary': {
    bg: 'bg-blue-100 hover:bg-blue-200',
    border: 'border-b-2 border-blue-500',
    text: 'text-blue-950',
    label: 'AI Vocabulary',
  },
  'Rule of Three': {
    bg: 'bg-purple-100 hover:bg-purple-200',
    border: 'border-b-2 border-purple-500',
    text: 'text-purple-950',
    label: 'Structural Triad',
  },
  'Negative Parallelism': {
    bg: 'bg-indigo-100 hover:bg-indigo-200',
    border: 'border-b-2 border-indigo-500',
    text: 'text-indigo-950',
    label: 'Negative Parallelism',
  },
  'Outline-Style Conclusion': {
    bg: 'bg-violet-100 hover:bg-violet-200',
    border: 'border-b-2 border-violet-500',
    text: 'text-violet-950',
    label: 'Outline Conclusion',
  },
  'False Ranges': {
    bg: 'bg-fuchsia-100 hover:bg-fuchsia-200',
    border: 'border-b-2 border-fuchsia-500',
    text: 'text-fuchsia-950',
    label: 'False Range Sweep',
  },
  'Vague Attribution': {
    bg: 'bg-amber-100 hover:bg-amber-200',
    border: 'border-b-2 border-amber-500',
    text: 'text-amber-950',
    label: 'Vague Attribution',
  },
  'Superficial Analysis': {
    bg: 'bg-orange-100 hover:bg-orange-200',
    border: 'border-b-2 border-orange-500',
    text: 'text-orange-950',
    label: 'Superficial Filler',
  },
  Overgeneralisation: {
    bg: 'bg-yellow-100 hover:bg-yellow-200',
    border: 'border-b-2 border-yellow-500',
    text: 'text-yellow-950',
    label: 'Overgeneralisation',
  },
  'Undue Emphasis': {
    bg: 'bg-pink-100 hover:bg-pink-200',
    border: 'border-b-2 border-pink-500',
    text: 'text-pink-950',
    label: 'Undue Emphasis',
  },
  'Promotional Language': {
    bg: 'bg-rose-100 hover:bg-rose-200',
    border: 'border-b-2 border-rose-500',
    text: 'text-rose-950',
    label: 'Promotional Buzzword',
  },
  'Elegant Variation': {
    bg: 'bg-teal-100 hover:bg-teal-200',
    border: 'border-b-2 border-teal-500',
    text: 'text-teal-950',
    label: 'Elegant Variation',
  },
};

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  rawText,
  evidence,
  activeEvidenceId,
  onSelectEvidence,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [hoveredEv, setHoveredEv] = useState<DetectedEvidence | null>(null);

  // Filter evidence if user selected a filter
  const activeEvidence = evidence.filter((ev) => {
    if (selectedFilter === 'all') return true;
    return ev.category.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  // Sort evidence by start position to split text into segments
  const sortedEvidence = [...activeEvidence].sort((a, b) => a.startIndex - b.startIndex);

  // Build text segments
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const ev of sortedEvidence) {
    // Check bounds
    const start = Math.max(cursor, Math.min(rawText.length, ev.startIndex));
    const end = Math.max(start, Math.min(rawText.length, ev.endIndex));

    // Normal text before this evidence
    if (start > cursor) {
      segments.push(
        <span key={`text-${cursor}-${start}`}>
          {rawText.slice(cursor, start)}
        </span>
      );
    }

    // Highlighted span
    const style = CATEGORY_STYLES[ev.category] || {
      bg: 'bg-amber-100 hover:bg-amber-200',
      border: 'border-b-2 border-amber-500',
      text: 'text-amber-950',
      label: ev.category,
    };

    const isSelected = activeEvidenceId === ev.id;

    segments.push(
      <mark
        key={`ev-${ev.id}`}
        onClick={() => onSelectEvidence?.(ev)}
        onMouseEnter={() => setHoveredEv(ev)}
        onMouseLeave={() => setHoveredEv(null)}
        className={`cursor-pointer rounded-xs px-0.5 transition-all inline-block ${style.bg} ${style.border} ${style.text} ${
          isSelected ? 'ring-2 ring-neutral-900 ring-offset-1 font-semibold' : ''
        }`}
        title={`${ev.category}: ${ev.explanation}`}
      >
        {rawText.slice(start, end)}
      </mark>
    );

    cursor = end;
  }

  // Trailing text
  if (cursor < rawText.length) {
    segments.push(
      <span key={`text-tail-${cursor}`}>
        {rawText.slice(cursor)}
      </span>
    );
  }

  const activeInspection = hoveredEv || (activeEvidenceId ? evidence.find((e) => e.id === activeEvidenceId) : null);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-neutral-700">
          <Eye className="w-3.5 h-3.5 text-neutral-500" />
          <span>Evidence Highlights:</span>
          <span className="font-mono bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded-md font-semibold text-[11px]">
            {sortedEvidence.length} matches
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              selectedFilter === 'all'
                ? 'bg-neutral-800 text-white font-medium'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('vocabulary')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              selectedFilter === 'vocabulary'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-white border border-neutral-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            Vocabulary
          </button>
          <button
            onClick={() => setSelectedFilter('three')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              selectedFilter === 'three'
                ? 'bg-purple-600 text-white font-medium'
                : 'bg-white border border-neutral-200 text-purple-700 hover:bg-purple-50'
            }`}
          >
            Triads
          </button>
          <button
            onClick={() => setSelectedFilter('vague')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              selectedFilter === 'vague'
                ? 'bg-amber-600 text-white font-medium'
                : 'bg-white border border-neutral-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            Vague Language
          </button>
          <button
            onClick={() => setSelectedFilter('promotional')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              selectedFilter === 'promotional'
                ? 'bg-rose-600 text-white font-medium'
                : 'bg-white border border-neutral-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            Promotional
          </button>
        </div>
      </div>

      {/* Main Text Canvas */}
      <div className="p-5 overflow-y-auto max-h-[480px] font-serif text-[15px] leading-relaxed text-neutral-800 whitespace-pre-wrap selection:bg-neutral-200">
        {segments.length > 0 ? segments : rawText}
      </div>

      {/* Bottom Inspection Card */}
      <div className="p-3 bg-neutral-50/90 border-t border-neutral-200 text-xs">
        {activeInspection ? (
          <div className="flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900">
                    {activeInspection.category}
                  </span>
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-700 font-semibold">
                    "{activeInspection.matchedText}"
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    pos {activeInspection.startIndex}–{activeInspection.endIndex}
                  </span>
                </div>
                <p className="text-neutral-600 mt-0.5 text-[11px]">
                  {activeInspection.explanation}
                </p>
              </div>
            </div>
            <div className="text-right font-mono flex-shrink-0">
              <span className="text-xs font-bold text-neutral-900">
                +{activeInspection.scoreWeight} pts
              </span>
            </div>
          </div>
        ) : (
          <div className="text-neutral-400 text-xs italic flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hover or click any highlighted span to inspect the exact heuristic rule and weight.</span>
          </div>
        )}
      </div>
    </div>
  );
};
