import React from 'react';
import { LinguisticFactor } from '../types/detector.ts';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface LinguisticFactorsGridProps {
  factors: LinguisticFactor[];
}

export const LinguisticFactorsGrid: React.FC<LinguisticFactorsGridProps> = ({ factors }) => {
  const getSignalBadge = (strength: LinguisticFactor['signalStrength']) => {
    switch (strength) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> High AI Signal
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            <TrendingUp className="w-3 h-3" /> Moderate Signal
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
            <Activity className="w-3 h-3" /> Low Signal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
            <CheckCircle2 className="w-3 h-3 text-neutral-400" /> Neutral
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            Linguistic & Stylometric Properties
          </h3>
          <p className="text-xs text-neutral-500">
            Statistical distribution metrics across vocabulary, syntax cadence, and readability.
          </p>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">Step 6 Factor Analysis</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {factors.map((factor) => {
          return (
            <div
              key={factor.id}
              className={`p-4 rounded-xl border transition-all ${
                factor.scoreContribution > 0
                  ? 'bg-amber-50/30 border-amber-200/80 shadow-xs'
                  : 'bg-neutral-50/50 border-neutral-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-neutral-900 leading-snug">
                  {factor.name}
                </span>
                {getSignalBadge(factor.signalStrength)}
              </div>

              <div className="mb-2">
                <span className="text-base font-bold font-mono text-neutral-900 block">
                  {factor.measuredValue}
                </span>
                <span className="text-xs font-medium text-neutral-600 block mt-0.5">
                  {factor.interpretation}
                </span>
              </div>

              <div className="text-[11px] text-neutral-500 leading-relaxed border-t border-neutral-200/60 pt-2 flex items-start gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span>{factor.explanation}</span>
              </div>

              {factor.scoreContribution > 0 && (
                <div className="mt-2.5 pt-1.5 flex items-center justify-between text-xs font-mono border-t border-dashed border-amber-200">
                  <span className="text-amber-800 font-medium">Detector Weight:</span>
                  <span className="font-bold text-amber-700">+{factor.scoreContribution} pts</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
