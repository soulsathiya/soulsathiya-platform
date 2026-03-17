import React from 'react';
import { X, TrendingUp, AlertCircle, Star } from 'lucide-react';
import RadarChart from './RadarChart';

const DOMAIN_DISPLAY = {
  emotional_style:       'Emotional Alignment',
  values:                'Shared Values',
  marriage_expectations: 'Family & Marriage',
  lifestyle:             'Lifestyle',
  personality:           'Personality Harmony',
  trust_attachment:      'Trust & Attachment',
  growth_mindset:        'Growth Mindset',
};

const getOutlook = (score) => {
  if (score > 85) return { text: 'Very promising long-term compatibility.', color: 'hsl(43,90%,58%)' };
  if (score >= 75) return { text: 'Good compatibility with areas for growth.',  color: 'hsl(43,70%,50%)' };
  if (score >= 65) return { text: 'Moderate compatibility requiring mutual effort.', color: 'hsl(25,70%,55%)' };
  return            { text: 'Meaningful differences exist — open communication will be key.', color: 'hsl(0,55%,55%)' };
};

/**
 * CompatibilityReportModal
 * Props:
 *   compatibility  — full response from GET /api/compatibility/{id}
 *   targetName     — display name of the other user
 *   onClose        — callback to close modal
 */
const CompatibilityReportModal = ({ compatibility, targetName, onClose }) => {
  const score          = compatibility?.compatibility_percentage ?? 0;
  const domainBreakdown = compatibility?.domain_breakdown ?? {};
  const outlook        = getOutlook(score);

  // Sort domains for strengths / growth logic
  const sorted = Object.entries(domainBreakdown).sort((a, b) => b[1] - a[1]);
  const topTwo  = sorted.slice(0, 2);
  const lowest  = sorted[sorted.length - 1];

  // Build radar chart dimensions — all available domains
  const radarDimensions = sorted.map(([key, value]) => ({
    label: DOMAIN_DISPLAY[key] || key,
    value: Math.round(value),
  }));

  const label = (key) => (DOMAIN_DISPLAY[key] || key);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-8 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl border border-primary/20 overflow-hidden"
        style={{ background: 'hsl(225,35%,11%)' }}
      >
        {/* ── Modal header ───────────────────────────────────── */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'rgba(212,165,32,0.08)', borderBottom: '1px solid rgba(212,165,32,0.15)' }}
        >
          <div>
            <h2 className="font-heading text-lg font-bold">Full Compatibility Report</h2>
            <p className="text-xs text-muted-foreground mt-0.5">with {targetName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* ── Section 1: Compatibility Overview ──────────────── */}
          <section>
            <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,165,32,0.2)', color: 'hsl(43,90%,58%)' }}
              >1</span>
              Compatibility Overview
            </h3>

            {/* Overall score badge */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="flex items-center justify-center rounded-2xl px-5 py-3"
                style={{ background: 'rgba(212,165,32,0.12)', border: '1px solid rgba(212,165,32,0.25)' }}
              >
                <span className="font-heading text-4xl font-bold" style={{ color: 'hsl(43,90%,58%)' }}>
                  {Math.round(score)}%
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">Overall Compatibility</p>
                <p className="text-xs text-muted-foreground mt-1" style={{ color: outlook.color }}>
                  {outlook.text}
                </p>
              </div>
            </div>

            {/* Radar chart */}
            {radarDimensions.length >= 3 && (
              <div className="flex justify-center">
                <RadarChart dimensions={radarDimensions} size={300} showLabels={true} />
              </div>
            )}
          </section>

          {/* ── Section 2: Relationship Strengths ──────────────── */}
          <section>
            <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,165,32,0.2)', color: 'hsl(43,90%,58%)' }}
              >2</span>
              Relationship Strengths
            </h3>

            <div className="space-y-3">
              {topTwo.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-4 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(212,165,32,0.07)', border: '1px solid rgba(212,165,32,0.15)' }}
                >
                  <Star className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label(key)}</p>
                    <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${value}%`, background: 'hsl(43,90%,58%)' }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary flex-shrink-0">{Math.round(value)}%</span>
                </div>
              ))}
            </div>

            {topTwo.length >= 2 && (
              <p className="text-sm text-muted-foreground mt-3">
                Strong {label(topTwo[0][0]).toLowerCase()} and {label(topTwo[1][0]).toLowerCase()} form
                the foundation of your connection.
              </p>
            )}
          </section>

          {/* ── Section 3: Potential Growth Area ───────────────── */}
          {lowest && (
            <section>
              <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(212,165,32,0.2)', color: 'hsl(43,90%,58%)' }}
                >3</span>
                Potential Growth Area
              </h3>

              <div
                className="flex items-start gap-4 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label(lowest[0])}</p>
                  <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${lowest[1]}%`, background: 'hsl(25,60%,48%)' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {label(lowest[0])} differences may require conscious effort and open dialogue.
                  </p>
                </div>
                <span className="text-sm font-bold text-muted-foreground flex-shrink-0">{Math.round(lowest[1])}%</span>
              </div>
            </section>
          )}

          {/* ── Section 4: Relationship Outlook ────────────────── */}
          <section>
            <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,165,32,0.2)', color: 'hsl(43,90%,58%)' }}
              >4</span>
              Relationship Outlook
            </h3>

            <div
              className="rounded-xl px-5 py-4 flex items-center gap-4"
              style={{ background: 'rgba(212,165,32,0.08)', border: '1px solid rgba(212,165,32,0.20)' }}
            >
              <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: outlook.color }} />
              <p className="text-sm font-medium leading-relaxed" style={{ color: outlook.color }}>
                {outlook.text}
              </p>
            </div>

            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              This report is based on your psychological profiling responses and reflects alignment
              across {radarDimensions.length} personality dimensions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CompatibilityReportModal;
