import React, { useState } from 'react';
import { AnalysisReport } from '../types/detector.ts';
import { formatReportMarkdown, downloadJsonReport } from '../utils/reportExporter.ts';
import { Check, Copy, Download, Info, AlertTriangle, RefreshCw } from 'lucide-react';

interface ScoreCardProps {
  report: AnalysisReport;
  onReset: () => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ report, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const markdown = formatReportMarkdown(report);
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    downloadJsonReport(report);
  };

  // Color mappings based on classification
  const getTheme = () => {
    if (report.score <= 29) {
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        ring: 'stroke-emerald-500',
        track: 'stroke-emerald-100',
      };
    }
    if (report.score <= 59) {
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        ring: 'stroke-amber-500',
        track: 'stroke-amber-100',
      };
    }
    return {
      bg: 'bg-rose-500/10',
      border: 'border-rose-200',
      text: 'text-rose-700',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      ring: 'stroke-rose-500',
      track: 'stroke-rose-100',
    };
  };

  const theme = getTheme();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.score / 100) * circumference;

  return (
    <div
      id="analysis-score-card"
      className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs relative overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Score Gauge & Classification */}
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={theme.track}
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`${theme.ring} transition-all duration-700 ease-out`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black tracking-tight text-neutral-900 font-mono">
                {report.score}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold font-mono">
                / 100
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${theme.badgeBg}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {report.classification}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                Raw: {report.rawScore} pts
              </span>
            </div>

            <h2 className="text-lg font-bold text-neutral-900">
              AI-Likelihood Heuristic Score
            </h2>

            <p className="text-xs text-neutral-500 max-w-md leading-relaxed">
              Calculated from multi-signal deterministic stylometry, formulaic syntax, and signature vocabulary density.
            </p>
          </div>
        </div>

        {/* Right: Actions & Timestamp */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-neutral-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="copy-report-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied Markdown!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              id="export-json-btn"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Export JSON</span>
            </button>

            <button
              id="analyze-another-btn"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
              <span>New Analysis</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400">
            Analyzed at: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Scientific honesty disclaimer strip */}
      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-start gap-2.5 text-xs text-neutral-500">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="leading-normal">
          <strong className="text-neutral-700">Scientific Honesty Notice:</strong> This score represents linguistic and statistical similarity to machine-generated prose based on deterministic rules. It is an exploratory indicator, <strong className="text-neutral-700">not proof of authorship</strong>.
        </p>
      </div>
    </div>
  );
};
