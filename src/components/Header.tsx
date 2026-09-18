import React from 'react';
import { ShieldCheck, BookOpen, Sparkles, History, UserCheck, Trash2 } from 'lucide-react';
import { SAMPLE_TEXTS } from '../engine/analyzer.ts';

interface HeaderProps {
  onLoadSample: (text: string, title: string) => void;
  onClear: () => void;
  onOpenDocs: () => void;
  hasText: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onClear,
  onOpenDocs,
  hasText,
}) => {
  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                AI Writing Detector
              </h1>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                Deterministic Engine v1.0
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              Analyze linguistic patterns — not authorship.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-medium text-neutral-700">
            <span className="px-2 py-1 text-neutral-400 font-mono text-[11px] hidden sm:inline">
              Load Sample:
            </span>
            <button
              id="sample-human-btn"
              onClick={() => onLoadSample(SAMPLE_TEXTS.human.text, SAMPLE_TEXTS.human.title)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white hover:text-neutral-900 hover:shadow-xs transition-all"
              title="Load naturally written human essay"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Human</span>
            </button>
            <button
              id="sample-ai-btn"
              onClick={() => onLoadSample(SAMPLE_TEXTS.ai.text, SAMPLE_TEXTS.ai.title)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white hover:text-neutral-900 hover:shadow-xs transition-all"
              title="Load formulaic AI-style text"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>AI-Style</span>
            </button>
            <button
              id="sample-historical-btn"
              onClick={() => onLoadSample(SAMPLE_TEXTS.historical.text, SAMPLE_TEXTS.historical.title)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white hover:text-neutral-900 hover:shadow-xs transition-all"
              title="Load Lincoln Gettysburg Address (1863)"
            >
              <History className="w-3.5 h-3.5 text-neutral-600" />
              <span>Historical (1863)</span>
            </button>
          </div>

          {hasText && (
            <button
              id="clear-text-btn"
              onClick={onClear}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
              title="Clear current text"
              aria-label="Clear current text"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            id="open-docs-btn"
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span>Methodology</span>
          </button>
        </div>
      </div>
    </header>
  );
};
