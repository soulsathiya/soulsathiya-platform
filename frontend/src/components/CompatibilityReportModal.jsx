import React from 'react';
import { X, TrendingUp } from 'lucide-react';
import RadarChart from './RadarChart';

const getOutlook = (score) => {
  if (score > 85) return { text: 'Very promising long-term compatibility.', color: '#D4AF37' };
  if (score >= 75) return { text: 'Good compatibility with areas for growth.', color: '#c49b2f' };
  if (score >= 65) return { text: 'Moderate compatibility requiring mutual effort.', color: 'hsl(25,70%,55%)' };
  return            { text: 'Meaningful differences exist — open communication will be key.', color: 'hsl(0,55%,55%)' };
};

/**
 * CompatibilityReportModal
 * Props:
 *   compatibility  — full response from GET /api/compatibility/{id}
 *   targetName     — display name of the other user
 *   displayRows    — [{ label, value, insight }] pre-built by CompatibilityCard
 *   onClose        — callback to close
 */
const CompatibilityReportModal = ({ compatibility, targetName, displayRows = [], onClose }) => {
  const score   = compatibility?.compatibility_percentage ?? 0;
  const outlook = getOutlook(score);

  const sorted    = [...displayRows].sort((a, b) => b.value - a.value);
  const topTwo    = sorted.slice(0, 2);
  const lowest    = sorted[sorted.length - 1];

  const radarDimensions = displayRows.map(r => ({ label: r.label, value: Math.round(r.value) }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 py-6 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl border border-primary/20 overflow-hidden"
        style={{ background: 'hsl(225,35%,10%)' }}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ background: 'rgba(212,175,55,0.07)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}
        >
          <div>
            <h2 className="font-heading text-base font-bold">Full Compatibility Report</h2>
            <p className="text-[11px] text-muted-foreground">with {targetName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* ── Section 1: Overview — score + radar ─────────────── */}
          <section>
            <SectionLabel n="1" title="Compatibility Overview" />

            {/* Score + outlook inline */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="flex items-baseline gap-1 rounded-xl px-4 py-2.5 flex-shrink-0"
                style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.20)' }}
              >
                <span className="font-heading text-4xl font-bold" style={{ color: '#D4AF37' }}>
                  {Math.round(score)}
                </span>
                <span className="text-lg font-bold" style={{ color: '#D4AF37' }}>%</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Overall Compatibility</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: outlook.color }} />
                  <p className="text-xs leading-snug" style={{ color: outlook.color }}>{outlook.text}</p>
                </div>
              </div>
            </div>

            {/* Radar — outline only, larger */}
            {radarDimensions.length >= 3 && (
              <div className="flex justify-center">
                <RadarChart dimensions={radarDimensions} size={360} showLabels={true} />
              </div>
            )}
          </section>

          {/* ── Section 2: Strengths ─────────────────────────────── */}
          <section>
            <SectionLabel n="2" title="Relationship Strengths" />
            <div className="space-y-2">
              {topTwo.map(row => (
                <InsightRow key={row.key} row={row} variant="strength" />
              ))}
            </div>
          </section>

          {/* ── Section 3: Growth area ───────────────────────────── */}
          {lowest && (
            <section>
              <SectionLabel n="3" title="Potential Growth Area" />
              <InsightRow row={lowest} variant="growth" />
            </section>
          )}

          {/* ── Section 4: All insights ──────────────────────────── */}
          <section>
            <SectionLabel n="4" title="All Compatibility Insights" />
            <div className="space-y-0 rounded-xl overflow-hidden border border-white/6">
              {displayRows.map((row, i) => (
                <div
                  key={row.key}
                  className="px-4 py-2.5 flex items-center gap-3"
                  style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                >
                  <span className="text-xs font-semibold w-28 flex-shrink-0 text-foreground">{row.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.value}%`,
                          background: 'linear-gradient(90deg, #b8860b 0%, #D4AF37 60%, #f5d060 100%)',
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: '#D4AF37', minWidth: 32, textAlign: 'right' }}>
                    {Math.round(row.value)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Based on your psychological profiling across {displayRows.length} personality dimensions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────

const SectionLabel = ({ n, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <span
      className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
    >{n}</span>
    <span className="text-sm font-semibold font-heading">{title}</span>
  </div>
);

const InsightRow = ({ row, variant }) => {
  const isStrength = variant === 'strength';
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: isStrength ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isStrength ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-foreground">{row.label}</span>
          <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: isStrength ? '#D4AF37' : 'hsl(25,60%,50%)' }}>
            {Math.round(row.value)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${row.value}%`,
              background: isStrength
                ? 'linear-gradient(90deg, #b8860b 0%, #D4AF37 60%, #f5d060 100%)'
                : 'linear-gradient(90deg, #7c4f1a 0%, #b87333 100%)',
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{row.insight}</p>
      </div>
    </div>
  );
};

export default CompatibilityReportModal;
