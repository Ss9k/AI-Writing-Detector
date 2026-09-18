import React from 'react';
import { CategoryScoreSummary } from '../types/detector.ts';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface ScoreChartProps {
  categories: CategoryScoreSummary[];
  totalScore: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  vocabulary: '#3b82f6', // blue
  structural: '#8b5cf6', // purple
  vague_language: '#f59e0b', // amber
  promotional: '#ec4899', // pink
  statistical: '#10b981', // emerald
};

export const ScoreChart: React.FC<ScoreChartProps> = ({ categories, totalScore }) => {
  const chartData = categories.map((cat) => ({
    name: cat.label,
    group: cat.group,
    score: cat.normalizedScore,
    raw: cat.rawScore,
    cap: cat.maxCap,
    percent: cat.percentContribution,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-900 text-white text-xs rounded-lg p-3 shadow-lg border border-neutral-700">
          <p className="font-bold text-sm mb-1">{data.name}</p>
          <p className="text-neutral-300">
            Score Contribution:{' '}
            <span className="font-mono font-bold text-white">
              +{data.score} pts
            </span>{' '}
            (raw: {data.raw}, cap: {data.cap})
          </p>
          <p className="text-neutral-400 mt-1">
            Represents{' '}
            <span className="font-mono text-emerald-400 font-semibold">
              {data.percent}%
            </span>{' '}
            of total AI-likelihood score.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            Score Contribution by Category
          </h3>
          <p className="text-xs text-neutral-500">
            Relative weight of linguistic and structural markers towards the final score.
          </p>
        </div>
        <div className="text-xs font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
          Total Score: {totalScore}/100
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[0, (dataMax: number) => Math.max(15, Math.ceil(dataMax * 1.2))]}
              tick={{ fontSize: 11, fill: '#737373' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 12, fill: '#404040', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={18}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[entry.group] || '#64748b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown legend & caps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-4 pt-4 border-t border-neutral-100 text-xs">
        {categories.map((cat) => (
          <div key={cat.group} className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[cat.group] }}
              />
              <span className="font-semibold text-neutral-800 truncate text-[11px]">
                {cat.label}
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-neutral-900 font-bold">+{cat.normalizedScore}</span>
              <span className="text-neutral-400 text-[10px]">cap {cat.maxCap}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
