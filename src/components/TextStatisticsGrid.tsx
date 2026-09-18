import React from 'react';
import { TextStatistics } from '../types/detector.ts';
import { AlignLeft, Hash, FileText, Layers, SpellCheck, SplitSquareVertical } from 'lucide-react';

interface TextStatisticsGridProps {
  statistics: TextStatistics;
}

export const TextStatisticsGrid: React.FC<TextStatisticsGridProps> = ({ statistics }) => {
  const statItems = [
    {
      label: 'Characters',
      value: statistics.charCount.toLocaleString(),
      subtext: 'Total character length',
      icon: Hash,
    },
    {
      label: 'Words',
      value: statistics.wordCount.toLocaleString(),
      subtext: 'Tokenized word count',
      icon: AlignLeft,
    },
    {
      label: 'Sentences',
      value: statistics.sentenceCount.toLocaleString(),
      subtext: 'Abbreviation-safe splits',
      icon: SplitSquareVertical,
    },
    {
      label: 'Paragraphs',
      value: statistics.paragraphCount.toLocaleString(),
      subtext: 'Structured text blocks',
      icon: Layers,
    },
    {
      label: 'Avg Word Length',
      value: `${statistics.avgWordLength} chars`,
      subtext: 'Characters per word',
      icon: SpellCheck,
    },
    {
      label: 'Avg Sentence Length',
      value: `${statistics.avgSentenceLength} wps`,
      subtext: 'Words per sentence',
      icon: FileText,
    },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-neutral-900">
          Basic Text Statistics
        </h3>
        <span className="text-[11px] font-mono text-neutral-400">Step 1 Metrics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium text-neutral-600 truncate">{item.label}</span>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              </div>
              <div>
                <span className="text-lg font-bold font-mono text-neutral-900 block">
                  {item.value}
                </span>
                <span className="text-[10px] text-neutral-400 truncate block">
                  {item.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
