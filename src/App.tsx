import React, { useState, useEffect, useRef } from 'react';
import { AnalysisReport, DetectedEvidence } from './types/detector.ts';
import { analyzeTextAPI } from './services/api.ts';
import { SAMPLE_TEXTS } from './engine/analyzer.ts';
import { Header } from './components/Header.tsx';
import { ScoreCard } from './components/ScoreCard.tsx';
import { ScoreChart } from './components/ScoreChart.tsx';
import { TextStatisticsGrid } from './components/TextStatisticsGrid.tsx';
import { LinguisticFactorsGrid } from './components/LinguisticFactorsGrid.tsx';
import { PatternDetectionList } from './components/PatternDetectionList.tsx';
import { HighlightedText } from './components/HighlightedText.tsx';
import { MethodologyModal } from './components/MethodologyModal.tsx';
import {
  Play,
  Edit3,
  Eye,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXTS.ai.text);
  const [activeSampleTitle, setActiveSampleTitle] = useState<string>(SAMPLE_TEXTS.ai.title);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'highlights'>('highlights');
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [selectedEvidence, setSelectedEvidence] = useState<DetectedEvidence | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live input metrics
  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  // Run analysis function
  const runAnalysis = async (textToAnalyze?: string) => {
    const text = (textToAnalyze !== undefined ? textToAnalyze : inputText).trim();

    if (!text) {
      setErrorMessage('Please enter or paste some text to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await analyzeTextAPI(text);
      setReport(result);
      setViewMode('highlights');
      setSelectedEvidence(null);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err?.message || 'An error occurred during text analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial analysis on load with the default sample text
  useEffect(() => {
    runAnalysis(SAMPLE_TEXTS.ai.text);
  }, []);

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter to run analysis
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runAnalysis();
    }
  };

  const handleLoadSample = (text: string, title: string) => {
    setInputText(text);
    setActiveSampleTitle(title);
    setErrorMessage(null);
    runAnalysis(text);
  };

  const handleClear = () => {
    setInputText('');
    setActiveSampleTitle('');
    setReport(null);
    setErrorMessage(null);
    setSelectedEvidence(null);
    setViewMode('editor');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleEvidenceSelect = (ev: DetectedEvidence | null) => {
    setSelectedEvidence(ev);
    setViewMode('highlights');
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      <Header
        onLoadSample={handleLoadSample}
        onClear={handleClear}
        onOpenDocs={() => setIsDocsOpen(true)}
        hasText={charCount > 0}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Notification / Error Alert */}
        {errorMessage && (
          <div
            id="error-alert-banner"
            className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-shake"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Two-Column or Stacked Core Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Text Input & Evidence Highlighter (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs flex flex-col h-full">
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-mono">
                    Input Text
                  </span>
                  {activeSampleTitle && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                      {activeSampleTitle}
                    </span>
                  )}
                </div>

                {report && (
                  <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg text-xs font-medium">
                    <button
                      id="view-highlights-tab"
                      onClick={() => setViewMode('highlights')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                        viewMode === 'highlights'
                          ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                          : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Evidence View</span>
                    </button>
                    <button
                      id="view-editor-tab"
                      onClick={() => setViewMode('editor')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                        viewMode === 'editor'
                          ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                          : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Editor</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport: Either Highlighted Evidence or Textarea */}
              <div className="flex-1 min-h-[380px] lg:min-h-[460px] py-3">
                {viewMode === 'highlights' && report ? (
                  <HighlightedText
                    rawText={inputText}
                    evidence={report.evidence}
                    activeEvidenceId={selectedEvidence?.id}
                    onSelectEvidence={(ev) => setSelectedEvidence(ev)}
                  />
                ) : (
                  <textarea
                    ref={textareaRef}
                    id="detector-input-textarea"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (activeSampleTitle) setActiveSampleTitle('');
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste or type any arbitrary article, essay, or paragraph here to analyze linguistic markers and statistical burstiness..."
                    className="w-full h-full min-h-[380px] lg:min-h-[460px] p-4 text-sm font-sans text-neutral-800 placeholder-neutral-400 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all resize-none leading-relaxed"
                  />
                )}
              </div>

              {/* Editor Footer / Action Bar */}
              <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 font-mono text-neutral-500 text-[11px]">
                  <span>
                    <strong className="text-neutral-800">{wordCount}</strong> words
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-neutral-800">{charCount}</strong> characters
                  </span>
                  {wordCount > 0 && wordCount < 30 && (
                    <span className="text-amber-600 font-sans hidden sm:inline">
                      (&lt;30 words: stylometry accuracy is limited)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                    ⌘+Enter
                  </span>
                  <button
                    id="analyze-submit-btn"
                    onClick={() => runAnalysis()}
                    disabled={isLoading || !inputText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analyzing Text...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Analyze Linguistic Patterns</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Analysis Dashboard (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col space-y-5">
            {report ? (
              <>
                {/* Score Card */}
                <ScoreCard report={report} onReset={handleClear} />

                {/* Score Contribution Chart */}
                <ScoreChart
                  categories={report.categorySummaries}
                  totalScore={report.score}
                />

                {/* Step 1: Text Statistics */}
                <TextStatisticsGrid statistics={report.statistics} />

                {/* Step 6: Linguistic Factors */}
                <LinguisticFactorsGrid factors={report.linguisticFactors} />

                {/* Steps 2-5: Pattern Detections */}
                <PatternDetectionList
                  detectors={report.detectors}
                  onSelectEvidence={handleEvidenceSelect}
                />
              </>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <Sparkles className="w-6 h-6 text-neutral-500" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-neutral-900">
                    Awaiting Text Input
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Paste text into the editor or select one of the pre-loaded sample texts to run the multi-factor deterministic stylometry engine.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => handleLoadSample(SAMPLE_TEXTS.human.text, SAMPLE_TEXTS.human.title)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                  >
                    Load Human Sample
                  </button>
                  <button
                    onClick={() => handleLoadSample(SAMPLE_TEXTS.ai.text, SAMPLE_TEXTS.ai.title)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                  >
                    Load AI Sample
                  </button>
                  <button
                    onClick={() => handleLoadSample(SAMPLE_TEXTS.historical.text, SAMPLE_TEXTS.historical.title)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                  >
                    Load Historical Sample
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-4 mt-12 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">AI Writing Detector</span>
            <span>—</span>
            <span>Deterministic NLP Stylometry & Heuristic Pattern Engine</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <button
              onClick={() => setIsDocsOpen(true)}
              className="hover:text-neutral-700 underline"
            >
              Methodology & Scoring Specs
            </button>
            <span>•</span>
            <span>No LLM Dependency</span>
          </div>
        </div>
      </footer>

      {/* Methodology Documentation Modal */}
      <MethodologyModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}
