import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, TrendingUp, Sparkles, Brain, MessageCircleHeart, Zap, ArrowRight } from 'lucide-react';
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
const CompatibilityReportModal = ({ compatibility, targetName, targetUserId, displayRows = [], onClose }) => {
  const navigate = useNavigate();
  const score    = compatibility?.compatibility_percentage ?? 0;
  const outlook  = getOutlook(score);

  const handleDeepExplore = () => {
    onClose();
    navigate(targetUserId ? `/profile/${targetUserId}` : '/dashboard', { state: { openDeep: true } });
  };

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

          {/* ── Deep Exploration Nudge ───────────────────────────── */}
          <DeepExploreNudge score={score} targetName={targetName} onExplore={handleDeepExplore} />
        </div>
      </div>
    </div>
  );
};

// ── Deep Exploration Nudge ────────────────────────────────────────

const DEEP_PILLS = [
  { icon: Brain,              label: '108 Questions' },
  { icon: MessageCircleHeart, label: 'Conversation Starters' },
  { icon: Zap,                label: 'AI Relationship Insights' },
];

const getNudgeCopy = (score) => {
  if (score >= 85) return {
    headline: 'Your connection is exceptional — go deeper.',
    sub: `This level of compatibility deserves a full Relationship Intelligence Report. Discover exactly how you two click — and where to nurture what you've found.`,
  };
  if (score >= 75) return {
    headline: 'Strong match — see the full picture.',
    sub: `You're clearly aligned on what matters. The Deeper Exploration report reveals the finer layers — how you handle conflict, what you need in intimacy, and what your future together could look like.`,
  };
  if (score >= 65) return {
    headline: 'Good potential — understanding makes it great.',
    sub: `Every thriving relationship starts with insight. The 108-question Relationship Intelligence Report turns your differences into your greatest strengths.`,
  };
  return {
    headline: 'Every connection has hidden depth.',
    sub: `Before you make any decision, let the Relationship Intelligence Report reveal the full story — sometimes the most surprising pairs have the deepest bonds.`,
  };
};

const DeepExploreNudge = ({ score, targetName, onExplore }) => {
  const { headline, sub } = getNudgeCopy(score);
  return (
    <section>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,60,180,0.18) 0%, rgba(212,175,55,0.10) 100%)',
          border: '1px solid rgba(139,92,246,0.30)',
        }}
      >
        {/* Top accent line */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,#8B5CF6,#D4AF37,#8B5CF6)' }} />

        <div className="px-5 py-4">
          {/* Tag */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: '#8B5CF6' }}
            >
              Relationship Intelligence Report
            </span>
          </div>

          {/* Headline */}
          <h3 className="font-heading font-bold text-base mb-1.5 text-foreground leading-snug">
            {headline}
          </h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
            {sub}
          </p>

          {/* Benefit pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {DEEP_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  background: 'rgba(139,92,246,0.12)',
                  border: '1px solid rgba(139,92,246,0.22)',
                  color: '#c4b5fd',
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onExplore}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(90deg,#7C3AED,#8B5CF6)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
            }}
          >
            Unlock Deeper Compatibility with {targetName}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Included in Elite · ₹999 one-time for Premium members
          </p>
        </div>
      </div>
    </section>
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
