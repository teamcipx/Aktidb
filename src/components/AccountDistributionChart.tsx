import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Sparkles, Database, Trophy, ShieldCheck, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

export interface PlatformStat {
  name: string;
  count: number;
  color: string;
  icon?: any;
}

interface AccountDistributionChartProps {
  stats: PlatformStat[];
  loading?: boolean;
}

const CUSTOM_COLORS: Record<string, string> = {
  'Projects': '#6366f1',       // indigo-500
  'ImgBB Keys': '#14b8a6',     // teal-500
  'FreeImg Keys': '#f59e0b',   // amber-500
  'Facebook': '#3b82f6',       // blue-500
  'Gmail': '#ef4444',          // red-500
  'Supabase': '#10b981',       // emerald-500
  'Github': '#94a3b8',         // slate-400
  'Brevo Mail': '#06b6d4',     // cyan-500
  'Vercel Cloud': '#a855f7',   // purple-500
  'Contacts': '#eab308',       // yellow-500
  'Special FB': '#f43f5e',     // rose-500
  'Special Gmail': '#ec4899',  // pink-500
};

export default function AccountDistributionChart({ stats, loading }: AccountDistributionChartProps) {
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalAccounts = stats.reduce((sum, item) => sum + item.count, 0);

  // Filter out items with 0 count for cleaner charts, but keep if all are 0
  const chartData = stats
    .map(item => ({
      name: item.name,
      value: item.count,
      color: CUSTOM_COLORS[item.name] || '#6366f1',
      percentage: totalAccounts > 0 ? ((item.count / totalAccounts) * 100).toFixed(1) : '0'
    }))
    .sort((a, b) => b.value - a.value);

  const topPlatform = chartData.length > 0 && chartData[0].value > 0 ? chartData[0] : null;

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 font-sans text-xs">
          <div className="flex items-center space-x-2 font-bold mb-1">
            <span 
              className="w-3 h-3 rounded-full inline-block shrink-0" 
              style={{ backgroundColor: data.color }}
            ></span>
            <span className="text-white text-sm">{data.name}</span>
          </div>
          <div className="space-y-0.5 text-[11px] text-slate-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Total Records:</span>
              <span className="font-mono font-bold text-white">{data.value}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Distribution Share:</span>
              <span className="font-mono font-bold text-teal-300">{data.percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden font-sans space-y-5">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/5 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Widget Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-teal-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
              Platform Distribution Visualizer
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold uppercase tracking-wider">
                Recharts Analytics
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Visual breakdown of account credentials & assets across platforms
            </p>
          </div>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setChartType('donut')}
            className={cn(
              "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              chartType === 'donut'
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Donut</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={cn(
              "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              chartType === 'bar'
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar Chart</span>
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Container */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-mono animate-pulse">
          Loading platform distribution chart...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Chart Display Area (2 Cols) */}
          <div className="lg:col-span-2 h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'donut' ? (
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="#0f172a" 
                        strokeWidth={2}
                        className="transition-all duration-300 hover:opacity-80"
                        style={{
                          filter: activeIndex === index ? 'drop-shadow(0px 0px 8px rgba(99, 102, 241, 0.6))' : 'none'
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>

            {/* Center Donut Label */}
            {chartType === 'donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  {totalAccounts}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Total Records
                </span>
              </div>
            )}
          </div>

          {/* Side Legend & Summary Panel (1 Col) */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" /> Platform Breakdown
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {chartData.length} Categories
              </span>
            </div>

            {/* Top Leader Card */}
            {topPlatform && (
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">
                      Top Category
                    </span>
                    <span className="font-bold text-white">{topPlatform.name}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-extrabold text-indigo-300 block">{topPlatform.value}</span>
                  <span className="text-[10px] text-slate-400">{topPlatform.percentage}%</span>
                </div>
              </div>
            )}

            {/* Scrollable Mini Legend */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {chartData.map((item) => (
                <div 
                  key={item.name} 
                  className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-slate-300 truncate font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-[11px] shrink-0">
                    <span className="text-slate-100 font-bold">{item.value}</span>
                    <span className="text-slate-500 text-[10px]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
