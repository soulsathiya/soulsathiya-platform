/**
 * InsightsReportPage.jsx
 * ─────────────────────
 * Displays the full ₹999 Relationship Intelligence Report.
 * Requires auth + paid status. Redirects if not.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Download, ArrowRight, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const GOLD  = '#D4A520';
const NAVY  = '#0C1323';
const CARD  = '#0F1A2E';
const GREEN = '#4ade80';

/* ── Circular score meter ─────────────────────────────────────────────────── */
function ScoreMeter({ score, size = 160 }) {
  const radius = (size / 2) - 12;
  const circum = 2 * Math.PI * radius;
  const dash   = circum * Math.min(score / 100, 1);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none"
        stroke={GOLD} strokeWidth={10}
        strokeDasharray={`${dash} ${circum - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.4s ease' }}
      />
    </svg>
  );
}

/* ── Hexagonal radar chart ─────────────────────────────────────────────────── */
function RadarChart({ profiles, size = 320 }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 44;
  const n = profiles.length;
  const SHORT_LABELS = ['Emotional', 'Values', 'Comm.', 'Patterns', 'Lifestyle', 'Future'];

  const angle = (i) => (2 * Math.PI * i / n) - Math.PI / 2;
  const pt    = (i, r) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  const rings    = [0.2, 0.4, 0.6, 0.8, 1.0];
  const dataPath = profiles.map((p, i) => pt(i, (p.score / 100) * maxR));
  const poly     = dataPath.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg width={size} height={size}>
      {/* Grid rings */}
      {rings.map((r, ri) => {
        const rp = profiles.map((_, i) => pt(i, r * maxR));
        return (
          <polygon key={ri}
            points={rp.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke={ri === 4 ? 'rgba(212,165,32,0.25)' : 'rgba(212,165,32,0.1)'}
            strokeWidth={ri === 4 ? 1.5 : 1}
          />
        );
      })}

      {/* Ring labels (20/40/60/80/100) */}
      {rings.map((r, ri) => (
        <text key={`rl-${ri}`}
          x={cx + 4} y={cy - r * maxR + 4}
          fontSize={8} fill="rgba(212,165,32,0.4)" fontFamily="sans-serif">
          {r * 100}
        </text>
      ))}

      {/* Axis spokes */}
      {profiles.map((_, i) => {
        const outer = pt(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
          stroke="rgba(212,165,32,0.15)" strokeWidth={1} />;
      })}

      {/* Data polygon */}
      <polygon points={poly} fill="rgba(212,165,32,0.1)" stroke={GOLD} strokeWidth={2} />

      {/* Data vertices */}
      {dataPath.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5} fill={GOLD}
          stroke="rgba(12,19,35,0.8)" strokeWidth={2} />
      ))}

      {/* Score labels near vertices */}
      {dataPath.map((p, i) => {
        const angle_i = angle(i);
        const offsetX = Math.cos(angle_i) * 16;
        const offsetY = Math.sin(angle_i) * 16;
        return (
          <text key={`sv-${i}`}
            x={p.x + offsetX} y={p.y + offsetY}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fill={GOLD} fontFamily="sans-serif" fontWeight="700">
            {profiles[i].score}
          </text>
        );
      })}

      {/* Axis labels */}
      {profiles.map((_, i) => {
        const lp = pt(i, maxR + 24);
        return (
          <text key={`lbl-${i}`}
            x={lp.x} y={lp.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fill="rgba(245,237,216,0.65)" fontFamily="sans-serif">
            {SHORT_LABELS[i]}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Expandable section card with percentile ──────────────────────────────── */
function SectionCard({ profile }) {
  const [open, setOpen] = useState(false);

  const scoreColor = profile.score >= 75 ? GREEN
    : profile.score >= 55 ? GOLD
    : '#f87171';

  return (
    <div
      style={{ background: CARD, border: '1px solid rgba(212,165,32,0.12)', borderRadius: 16,
        overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,165,32,0.35)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(212,165,32,0.12)'}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 24, flexShrink: 0 }}>{profile.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.07em', marginBottom: 3 }}>
            Level {profile.level}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{profile.title}</div>
          {/* Score bar */}
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${profile.score}%`,
              background: `linear-gradient(90deg, ${GOLD}, #B8860B)`,
              borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
          {/* Percentile tag */}
          {profile.percentile && (
            <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(245,237,216,0.4)',
              fontFamily: 'sans-serif' }}>
              {profile.percentile}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor }}>{profile.score}</div>
          <div style={{ fontSize: 10, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif' }}>/100</div>
        </div>
        <div style={{ fontSize: 18, color: 'rgba(245,237,216,0.3)',
          transform: open ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>›</div>
      </div>

      {open && (
        <div style={{ padding: '0 22px 22px', borderTop: '1px solid rgba(212,165,32,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0 12px' }}>
            <span style={{ fontSize: 20 }}>{profile.badge}</span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 18, fontWeight: 700 }}>{profile.profile}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: 'rgba(245,237,216,0.75)',
            marginBottom: 16, fontStyle: 'italic' }}>
            "{profile.summary}"
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 10, padding: '14px' }}>
              <div style={{ fontSize: 10, color: GREEN, fontFamily: 'sans-serif', marginBottom: 6 }}>✦ STRENGTH</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(245,237,216,0.8)' }}>{profile.strength}</div>
            </div>
            <div style={{ background: 'rgba(212,165,32,0.06)', border: '1px solid rgba(212,165,32,0.15)',
              borderRadius: 10, padding: '14px' }}>
              <div style={{ fontSize: 10, color: GOLD, fontFamily: 'sans-serif', marginBottom: 6 }}>✦ GROWTH EDGE</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(245,237,216,0.8)' }}>{profile.growth}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Commitment XP score ──────────────────────────────────────────────────── */
function CommitmentScore({ xpEarned, xpMax, tier, badge, pct, message }) {
  const tierColors = {
    'Deep Seeker':        { bar: '#D4A520', glow: 'rgba(212,165,32,0.35)' },
    'Committed Explorer': { bar: '#C9982A', glow: 'rgba(201,152,42,0.30)' },
    'Growing Seeker':     { bar: '#4ade80', glow: 'rgba(74,222,128,0.25)' },
    'Beginning Explorer': { bar: '#60a5fa', glow: 'rgba(96,165,250,0.20)' },
  };
  const colors = tierColors[tier] || tierColors['Deep Seeker'];
  const barWidth = Math.min(pct, 100);

  return (
    <div style={{ background: CARD, border: '1px solid rgba(212,165,32,0.15)',
      borderRadius: 16, padding: '28px', marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <Zap size={18} color={GOLD} fill={GOLD} />
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22,
          fontWeight: 700, margin: 0 }}>Your Commitment Score</h2>
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>{badge}</span>
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 20,
                fontWeight: 700, lineHeight: 1.2 }}>{tier}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,237,216,0.45)', fontFamily: 'sans-serif' }}>Dedication level</div>
            </div>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${barWidth}%`,
              background: `linear-gradient(90deg, ${colors.bar}, ${colors.bar}bb)`,
              borderRadius: 10, boxShadow: `0 0 12px ${colors.glow}`,
              transition: 'width 1.2s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12,
            fontFamily: 'sans-serif', color: 'rgba(245,237,216,0.45)' }}>
            <span><span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{xpEarned.toLocaleString()}</span> / {xpMax.toLocaleString()} XP</span>
            <span>{pct}% complete</span>
          </div>
        </div>
        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Deep Seeker',        badge: '🔥', threshold: '1,004+ XP' },
            { label: 'Committed Explorer', badge: '⭐', threshold: '864+ XP'   },
            { label: 'Growing Seeker',     badge: '🌱', threshold: '702+ XP'   },
            { label: 'Beginning Explorer', badge: '🌅', threshold: 'Below 702' },
          ].map(t => {
            const active = t.label === tier;
            return (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px',
                background: active ? 'rgba(212,165,32,0.08)' : 'transparent',
                border: `1px solid ${active ? 'rgba(212,165,32,0.25)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 8 }}>
                <span style={{ fontSize: 15 }}>{t.badge}</span>
                <div style={{ flex: 1, fontSize: 13, fontFamily: 'sans-serif',
                  color: active ? '#F5EDD8' : 'rgba(245,237,216,0.4)',
                  fontWeight: active ? 600 : 400 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(245,237,216,0.3)', fontFamily: 'sans-serif' }}>{t.threshold}</div>
                {active && <span style={{ fontSize: 10, color: GOLD, fontFamily: 'sans-serif' }}>← you</span>}
              </div>
            );
          })}
        </div>
      </div>
      <p style={{ marginTop: 20, marginBottom: 0, fontSize: 14, lineHeight: 1.8,
        color: 'rgba(245,237,216,0.68)', fontStyle: 'italic',
        borderTop: '1px solid rgba(212,165,32,0.08)', paddingTop: 18 }}>
        "{message}"
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function InsightsReportPage() {
  const navigate   = useNavigate();
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/insights/report`, { withCredentials: true });
        setReport(data.report);
      } catch (err) {
        const s = err?.response?.status;
        navigate(s === 401 || s === 402 ? '/insights/unlock' : '/insights');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Loader2 size={28} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(245,237,216,0.5)', fontFamily: 'Georgia, serif', fontSize: 16 }}>Loading your report…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!report) return null;

  const r = report;

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: '#F5EDD8',
      fontFamily: 'Georgia, serif', overflowX: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px', borderBottom: '1px solid rgba(212,165,32,0.12)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="SoulSathiya" style={{ width: 28, height: 28 }}
            onError={e => { e.target.style.display = 'none'; }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#F5EDD8' }}>
            Soul<span style={{ color: GOLD }}>Sathiya</span>
          </span>
        </a>
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(212,165,32,0.1)', border: `1px solid ${GOLD}40`,
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            color: GOLD, fontSize: 13, fontFamily: 'sans-serif' }}>
          <Download size={13} /> Save Report
        </button>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 100px' }}>

        {/* ══ 1. OVERALL SCORE HERO ══ */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: GOLD, fontFamily: 'sans-serif',
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24 }}>
            SoulSathiya Relationship Intelligence Report
          </div>

          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
            <ScoreMeter score={r.overall_score} size={160} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 44, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                {r.overall_score}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif' }}>/100</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center',
            flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ background: 'rgba(212,165,32,0.1)', border: `1px solid ${GOLD}40`,
              borderRadius: 20, padding: '5px 18px', fontSize: 13, color: GOLD, fontFamily: 'sans-serif' }}>
              {r.overall_label} Relationship Intelligence
            </div>
            {r.overall_percentile && (
              <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: 20, padding: '5px 18px', fontSize: 12,
                color: GREEN, fontFamily: 'sans-serif' }}>
                {r.overall_percentile}
              </div>
            )}
          </div>

          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, lineHeight: 1.35,
            maxWidth: 620, margin: '0 auto 20px' }}>
            {r.headline}
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.85, color: 'rgba(245,237,216,0.72)',
            maxWidth: 620, margin: '0 auto' }}>
            {r.summary}
          </p>
        </div>

        {/* ══ 2. SCORE EXPLAINED ══ */}
        {r.score_context && (
          <div style={{ background: 'rgba(212,165,32,0.05)', border: `1px solid ${GOLD}20`,
            borderRadius: 14, padding: '20px 24px', marginBottom: 56,
            borderLeft: `3px solid ${GOLD}` }}>
            <div style={{ fontSize: 11, color: GOLD, fontFamily: 'sans-serif',
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              What Your Score Means
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(245,237,216,0.75)', margin: 0 }}>
              {r.score_context}
            </p>
          </div>
        )}

        {/* ══ 3. RADAR CHART ══ */}
        {r.section_profiles?.length === 6 && (
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
              Your Profile at a Glance
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(245,237,216,0.5)', marginBottom: 28,
              fontFamily: 'sans-serif' }}>
              A visual map of all six relationship intelligence dimensions.
            </p>
            <div style={{ background: CARD, border: '1px solid rgba(212,165,32,0.12)',
              borderRadius: 20, padding: '40px 24px', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <RadarChart profiles={r.section_profiles} size={320} />
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px',
                justifyContent: 'center' }}>
                {r.section_profiles.map(p => (
                  <div key={p.section_id} style={{ display: 'flex', alignItems: 'center',
                    gap: 6, fontSize: 12, fontFamily: 'sans-serif',
                    color: 'rgba(245,237,216,0.65)' }}>
                    <span>{p.icon}</span>
                    <span>{p.title}</span>
                    <span style={{ color: p.score >= 75 ? GREEN : p.score >= 55 ? GOLD : '#f87171',
                      fontWeight: 700 }}>{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ 4. SIX DIMENSIONS ══ */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Your Six Dimensions
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(245,237,216,0.5)', marginBottom: 24,
            fontFamily: 'sans-serif' }}>
            Click each dimension to expand your full personalised analysis.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(r.section_profiles || []).map(p => (
              <SectionCard key={p.section_id} profile={p} />
            ))}
          </div>
        </section>

        {/* ══ 5. ATTACHMENT STYLE ══ */}
        {r.attachment_style && (
          <section style={{ background: CARD, border: `1px solid ${GOLD}25`,
            borderRadius: 20, padding: '32px 28px', marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>{r.attachment_style.emoji}</span>
              <div>
                <div style={{ fontSize: 11, color: GOLD, fontFamily: 'sans-serif',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Your Attachment Style
                </div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 26, fontWeight: 700, margin: 0 }}>
                  {r.attachment_style.name}
                </h2>
              </div>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.85, color: 'rgba(245,237,216,0.8)',
              marginBottom: 20 }}>
              {r.attachment_style.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: 'rgba(212,165,32,0.06)', border: '1px solid rgba(212,165,32,0.15)',
                borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 10, color: GOLD, fontFamily: 'sans-serif',
                  letterSpacing: '0.07em', marginBottom: 8 }}>IN RELATIONSHIPS</div>
                <p style={{ fontSize: 13, lineHeight: 1.7,
                  color: 'rgba(245,237,216,0.78)', margin: 0 }}>
                  {r.attachment_style.in_relationships}
                </p>
              </div>
              <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)',
                borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 10, color: GREEN, fontFamily: 'sans-serif',
                  letterSpacing: '0.07em', marginBottom: 8 }}>IDEAL PARTNER TRAIT</div>
                <p style={{ fontSize: 13, lineHeight: 1.7,
                  color: 'rgba(245,237,216,0.78)', margin: 0 }}>
                  {r.attachment_style.ideal_partner_trait}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ══ 6. STRENGTHS & GROWTH ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 56 }}>
          <div style={{ background: CARD, border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: 16, padding: '28px 24px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22,
              fontWeight: 700, color: GREEN, marginBottom: 20 }}>
              ✦ Your Top Strengths
            </h3>
            {(r.top_strengths || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16,
                fontSize: 13, lineHeight: 1.7, color: 'rgba(245,237,216,0.82)' }}>
                <span style={{ color: GREEN, flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                {s}
              </div>
            ))}
          </div>
          <div style={{ background: CARD, border: `1px solid ${GOLD}20`,
            borderRadius: 16, padding: '28px 24px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22,
              fontWeight: 700, color: GOLD, marginBottom: 20 }}>
              ✦ Growth Opportunities
            </h3>
            {(r.growth_areas || []).map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16,
                fontSize: 13, lineHeight: 1.7, color: 'rgba(245,237,216,0.82)' }}>
                <span style={{ color: GOLD, flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                {g}
              </div>
            ))}
          </div>
        </div>

        {/* ══ 7. INTER-DIMENSION INSIGHTS ══ */}
        {r.inter_dimension_insights?.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
              How Your Dimensions Interact
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(245,237,216,0.5)', marginBottom: 24,
              fontFamily: 'sans-serif' }}>
              The most meaningful insights often live at the intersection of dimensions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {r.inter_dimension_insights.map((insight, i) => (
                <div key={i} style={{ background: CARD,
                  border: '1px solid rgba(212,165,32,0.12)',
                  borderLeft: `3px solid ${GOLD}`,
                  borderRadius: 12, padding: '18px 20px' }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8,
                    color: 'rgba(245,237,216,0.82)' }}>{insight}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ 8. COMMITMENT SCORE ══ */}
        {r.xp_earned !== undefined && (
          <CommitmentScore
            xpEarned={r.xp_earned} xpMax={r.xp_max}
            tier={r.commitment_tier} badge={r.commitment_badge}
            pct={r.commitment_pct} message={r.commitment_message}
          />
        )}

        {/* ══ 9. IDEAL PARTNER PROFILE ══ */}
        <section style={{ background: CARD, border: `1px solid ${GOLD}20`,
          borderRadius: 20, padding: '32px 28px', marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 26 }}>❤️</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 26, fontWeight: 700, margin: 0 }}>
              Your Ideal Partner Profile
            </h2>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.9,
            color: 'rgba(245,237,216,0.8)', marginBottom: 24 }}>
            {r.partner_compatibility_profile}
          </p>
          {r.partner_profile_dimensions?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {r.partner_profile_dimensions.map((dim, i) => (
                <div key={i} style={{ background: 'rgba(212,165,32,0.04)',
                  border: '1px solid rgba(212,165,32,0.12)',
                  borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{dim.icon}</span>
                    <span style={{ fontSize: 10, color: GOLD, fontFamily: 'sans-serif',
                      letterSpacing: '0.07em', textTransform: 'uppercase' }}>{dim.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65,
                    color: 'rgba(245,237,216,0.75)' }}>{dim.trait}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ 10. RECOMMENDATIONS ══ */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Your Personalised Recommendations
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(245,237,216,0.5)', marginBottom: 24,
            fontFamily: 'sans-serif' }}>
            Each recommendation below is specific to your scores and patterns.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(r.recommendations || []).map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, background: CARD,
                border: '1px solid rgba(212,165,32,0.1)', borderRadius: 12,
                padding: '18px 20px' }}>
                <div style={{ flexShrink: 0, width: 30, height: 30,
                  background: 'rgba(212,165,32,0.12)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: GOLD, fontWeight: 700, fontFamily: 'sans-serif' }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8,
                  color: 'rgba(245,237,216,0.82)' }}>{rec}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ 11. CTA ══ */}
        <div style={{ background: `linear-gradient(135deg, rgba(212,165,32,0.08), rgba(184,134,11,0.05))`,
          border: `1px solid ${GOLD}25`, borderRadius: 20,
          padding: '44px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💛</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            Ready to find your match?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(245,237,216,0.65)', marginBottom: 28,
            maxWidth: 480, margin: '0 auto 28px' }}>
            Your Relationship Intelligence profile can now power deeper compatibility matching.
            Connect with people who truly align with how you relate and grow.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')}
              style={{ background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                color: '#0C1323', fontWeight: 700, fontSize: 15,
                padding: '14px 32px', borderRadius: 12, border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Create Your Profile <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate('/matches')}
              style={{ background: 'rgba(212,165,32,0.1)', color: GOLD, fontWeight: 600,
                fontSize: 15, padding: '14px 32px', borderRadius: 12,
                border: `1px solid ${GOLD}40`, cursor: 'pointer' }}>
              Browse Matches
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          header { display: none !important; }
          button { display: none !important; }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
