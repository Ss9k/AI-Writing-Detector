import React from 'react';
import { X, BookOpen, Scale, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Methodology & Scientific Documentation
              </h2>
              <p className="text-xs text-neutral-500">
                Deterministic stylometry and linguistic heuristic rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-neutral-700 leading-relaxed">
          {/* Core Philosophy */}
          <section className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80">
            <div className="flex items-center gap-2 font-bold text-neutral-900 mb-2">
              <Cpu className="w-4 h-4 text-neutral-600" />
              <h3>1. Core Architecture Philosophy</h3>
            </div>
            <p className="text-xs text-neutral-600 mb-2">
              Unlike commercial "black box" neural network detectors that produce opaque probabilities, this system is <strong>100% deterministic and rule-based</strong>:
            </p>
            <ul className="list-disc pl-5 text-xs text-neutral-600 space-y-1">
              <li><strong>Zero External APIs:</strong> No calls to third-party LLMs or opaque classifiers.</li>
              <li><strong>Auditable Evidence:</strong> Every point contributed to the score corresponds to an exact substring match or measurable statistical metric.</li>
              <li><strong>Reproducible:</strong> Given the same text, the engine produces the exact same score, offsets, and breakdown every time.</li>
            </ul>
          </section>

          {/* Scoring Tiers */}
          <section>
            <div className="flex items-center gap-2 font-bold text-neutral-900 mb-3">
              <Scale className="w-4 h-4 text-neutral-600" />
              <h3>2. Classification Thresholds</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="font-bold font-mono text-emerald-800 text-sm block">0 – 29</span>
                <span className="font-semibold text-emerald-900 block mt-0.5">Likely Human-Written</span>
                <p className="text-emerald-700 mt-1 text-[11px]">
                  Text displays idiosyncratic variance, natural sentence cadence, and low density of formulaic AI transitions.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="font-bold font-mono text-amber-800 text-sm block">30 – 59</span>
                <span className="font-semibold text-amber-900 block mt-0.5">Possibly AI-Generated</span>
                <p className="text-amber-700 mt-1 text-[11px]">
                  Moderate frequency of formal transitional rhetoric, triads, or signature corporate vocabulary.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                <span className="font-bold font-mono text-rose-800 text-sm block">60 – 100</span>
                <span className="font-semibold text-rose-900 block mt-0.5">Likely AI-Generated</span>
                <p className="text-rose-700 mt-1 text-[11px]">
                  High concentration of AI-associated clichés, uniform sentence length (burstiness &lt; 0.35), and outline conclusions.
                </p>
              </div>
            </div>
          </section>

          {/* 6 Steps Overview */}
          <section className="space-y-3">
            <h3 className="font-bold text-neutral-900">3. The 6 Analysis Steps</h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg border border-neutral-200 bg-white">
                <strong className="text-neutral-900 block">Step 1 — Statistical Characterization:</strong>
                <p className="text-neutral-600 mt-0.5">
                  Tokenizes words, clauses, sentences (with abbreviation protection), and paragraphs. Computes mean word length and sentence length.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-white">
                <strong className="text-neutral-900 block">Step 2 — Signature AI Vocabulary:</strong>
                <p className="text-neutral-600 mt-0.5">
                  Flags high-frequency LLM terms ("delve into", "tapestry", "multifaceted", "beacon", "testament to", "ecosystem", "seamlessly"). Capped at 15 points.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-white">
                <strong className="text-neutral-900 block">Step 3 — Structural Patterns & Rhetoric:</strong>
                <p className="text-neutral-600 mt-0.5">
                  Identifies rule-of-three triad parallelism, "not only... but also..." antithesis, formulaic outline conclusions ("While X remains..., Y offers..."), and false range sweeps.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-white">
                <strong className="text-neutral-900 block">Step 4 — Vague Language & Phantom Authorities:</strong>
                <p className="text-neutral-600 mt-0.5">
                  Flags claims attributing authority to "experts agree" or "studies show" without concrete dates, authors, or journal citations. Academic citations with years (e.g. 2024) or "et al." are explicitly exempted.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-white">
                <strong className="text-neutral-900 block">Step 5 — Promotional Hyperbole & Elegant Variation:</strong>
                <p className="text-neutral-600 mt-0.5">
                  Detects intensifiers ("revolutionary", "game-changer", "groundbreaking") and rotational entity synonym hopping within conceptual clusters.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-white">
                <strong className="text-neutral-900 block">Step 6 — Statistical Stylometrics:</strong>
                <p className="text-neutral-600 mt-0.5">
                  Calculates Type-Token Ratio (lexical diversity), Sentence Length Coefficient of Variation (CV &lt; 0.35 signals mechanical uniformity), passive voice proportion, and Flesch-Kincaid reading levels.
                </p>
              </div>
            </div>
          </section>

          {/* Scientific Honesty & False Positives */}
          <section className="bg-amber-50/70 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3>4. Scientific Limitations & Classical Rhetoric</h3>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed mb-2">
              Skilled human authors (such as Abraham Lincoln in the Gettysburg Address, Martin Luther King Jr., or Winston Churchill) deliberately employ tricolon (rule of three) and antithetical parallelism for rhetorical power.
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Therefore, a high heuristic score indicates that a text resembles modern machine output in its structural traits, but <strong>should never be treated as legal or academic proof of automated generation</strong>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
