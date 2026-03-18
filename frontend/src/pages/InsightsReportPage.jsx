/**
 * InsightsReportPage.jsx
 * ─────────────────────
 * Displays the full ₹999 Relationship Intelligence Report.
 * Requires auth + paid status. Redirects if not.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Download, ArrowRight, Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const GOLD  = '#D4A520';
const NAVY  = '#0C1323';
const CARD  = '#0F1A2E';

function ScoreMeter({ score, size = 120 }) {
  const radius  = (size / 2) - 10;
  const circum  = 2 * Math.PI * radius;
  const pct     = Math.min(score / 100, 1);
  const dash    = circum * pct;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle
        cx={size/2} cy={size/2} r={radius} fill="none"
        stroke={GOLD} strokeWidth={10}
        strokeDasharray={`${dash} ${circum - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s ease' }}
      />
    </svg>
  );
}

function SectionCard({ profile }) {
  const [open, setOpen] = useState(false);
  const pct = profile.score;

  return (
    <div
      style={{ background: CARD, border: '1px solid rgba(212,165,32,0.12)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
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
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{profile.title}</div>
          {/* Mini bar */}
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}, #B8860B)`, borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>{pct}</div>
          <div style={{ fontSize: 10, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif' }}>/100</div>
        </div>
        <div style={{ fontSize: 18, color: 'rgba(245,237,216,0.3)', transform: open ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>›</div>
      </div>

      {open && (
        <div style={{ padding: '0 22px 20px', borderTop: '1px solid rgba(212,165,32,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0 12px' }}>
            <span style={{ fontSize: 18 }}>{profile.badge}</span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, fontWeight: 700 }}>{profile.profile}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(245,237,216,0.75)', marginBottom: 16, fontStyle: 'italic' }}>
            "{profile.summary}"
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px' }}>
              <div style={{ fontSize: 10, color: '#4ade80', fontFamily: 'sans-serif', marginBottom: 6 }}>✦ STRENGTH</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(245,237,216,0.75)' }}>{profile.strength}</div>
            </div>
            <div style={{ background: 'rgba(212,165,32,0.06)', border: '1px solid rgba(212,165,32,0.15)', borderRadius: 10, padding: '12px' }}>
              <div style={{ fontSize: 10, color: GOLD, fontFamily: 'sans-serif', marginBottom: 6 }}>✦ GROWTH</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(245,237,216,0.75)' }}>{profile.growth}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InsightsReportPage() {
  const navigate = useNavigate();
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/insights/report`, { withCredentials: true });
        setReport(data.report);
        setUserName(data.user_name || '');
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          navigate('/insights/unlock');
        } else if (status === 402) {
          navigate('/insights/unlock');
        } else {
          navigate('/insights');
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={28} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'rgba(245,237,216,0.5)', fontFamily: 'Georgia, serif', fontSize: 16 }}>Loading your report…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!report) return null;

  const firstName = userName ? userName.split(' ')[0] : 'Your';

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: '#F5EDD8', fontFamily: 'Georgia, serif', overflowX: 'hidden' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid rgba(212,165,32,0.12)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="SoulSathiya" style={{ width: 28, height: 28 }} onError={e => { e.target.style.display = 'none'; }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#F5EDD8' }}>Soul<span style={{ color: GOLD }}>Sathiya</span></span>
        </a>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(212,165,32,0.1)', border: `1px solid ${GOLD}40`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: GOLD, fontSize: 13, fontFamily: 'sans-serif' }}
          >
            <Download size={13} /> Save Report
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* ── Overall Score Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            Relationship Intelligence Report
          </div>

          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <ScoreMeter score={report.overall_score} size={160} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 44, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                {report.overall_score}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif' }}>/ 100</span>
            </div>
          </div>

          <div style={{ display: 'inline-block', background: 'rgba(212,165,32,0.1)', border: `1px solid ${GOLD}40`, borderRadius: 20, padding: '6px 20px', fontSize: 14, color: GOLD, marginBottom: 20, fontFamily: 'sans-serif' }}>
            {report.overall_label} Relationship Intelligence
          </div>

          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700, lineHeight: 1.3, maxWidth: 620, margin: '0 auto 20px' }}>
            {firstName}'s {report.headline}
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(245,237,216,0.7)', maxWidth: 600, margin: '0 auto' }}>
            {report.summary}
          </p>
        </div>

        {/* ── Section Profiles ── */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
            Your Six Dimensions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(report.section_profiles || []).map(p => (
              <SectionCard key={p.section_id} profile={p} />
            ))}
          </div>
        </section>

        {/* ── Strengths & Growth ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 56 }}>
          <div style={{ background: CARD, border: '1px solid rgba(34,197,94,0.15)', borderRadius: 16, padding: '28px 24px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#4ade80', marginBottom: 20 }}>
              ✦ Your Top Strengths
            </h3>
            {(report.top_strengths || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 14, lineHeight: 1.6, color: 'rgba(245,237,216,0.8)' }}>
                <span style={{ color: '#4ade80', flexShrink: 0 }}>{i + 1}.</span>
                {s}
              </div>
            ))}
          </div>

          <div style={{ background: CARD, border: `1px solid ${GOLD}20`, borderRadius: 16, padding: '28px 24px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, color: GOLD, marginBottom: 20 }}>
              ✦ Growth Opportunities
            </h3>
            {(report.growth_areas || []).map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 14, lineHeight: 1.6, color: 'rgba(245,237,216,0.8)' }}>
                <span style={{ color: GOLD, flexShrink: 0 }}>{i + 1}.</span>
                {g}
              </div>
            ))}
          </div>
        </div>

        {/* ── Partner Compatibility ── */}
        <section style={{ background: CARD, border: `1px solid ${GOLD}20`, borderRadius: 16, padding: '32px 28px', marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>❤️</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, fontWeight: 700, margin: 0 }}>
              Your Ideal Partner Profile
            </h2>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: 'rgba(245,237,216,0.8)' }}>
            {report.partner_compatibility_profile}
          </p>
        </section>

        {/* ── Recommendations ── */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
            Your Personalised Recommendations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(report.recommendations || []).map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, background: CARD, border: '1px solid rgba(212,165,32,0.1)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ flexShrink: 0, width: 28, height: 28, background: 'rgba(212,165,32,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: GOLD, fontWeight: 700, fontFamily: 'sans-serif' }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'rgba(245,237,216,0.8)' }}>{r}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div style={{ background: `linear-gradient(135deg, rgba(212,165,32,0.08), rgba(184,134,11,0.05))`, border: `1px solid ${GOLD}25`, borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>💛</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            Ready to find your match?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(245,237,216,0.65)', marginBottom: 28 }}>
            Your Relationship Intelligence profile is now part of our matching algorithm. Create your full profile and meet people who truly align with who you are.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              style={{ background: `linear-gradient(135deg, ${GOLD}, #B8860B)`, color: '#0C1323', fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Create Your Profile <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/matches')}
              style={{ background: 'rgba(212,165,32,0.1)', color: GOLD, fontWeight: 600, fontSize: 15, padding: '14px 32px', borderRadius: 12, border: `1px solid ${GOLD}40`, cursor: 'pointer' }}
            >
              Browse Matches
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          header { display: none; }
          button { display: none; }
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
