import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, Loader2, Heart, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Brand colours ────────────────────────────────────────────────────────────
const GOLD   = '#D4A520';
const NAVY   = '#0C1323';
const CARD   = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(212,165,32,0.18)';

// ── Tier colours ─────────────────────────────────────────────────────────────
const TIER = {
  strong:   { bg: 'rgba(22,101,52,0.18)',  border: 'rgba(34,197,94,0.30)',  text: '#4ade80', label: 'Strong Alignment'   },
  moderate: { bg: 'rgba(120,83,0,0.18)',   border: 'rgba(212,165,32,0.30)', text: GOLD,      label: 'Moderate Alignment' },
  navigate: { bg: 'rgba(120,20,20,0.18)',  border: 'rgba(239,68,68,0.30)',  text: '#f87171', label: 'Navigate Together'  },
};

// ── Dual Radar Chart ─────────────────────────────────────────────────────────
function DualRadarChart({ sections, nameA, nameB }) {
  const SIZE   = 260;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const R      = 100;
  const labels = sections.map(s => s.title.split(' ')[0]);
  const n      = sections.length;

  const pt = (angle, r) => ({
    x: CX + r * Math.sin(angle),
    y: CY - r * Math.cos(angle),
  });

  const polyA = sections.map((s, i) => {
    const p = pt((2 * Math.PI * i) / n, Math.max(s.score_a, 5) / 100 * R);
    return `${p.x},${p.y}`;
  }).join(' ');

  const polyB = sections.map((s, i) => {
    const p = pt((2 * Math.PI * i) / n, Math.max(s.score_b, 5) / 100 * R);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <defs>
        <filter id="glowA">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowB">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1.0].map(frac => (
        <polygon key={frac}
          points={Array.from({ length: n }, (_, i) => {
            const p = pt((2 * Math.PI * i) / n, frac * R);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none" stroke={`rgba(212,165,32,${frac === 1 ? 0.35 : 0.12})`}
          strokeWidth={frac === 1 ? 1.2 : 0.8} strokeDasharray={frac < 1 ? "3 3" : "none"}
        />
      ))}

      {/* Axis lines */}
      {sections.map((_, i) => {
        const outer = pt((2 * Math.PI * i) / n, R);
        return <line key={i} x1={CX} y1={CY} x2={outer.x} y2={outer.y}
          stroke="rgba(212,165,32,0.12)" strokeWidth="0.8" />;
      })}

      {/* Person A polygon */}
      <polygon points={polyA}
        fill="rgba(212,165,32,0.18)" stroke={GOLD}
        strokeWidth="2" filter="url(#glowA)" />

      {/* Person B polygon */}
      <polygon points={polyB}
        fill="rgba(99,102,241,0.18)" stroke="#818cf8"
        strokeWidth="2" filter="url(#glowB)" />

      {/* Vertex dots A */}
      {sections.map((s, i) => {
        const p = pt((2 * Math.PI * i) / n, Math.max(s.score_a, 5) / 100 * R);
        return <circle key={`a${i}`} cx={p.x} cy={p.y} r="4" fill={GOLD} />;
      })}

      {/* Vertex dots B */}
      {sections.map((s, i) => {
        const p = pt((2 * Math.PI * i) / n, Math.max(s.score_b, 5) / 100 * R);
        return <circle key={`b${i}`} cx={p.x} cy={p.y} r="4" fill="#818cf8" />;
      })}

      {/* Axis labels */}
      {sections.map((s, i) => {
        const angle  = (2 * Math.PI * i) / n;
        const lp     = pt(angle, R + 18);
        const anchor = Math.abs(lp.x - CX) < 5 ? 'middle' : lp.x < CX ? 'end' : 'start';
        return (
          <text key={i} x={lp.x} y={lp.y + 4} textAnchor={anchor}
            fontSize="9" fill="rgba(212,165,32,0.75)" fontFamily="sans-serif">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, label }) {
  const r   = 58;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none"
          stroke="rgba(212,165,32,0.12)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none"
          stroke={GOLD} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)" />
        <text x="70" y="65" textAnchor="middle" fontSize="28"
          fontWeight="bold" fill={GOLD} fontFamily="sans-serif">{score}</text>
        <text x="70" y="83" textAnchor="middle" fontSize="10"
          fill="rgba(212,165,32,0.7)" fontFamily="sans-serif">/ 100</text>
      </svg>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 15, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ section, nameA, nameB }) {
  const t = TIER[section.tier] || TIER.moderate;

  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: '24px 28px', marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>{section.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 17 }}>
            {section.title}
          </div>
          <div style={{
            display: 'inline-block', marginTop: 4,
            background: t.bg, border: `1px solid ${t.border}`,
            borderRadius: 20, padding: '2px 10px',
            fontSize: 11, fontWeight: 700, color: t.text, letterSpacing: '0.04em',
          }}>{t.label}</div>
        </div>
        <div style={{
          textAlign: 'center',
          background: 'rgba(212,165,32,0.08)', border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: '8px 14px',
        }}>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 22 }}>{section.alignment}%</div>
          <div style={{ color: 'rgba(212,165,32,0.6)', fontSize: 10 }}>alignment</div>
        </div>
      </div>

      {/* Dual score bars */}
      <div style={{ marginBottom: 16 }}>
        {[{ name: nameA, score: section.score_a, color: GOLD },
          { name: nameB, score: section.score_b, color: '#818cf8' }].map(({ name, score, color }) => (
          <div key={name} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}/100</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${score}%`, background: color,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Headline + narrative */}
      <div style={{
        background: 'rgba(212,165,32,0.06)', borderLeft: `3px solid ${GOLD}`,
        borderRadius: '0 8px 8px 0', padding: '12px 16px', marginBottom: 12,
      }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
          {section.headline}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.7 }}>
          {section.narrative}
        </div>
      </div>

      {/* Key insight */}
      {section.key_insight && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '10px 14px',
          color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.65,
        }}>
          {section.key_insight}
        </div>
      )}
    </div>
  );
}

// ── Print HTML generator ──────────────────────────────────────────────────────
function buildCompatPrintHTML(r) {
  const G = '#8B6914'; const GL = '#D4A520'; const N = '#0C1323';
  const T = '#1E1E3A'; const T2 = '#6B6B8A'; const CB = '#F7F6F0';

  const tierColour = { strong: '#166534', moderate: '#92400E', navigate: '#991B1B' };
  const tierBg     = { strong: '#DCFCE7', moderate: '#FEF3C7', navigate: '#FEE2E2' };
  const tierLabel  = { strong: 'Strong Alignment', moderate: 'Moderate Alignment', navigate: 'Navigate Together' };

  const sections = (r.sections || []).map(s => `
    <div class="section-card">
      <div class="section-header">
        <span class="section-icon">${s.icon}</span>
        <div class="section-title-block">
          <div class="section-title">${s.title}</div>
          <span class="tier-badge" style="background:${tierBg[s.tier]||'#FEF3C7'};color:${tierColour[s.tier]||'#92400E'}">${tierLabel[s.tier]||''}</span>
        </div>
        <div class="alignment-box">
          <div class="alignment-score">${s.alignment}%</div>
          <div class="alignment-label">alignment</div>
        </div>
      </div>
      <div class="score-bars">
        <div class="score-row">
          <span class="score-name">${r.name_a}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${s.score_a}%;background:${GL}"></div></div>
          <span class="score-val">${s.score_a}</span>
        </div>
        <div class="score-row">
          <span class="score-name">${r.name_b}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${s.score_b}%;background:#6366F1"></div></div>
          <span class="score-val">${s.score_b}</span>
        </div>
      </div>
      <div class="section-narrative">
        <div class="narrative-headline">${s.headline}</div>
        <div class="narrative-body">${s.narrative}</div>
      </div>
      ${s.key_insight ? `<div class="key-insight">${s.key_insight}</div>` : ''}
    </div>
  `).join('');

  const prompts = (r.conversation_prompts || []).map((p, i) => `
    <div class="prompt-item">
      <div class="prompt-num">${i + 1}</div>
      <div class="prompt-text">${p}</div>
    </div>`).join('');

  const topAligns = (r.top_alignments || []).map(a => `<li>${a}</li>`).join('');
  const navigate  = (r.navigate_areas  || []).map(a => `<li>${a}</li>`).join('');

  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>SoulSathiya — Compatibility Intelligence Report</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#fff;color:${T};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.print-bar{background:${N};color:#fff;padding:12px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.print-bar-logo{display:flex;align-items:center;gap:10px;font-family:'Playfair Display',serif;font-size:18px;font-weight:700}
.print-bar-logo span{color:${GL}}
.print-btn{background:${GL};color:${N};border:none;border-radius:8px;padding:9px 22px;font-weight:700;font-size:14px;cursor:pointer;font-family:'Inter',sans-serif}
@media print{.print-bar{display:none!important}}
@page{size:A4 portrait;margin:14mm 16mm 18mm}
.page{max-width:780px;margin:0 auto;padding:32px 40px}
.report-header{text-align:center;padding:32px 0 24px;border-bottom:2px solid ${GL};margin-bottom:32px}
.header-logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px}
.header-logo-text{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:${N}}
.header-logo-text span{color:${G}}
.tagline{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${T2};margin-bottom:20px}
.report-badge{display:inline-block;background:${N};color:${GL};padding:6px 18px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.1em;margin-bottom:16px}
.couple-names{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:${N};margin-bottom:8px}
.couple-names span{color:${G}}
.report-date{color:${T2};font-size:12px}
.overall-block{display:flex;align-items:center;gap:32px;background:${CB};border:1px solid rgba(139,105,20,0.15);border-radius:16px;padding:28px 32px;margin-bottom:32px}
.overall-score-box{text-align:center;min-width:120px}
.overall-score{font-family:'Playfair Display',serif;font-size:56px;font-weight:700;color:${G};line-height:1}
.overall-label{font-size:12px;font-weight:700;color:${G};letter-spacing:.06em;margin-top:6px}
.overall-narrative{font-size:14px;line-height:1.75;color:${T};flex:1}
.section-title-h2{font-family:'Playfair Display',serif;font-size:20px;color:${N};margin:28px 0 16px;border-left:4px solid ${GL};padding-left:14px}
.section-card{border:1px solid rgba(139,105,20,0.18);border-radius:12px;padding:20px 22px;margin-bottom:16px;background:#fff;page-break-inside:avoid}
.section-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}
.section-icon{font-size:22px}
.section-title-block{flex:1}
.section-title{font-weight:700;font-size:15px;color:${N};margin-bottom:4px}
.tier-badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.04em}
.alignment-box{text-align:center;background:${CB};border-radius:10px;padding:8px 14px;min-width:64px}
.alignment-score{font-weight:800;font-size:20px;color:${G}}
.alignment-label{font-size:9px;color:${T2};font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.score-bars{margin-bottom:14px}
.score-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.score-name{font-size:11px;color:${T2};min-width:60px;font-weight:500}
.bar-track{flex:1;height:6px;background:#E5E7EB;border-radius:4px;overflow:hidden}
.bar-fill{height:100%;border-radius:4px}
.score-val{font-size:11px;font-weight:700;color:${T};min-width:24px;text-align:right}
.section-narrative{background:${CB};border-left:3px solid ${GL};border-radius:0 8px 8px 0;padding:12px 14px;margin-bottom:10px}
.narrative-headline{font-weight:700;font-size:13px;color:${G};margin-bottom:5px}
.narrative-body{font-size:12px;line-height:1.7;color:${T}}
.key-insight{font-size:11px;color:${T2};line-height:1.65;background:#F9F9F9;border-radius:8px;padding:10px 12px;border:1px solid #E5E7EB}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
.insight-box{border:1px solid rgba(139,105,20,0.18);border-radius:12px;padding:18px 20px;background:#fff}
.insight-box h4{font-weight:700;font-size:13px;color:${N};margin-bottom:10px}
.insight-box ul{list-style:none;display:flex;flex-direction:column;gap:6px}
.insight-box li{font-size:12px;color:${T};line-height:1.5;padding-left:14px;position:relative}
.insight-box li:before{content:'✦';position:absolute;left:0;color:${G};font-size:9px;top:2px}
.prompts-section{margin-top:28px}
.prompt-item{display:flex;gap:14px;padding:14px 16px;border:1px solid rgba(139,105,20,0.15);border-radius:10px;margin-bottom:10px;background:#fff;page-break-inside:avoid}
.prompt-num{width:26px;height:26px;border-radius:50%;background:${N};color:${GL};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px}
.prompt-text{font-size:13px;color:${T};line-height:1.65}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid rgba(139,105,20,0.2);text-align:center;color:${T2};font-size:11px;letter-spacing:.04em}
</style>
</head><body>
<div class="print-bar">
  <div class="print-bar-logo">🔮 Soul<span>Sathiya</span> — Compatibility Intelligence Report</div>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</div>
<div class="page">
  <div class="report-header">
    <div class="header-logo">
      <div class="header-logo-text">Soul<span>Sathiya</span></div>
    </div>
    <div class="tagline">AI-Powered Relationship Intelligence</div>
    <div class="report-badge">COMPATIBILITY INTELLIGENCE REPORT</div>
    <div class="couple-names">${r.name_a} <span>&</span> ${r.name_b}</div>
    <div class="report-date">Generated on ${date}</div>
  </div>

  <div class="overall-block">
    <div class="overall-score-box">
      <div class="overall-score">${r.overall_score}%</div>
      <div class="overall-label">${r.overall_label}</div>
    </div>
    <div class="overall-narrative">${r.overall_narrative}</div>
  </div>

  <div class="two-col">
    ${r.top_alignments?.length ? `<div class="insight-box"><h4>✦ Your Greatest Alignments</h4><ul>${topAligns}</ul></div>` : ''}
    ${r.navigate_areas?.length ? `<div class="insight-box"><h4>🧭 Areas to Navigate Together</h4><ul>${navigate}</ul></div>` : '<div></div>'}
  </div>

  <div class="section-title-h2">Dimension-by-Dimension Analysis</div>
  ${sections}

  <div class="prompts-section">
    <div class="section-title-h2">Conversation Starters for You Both</div>
    ${prompts}
  </div>

  <div class="footer">
    SoulSathiya Compatibility Intelligence Report &nbsp;•&nbsp; Confidential &nbsp;•&nbsp; soulsathiya.com
  </div>
</div>
<script>setTimeout(()=>window.print(),800)</script>
</body></html>`;
}

// ── Razorpay payment handler ──────────────────────────────────────────────────
function useRazorpay() {
  const loadScript = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return { loadScript };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CompatibilityIntelligenceReport() {
  const { pairId } = useParams();
  const navigate   = useNavigate();
  const { loadScript } = useRazorpay();

  const [loading,  setLoading]  = useState(true);
  const [report,   setReport]   = useState(null);
  const [pair,     setPair]     = useState(null);
  const [paying,   setPaying]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => { fetchData(); }, [pairId]);

  const fetchData = async () => {
    try {
      // Try to get the paid report first
      const res = await axios.get(
        `${BACKEND_URL}/api/insights/compatibility/report/${pairId}`,
        { withCredentials: true }
      );
      setReport(res.data.report);
    } catch (err) {
      if (err.response?.status === 402) {
        // Not paid yet — fetch pair status to show payment UI
        try {
          const statusRes = await axios.get(
            `${BACKEND_URL}/api/insights/compatibility/status`,
            { withCredentials: true }
          );
          const found = (statusRes.data.pairs || []).find(p => p.pair_id === pairId);
          setPair(found || null);
        } catch {
          setError('Could not load pair information.');
        }
      } else if (err.response?.status === 401) {
        navigate('/insights/unlock');
      } else {
        setError('Failed to load report.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      const loaded = await loadScript();
      if (!loaded) { alert('Could not load payment gateway. Please try again.'); setPaying(false); return; }

      const orderRes = await axios.post(
        `${BACKEND_URL}/api/insights/compatibility/payment`,
        { pair_id: pairId },
        { withCredentials: true }
      );
      const { order, already_paid } = orderRes.data;
      if (already_paid) { fetchData(); return; }

      if (order.is_dummy) {
        // Dummy mode — skip Razorpay widget
        await axios.post(
          `${BACKEND_URL}/api/insights/compatibility/verify-payment`,
          { pair_id: pairId, razorpay_payment_id: 'dummy_pay', razorpay_order_id: order.id },
          { withCredentials: true }
        );
        fetchData();
        return;
      }

      const options = {
        key:         order.razorpay_key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        'SoulSathiya',
        description: 'Compatibility Intelligence Report',
        order_id:    order.id,
        handler: async (response) => {
          await axios.post(
            `${BACKEND_URL}/api/insights/compatibility/verify-payment`,
            {
              pair_id:             pairId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
            },
            { withCredentials: true }
          );
          fetchData();
        },
        theme: { color: '#D4A520' },
      };
      new window.Razorpay(options).open();
    } catch (e) {
      alert('Payment initiation failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => {
    if (!report) return;
    const html = buildCompatPrintHTML(report);
    const win  = window.open('', '_blank');
    if (!win) { alert('Please allow pop-ups to save the report.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={40} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
      <div style={{ color: '#f87171', fontSize: 16 }}>{error}</div>
      <Link to="/insights/report" style={{ color: GOLD, fontSize: 14 }}>← Back to my report</Link>
    </div>
  );

  // ── Payment gate (pair not yet paid) ────────────────────────────────────
  if (!report && pair) {
    const ready = pair.status === 'both_ready';
    return (
      <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💞</div>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Compatibility Intelligence Report</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
            {ready
              ? `Both you and your partner have completed the 108-question assessment. Unlock your full compatibility analysis.`
              : `Waiting for your partner to complete their individual Relationship Intelligence Report.`
            }
          </div>
          {ready && (
            <button onClick={handlePayment} disabled={paying}
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                color: NAVY, border: 'none', borderRadius: 12,
                padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                width: '100%', marginBottom: 12,
              }}>
              {paying ? 'Processing…' : 'Unlock for ₹799'}
            </button>
          )}
          <Link to="/insights/report" style={{ color: 'rgba(212,165,32,0.6)', fontSize: 13 }}>← Back to my report</Link>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const r = report;

  // ── Full Report ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: NAVY, fontFamily: 'sans-serif' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(12,19,35,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`, padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/insights/report" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(212,165,32,0.7)', textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={16} /> My Report
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Heart size={18} color={GOLD} />
          <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>Soul<span style={{ color: 'rgba(255,255,255,0.9)' }}>Sathiya</span></span>
        </div>
        <button onClick={handlePrint}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(212,165,32,0.1)', border: `1px solid ${GOLD}40`,
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            color: GOLD, fontSize: 13, fontFamily: 'sans-serif',
          }}>
          <Download size={13} /> Save Report
        </button>
      </header>

      <main style={{ maxWidth: 780, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(212,165,32,0.1)',
            border: `1px solid ${BORDER}`, borderRadius: 20, padding: '6px 18px',
            color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 16,
          }}>Compatibility Intelligence Report</div>
          <h1 style={{
            color: 'rgba(255,255,255,0.95)', fontSize: 28, fontWeight: 700,
            marginBottom: 6,
          }}>
            {r.name_a} <span style={{ color: GOLD }}>×</span> {r.name_b}
          </h1>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            Based on 108-question deep assessments from both partners
          </div>
        </div>

        {/* Overall score + radar */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 24, marginBottom: 32,
          background: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 20, padding: '28px 24px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <ScoreRing score={r.overall_score} label={r.overall_label} />
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, textAlign: 'center' }}>
              {r.overall_narrative}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <DualRadarChart sections={r.sections || []} nameA={r.name_a} nameB={r.name_b} />
            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: GOLD, display: 'inline-block' }} /> {r.name_a}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#818cf8', display: 'inline-block' }} /> {r.name_b}
              </span>
            </div>
          </div>
        </div>

        {/* Top alignments + navigate */}
        {(r.top_alignments?.length > 0 || r.navigate_areas?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
            {r.top_alignments?.length > 0 && (
              <div style={{ background: 'rgba(22,101,52,0.12)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>✦ Your Greatest Alignments</div>
                {r.top_alignments.map((a, i) => (
                  <div key={i} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>• {a}</div>
                ))}
              </div>
            )}
            {r.navigate_areas?.length > 0 && (
              <div style={{ background: 'rgba(120,83,0,0.12)', border: '1px solid rgba(212,165,32,0.2)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🧭 Areas to Navigate Together</div>
                {r.navigate_areas.map((a, i) => (
                  <div key={i} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>• {a}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6 Section cards */}
        <h2 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: 700, marginBottom: 20, borderLeft: `3px solid ${GOLD}`, paddingLeft: 14 }}>
          Dimension-by-Dimension Analysis
        </h2>
        {(r.sections || []).map(s => (
          <SectionCard key={s.section_id} section={s} nameA={r.name_a} nameB={r.name_b} />
        ))}

        {/* Conversation prompts */}
        <h2 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: 700, margin: '32px 0 16px', borderLeft: `3px solid ${GOLD}`, paddingLeft: 14 }}>
          Conversation Starters for You Both
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(r.conversation_prompts || []).map((p, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px',
            }}>
              <div style={{
                minWidth: 28, height: 28, borderRadius: '50%',
                background: 'rgba(212,165,32,0.15)', border: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: GOLD, fontSize: 12, fontWeight: 700,
              }}>{i + 1}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.7 }}>{p}</div>
            </div>
          ))}
        </div>

        {/* Save CTA */}
        <div style={{
          marginTop: 40, textAlign: 'center',
          background: 'rgba(212,165,32,0.06)', border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: '28px 24px',
        }}>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Save Your Compatibility Report</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>
            Download a beautifully formatted print-ready version to keep and revisit together.
          </div>
          <button onClick={handlePrint} style={{
            background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
            color: NAVY, border: 'none', borderRadius: 10,
            padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <Download size={15} /> Print / Save as PDF
          </button>
        </div>

      </main>
    </div>
  );
}
