/**
 * InsightsReportPage.jsx
 * ─────────────────────
 * Displays the full ₹999 Relationship Intelligence Report.
 * Requires auth + paid status. Redirects if not.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Download, ArrowRight, Zap, Heart, Send, CheckCircle2 } from 'lucide-react';

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
  const maxR = size / 2 - 48;
  const n = profiles.length;
  const SHORT_LABELS = ['Emotional', 'Values', 'Comm.', 'Patterns', 'Lifestyle', 'Future'];

  const getAngle = (i) => (2 * Math.PI * i / n) - Math.PI / 2;
  const pt = (i, radius) => ({
    x: cx + radius * Math.cos(getAngle(i)),
    y: cy + radius * Math.sin(getAngle(i)),
  });

  const ringFractions = [0.2, 0.4, 0.6, 0.8, 1.0];
  const dataPath = profiles.map((p, i) => pt(i, (Math.max(p.score || 0, 5) / 100) * maxR));
  const poly = dataPath.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <filter id="goldGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {ringFractions.map((frac, ri) => {
        const ringPts = profiles.map((_, i) => pt(i, frac * maxR));
        return (
          <polygon key={ri}
            points={ringPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke={ri === 4 ? 'rgba(212,165,32,0.4)' : 'rgba(212,165,32,0.18)'}
            strokeWidth={ri === 4 ? 1.5 : 1}
            strokeDasharray={ri < 4 ? '3 3' : 'none'}
          />
        );
      })}

      {/* Ring percentage labels */}
      {ringFractions.map((frac, ri) => (
        <text key={`rl-${ri}`}
          x={cx + 5} y={cy - frac * maxR + 4}
          fontSize={8} fill="rgba(212,165,32,0.5)" fontFamily="sans-serif">
          {frac * 100}
        </text>
      ))}

      {/* Axis spokes */}
      {profiles.map((_, i) => {
        const outer = pt(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
          stroke="rgba(212,165,32,0.3)" strokeWidth={1} />;
      })}

      {/* Data polygon — filled + outlined */}
      <polygon points={poly}
        fill="rgba(212,165,32,0.22)"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinejoin="round"
        filter="url(#goldGlow)"
      />

      {/* Data vertices */}
      {dataPath.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={6} fill={GOLD}
          stroke="#0C1323" strokeWidth={2} />
      ))}

      {/* Score labels pushed outward from each vertex */}
      {dataPath.map((p, i) => {
        const a = getAngle(i);
        const ox = Math.cos(a) * 18;
        const oy = Math.sin(a) * 18;
        return (
          <text key={`sv-${i}`}
            x={p.x + ox} y={p.y + oy}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fill={GOLD} fontFamily="sans-serif" fontWeight="700">
            {profiles[i].score}
          </text>
        );
      })}

      {/* Axis labels at outer edge */}
      {profiles.map((_, i) => {
        const lp = pt(i, maxR + 26);
        return (
          <text key={`lbl-${i}`}
            x={lp.x} y={lp.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fill="rgba(245,237,216,0.75)" fontFamily="sans-serif">
            {SHORT_LABELS[i]}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Always-visible section card with percentile ─────────────────────────── */
function SectionCard({ profile }) {
  const scoreColor = profile.score >= 75 ? GREEN
    : profile.score >= 55 ? GOLD
    : '#f87171';

  return (
    <div style={{ background: CARD, border: '1px solid rgba(212,165,32,0.18)',
      borderRadius: 16, overflow: 'hidden' }}>

      {/* Header row */}
      <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{profile.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: GOLD, fontFamily: 'sans-serif',
            letterSpacing: '0.07em', marginBottom: 3 }}>
            Level {profile.level}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{profile.title}</div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${profile.score}%`,
              background: `linear-gradient(90deg, ${GOLD}, #B8860B)`,
              borderRadius: 4 }} />
          </div>
          {profile.percentile && (
            <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(245,237,216,0.45)',
              fontFamily: 'sans-serif' }}>
              {profile.percentile}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor }}>{profile.score}</div>
          <div style={{ fontSize: 10, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif' }}>/100</div>
        </div>
      </div>

      {/* Full detail — always visible */}
      <div style={{ padding: '0 22px 22px', borderTop: '1px solid rgba(212,165,32,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 0 10px' }}>
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
/* ── Print-ready HTML generator ─────────────────────────────────────────── */
function buildPrintHTML(report) {
  const G   = '#8B6914';   // darker gold — legible on white paper
  const GL  = '#D4A520';   // lighter gold — decorative accents
  const N   = '#0C1323';   // deep navy — headings
  const T   = '#1E1E3A';   // body text
  const T2  = '#6B6B8A';   // secondary / meta text
  const GR  = '#166534';   // dark green — strengths
  const CB  = '#F7F6F0';   // warm card background

  const profiles = report.section_profiles || [];
  const n = profiles.length || 6;
  const LABELS = ['Emotional', 'Values', 'Comm.', 'Patterns', 'Lifestyle', 'Future'];

  /* Inline radar SVG */
  const radarCx = 180, radarCy = 180, radarMax = 128;
  const rAngle = i => (2 * Math.PI * i / n) - Math.PI / 2;
  const rPt = (i, r) => ({
    x: radarCx + r * Math.cos(rAngle(i)),
    y: radarCy + r * Math.sin(rAngle(i)),
  });
  const ringFracs = [0.2, 0.4, 0.6, 0.8, 1.0];
  const dPath = profiles.map((p, i) => rPt(i, (Math.max(p.score || 5, 5) / 100) * radarMax));
  const polyPts = dPath.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const ringsSVG = ringFracs.map((frac, ri) => {
    const rps = profiles.map((_, i) => rPt(i, frac * radarMax));
    return `<polygon points="${rps.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}"
      fill="none" stroke="${ri===4?G:'rgba(139,105,20,0.22)'}"
      stroke-width="${ri===4?1.5:1}" stroke-dasharray="${ri<4?'3 3':'none'}"/>`;
  }).join('');
  const spokesSVG = profiles.map((_, i) => {
    const o = rPt(i, radarMax);
    return `<line x1="${radarCx}" y1="${radarCy}" x2="${o.x.toFixed(1)}" y2="${o.y.toFixed(1)}" stroke="rgba(139,105,20,0.28)" stroke-width="1"/>`;
  }).join('');
  const vtxSVG = dPath.map((p, i) => {
    const a = rAngle(i); const ox = Math.cos(a)*20; const oy = Math.sin(a)*20;
    const lp = rPt(i, radarMax + 30);
    const sc = profiles[i].score >= 75 ? GR : profiles[i].score >= 55 ? G : '#C0392B';
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${G}" stroke="white" stroke-width="2"/>
      <text x="${(p.x+ox).toFixed(1)}" y="${(p.y+oy).toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
        font-size="11" fill="${sc}" font-family="sans-serif" font-weight="700">${profiles[i].score}</text>
      <text x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
        font-size="10" fill="${T2}" font-family="sans-serif">${LABELS[i]}</text>`;
  }).join('');
  const radarSVG = `<svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    ${ringsSVG}${spokesSVG}
    <polygon points="${polyPts}" fill="rgba(139,105,20,0.13)" stroke="${G}" stroke-width="2.5" stroke-linejoin="round"/>
    ${vtxSVG}</svg>`;

  /* Helpers */
  const sc = s => s >= 75 ? GR : s >= 55 ? G : '#C0392B';
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const genDate = report.generated_at
    ? new Date(report.generated_at).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})
    : new Date().toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'});
  const logoSrc = `${window.location.origin}/logo.png`;

  /* Section cards */
  const sectionsHTML = profiles.map(p => `
    <div class="sec-card">
      <div class="sec-head">
        <span class="sec-icon">${p.icon}</span>
        <div class="sec-meta">
          <div class="sec-level">Level ${p.level}</div>
          <div class="sec-title">${esc(p.title)}</div>
          <div class="bar-wrap"><div class="bar-fill" style="width:${p.score}%"></div></div>
          ${p.percentile ? `<div class="sec-pct">${esc(p.percentile)}</div>` : ''}
        </div>
        <div class="sec-num">
          <span style="color:${sc(p.score)};font-size:24px;font-weight:700;font-family:'Cormorant Garamond',Georgia,serif">${p.score}</span>
          <span style="font-size:11px;color:${T2};display:block;text-align:right">/100</span>
        </div>
      </div>
      <div class="sec-body">
        <div class="sec-badge"><span>${p.badge}</span>&nbsp;<strong>${esc(p.profile)}</strong></div>
        <p class="sec-sum">"${esc(p.summary)}"</p>
        <div class="two-col">
          <div class="str-box"><div class="box-lbl green-lbl">✦ STRENGTH</div><div class="box-txt">${esc(p.strength)}</div></div>
          <div class="gro-box"><div class="box-lbl gold-lbl">✦ GROWTH EDGE</div><div class="box-txt">${esc(p.growth)}</div></div>
        </div>
      </div>
    </div>`).join('');

  const strengthsHTML = (report.top_strengths||[]).map((s,i)=>`
    <div class="ls-row"><span class="ls-num green-num">${i+1}.</span><span>${esc(s)}</span></div>`).join('');
  const growthHTML = (report.growth_areas||[]).map((g,i)=>`
    <div class="ls-row"><span class="ls-num gold-num">${i+1}.</span><span>${esc(g)}</span></div>`).join('');
  const interHTML = (report.inter_dimension_insights||[]).map(ins=>`
    <div class="insight-row">${esc(ins)}</div>`).join('');
  const pdHTML = (report.partner_profile_dimensions||[]).map(d=>`
    <div class="pd-item">
      <div class="pd-head"><span>${d.icon}</span>&nbsp;<span class="pd-lbl">${esc(d.label)}</span></div>
      <div class="pd-txt">${esc(d.trait)}</div>
    </div>`).join('');
  const recsHTML = (report.recommendations||[]).map((rec,i)=>`
    <div class="rec-row">
      <div class="rec-num">${i+1}</div>
      <div class="rec-txt">${esc(rec)}</div>
    </div>`).join('');

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SoulSathiya — Relationship Intelligence Report</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4 portrait;margin:14mm 16mm 18mm}
body{font-family:Georgia,'Times New Roman',serif;background:#fff;color:${T};font-size:13px;line-height:1.72}

/* Print bar */
.print-bar{background:${N};padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.print-bar-brand{display:flex;align-items:center;gap:10px}
.print-bar-brand img{width:28px;height:28px}
.print-bar-name{font-family:Georgia,serif;font-size:16px;font-weight:700;color:#F5EDD8}
.print-bar-name span{color:${GL}}
.print-bar-tagline{font-family:sans-serif;font-size:10px;color:rgba(245,237,216,0.5);letter-spacing:.07em}
.print-btn{background:linear-gradient(135deg,${G},#6B5010);color:#fff;border:none;border-radius:8px;padding:10px 22px;font-size:13px;font-family:sans-serif;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;white-space:nowrap}
.print-btn:hover{background:#6B5010}
@media print{.print-bar{display:none!important}}

/* Page */
.page{max-width:680px;margin:0 auto;padding:20px 0 40px}

/* Report header */
.rh{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:2px solid ${G};margin-bottom:30px}
.rh-brand{display:flex;align-items:center;gap:12px}
.rh-logo{width:44px;height:44px;border-radius:8px}
.rh-name{font-family:Georgia,serif;font-size:22px;font-weight:700;color:${N}}
.rh-name span{color:${G}}
.rh-tagline{font-family:sans-serif;font-size:10px;color:${T2};letter-spacing:.07em;text-transform:uppercase;margin-top:3px}
.rh-right{text-align:right;font-family:sans-serif;font-size:11px;color:${T2}}
.rh-right strong{font-size:13px;color:${N};display:block;margin-bottom:2px}

/* Hero */
.hero{text-align:center;padding:26px 28px;background:${CB};border:1px solid rgba(139,105,20,0.18);border-radius:16px;margin-bottom:20px}
.hero-label{font-family:sans-serif;font-size:10px;color:${G};letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}
.hero-score{font-family:'Cormorant Garamond',Georgia,serif;font-size:72px;font-weight:700;color:${G};line-height:1}
.hero-denom{font-family:sans-serif;font-size:13px;color:${T2};margin-bottom:10px}
.hero-badge{display:inline-block;background:rgba(22,101,52,0.1);border:1px solid rgba(22,101,52,0.28);border-radius:20px;padding:4px 16px;font-size:11px;color:${GR};font-family:sans-serif;margin-bottom:16px}
.hero h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;color:${N};line-height:1.35;margin-bottom:12px}
.hero p{font-size:13.5px;color:${T2};line-height:1.8;max-width:500px;margin:0 auto}

/* Score context */
.sctx{border-left:3px solid ${G};padding:12px 16px;background:rgba(139,105,20,0.05);border-radius:0 8px 8px 0;margin-bottom:28px}
.sctx-lbl{font-family:sans-serif;font-size:9px;color:${G};letter-spacing:.09em;text-transform:uppercase;margin-bottom:5px;font-weight:600}
.sctx p{font-size:13px;color:${T};line-height:1.75}

/* Section headings */
.sh{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:700;color:${N};margin-bottom:4px;padding-bottom:7px;border-bottom:1px solid rgba(139,105,20,0.22)}
.ss{font-family:sans-serif;font-size:11px;color:${T2};margin-bottom:16px}

/* Radar */
.radar-wrap{display:flex;justify-content:center;padding:8px 0;margin-bottom:28px}

/* Dimension cards */
.sec-card{border:1px solid rgba(139,105,20,0.2);border-radius:12px;overflow:hidden;margin-bottom:13px;page-break-inside:avoid}
.sec-head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:${CB}}
.sec-icon{font-size:22px;flex-shrink:0}
.sec-meta{flex:1}
.sec-level{font-family:sans-serif;font-size:9px;color:${G};letter-spacing:.07em;text-transform:uppercase;margin-bottom:2px}
.sec-title{font-size:15px;font-weight:600;color:${N};margin-bottom:6px}
.bar-wrap{height:5px;background:rgba(139,105,20,0.15);border-radius:3px;overflow:hidden;margin-bottom:4px}
.bar-fill{height:100%;background:linear-gradient(90deg,${G},#C9982A);border-radius:3px}
.sec-pct{font-family:sans-serif;font-size:9px;color:${T2}}
.sec-num{text-align:right;flex-shrink:0}
.sec-body{padding:13px 16px;border-top:1px solid rgba(139,105,20,0.12)}
.sec-badge{display:flex;align-items:center;gap:7px;margin-bottom:7px;font-size:15px;font-weight:600;color:${N}}
.sec-sum{font-size:12.5px;line-height:1.8;color:${T2};font-style:italic;margin-bottom:10px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.str-box{background:rgba(22,101,52,0.06);border:1px solid rgba(22,101,52,0.2);border-radius:7px;padding:11px}
.gro-box{background:rgba(139,105,20,0.05);border:1px solid rgba(139,105,20,0.18);border-radius:7px;padding:11px}
.box-lbl{font-family:sans-serif;font-size:8.5px;letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px;font-weight:600}
.green-lbl{color:${GR}}.gold-lbl{color:${G}}
.box-txt{font-size:12px;line-height:1.62;color:${T}}

/* Attachment */
.attach{border:1px solid rgba(139,105,20,0.2);border-radius:12px;padding:20px;margin-bottom:26px;background:${CB};page-break-inside:avoid}
.attach-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.attach-emoji{font-size:30px}
.attach-lbl{font-family:sans-serif;font-size:9px;color:${G};letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.attach-name{font-family:'Cormorant Garamond',Georgia,serif;font-size:21px;font-weight:700;color:${N}}
.attach-desc{font-size:13px;line-height:1.8;color:${T};margin-bottom:12px}
.attach-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.attach-in{background:rgba(139,105,20,0.05);border:1px solid rgba(139,105,20,0.15);border-radius:7px;padding:12px}
.attach-pt{background:rgba(22,101,52,0.05);border:1px solid rgba(22,101,52,0.15);border-radius:7px;padding:12px}
.attach-bl{font-family:sans-serif;font-size:8.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:600;margin-bottom:5px}
.attach-bl.gold{color:${G}}.attach-bl.green{color:${GR}}
.attach-bt{font-size:12px;line-height:1.62;color:${T}}

/* Strengths/Growth */
.sg-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:26px}
.sg-box{border:1px solid rgba(139,105,20,0.2);border-radius:12px;padding:18px}
.sg-h{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:700;margin-bottom:12px}
.sg-h.green{color:${GR}}.sg-h.gold{color:${G}}
.ls-row{display:flex;gap:8px;margin-bottom:10px;font-size:12.5px;line-height:1.65;color:${T}}
.ls-num{flex-shrink:0;font-weight:700}.green-num{color:${GR}}.gold-num{color:${G}}

/* Inter-dimension */
.insight-row{border-left:3px solid ${G};padding:11px 14px;background:rgba(139,105,20,0.04);border-radius:0 7px 7px 0;margin-bottom:9px;font-size:12.5px;line-height:1.75;color:${T};page-break-inside:avoid}

/* Partner profile */
.partner{border:1px solid rgba(139,105,20,0.2);border-radius:12px;padding:20px;margin-bottom:26px;page-break-inside:avoid}
.partner-sum{font-size:13.5px;line-height:1.85;color:${T};margin-bottom:16px}
.pd-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.pd-item{background:rgba(139,105,20,0.04);border:1px solid rgba(139,105,20,0.15);border-radius:7px;padding:11px 13px}
.pd-head{display:flex;align-items:center;gap:5px;margin-bottom:4px}
.pd-lbl{font-family:sans-serif;font-size:9px;color:${G};letter-spacing:.07em;text-transform:uppercase;font-weight:600}
.pd-txt{font-size:12px;line-height:1.6;color:${T}}

/* Commitment */
.commit{border:1px solid rgba(139,105,20,0.2);border-radius:12px;padding:20px;margin-bottom:26px;background:${CB};page-break-inside:avoid}
.commit-tier{font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:700;color:${N}}
.cbar-wrap{height:7px;background:rgba(139,105,20,0.15);border-radius:5px;overflow:hidden;margin:9px 0}
.cbar-fill{height:100%;background:linear-gradient(90deg,${G},#C9982A);border-radius:5px}
.commit-msg{font-size:12.5px;line-height:1.75;color:${T2};font-style:italic;margin-top:10px;padding-top:10px;border-top:1px solid rgba(139,105,20,0.15)}

/* Recommendations */
.rec-row{display:flex;gap:13px;background:${CB};border:1px solid rgba(139,105,20,0.15);border-radius:9px;padding:13px 15px;margin-bottom:9px;page-break-inside:avoid}
.rec-num{flex-shrink:0;width:26px;height:26px;background:rgba(139,105,20,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:12px;font-weight:700;color:${G}}
.rec-txt{font-size:12.5px;line-height:1.77;color:${T}}

/* Footer */
.rfooter{margin-top:36px;padding-top:14px;border-top:1.5px solid rgba(139,105,20,0.28);display:flex;justify-content:space-between;align-items:center;font-family:sans-serif;font-size:10px;color:${T2}}
.rfooter-brand{font-weight:600;color:${N}}

/* Page breaks */
.pb{page-break-before:always}
</style></head><body>

<!-- Print bar (hidden on print) -->
<div class="print-bar">
  <div class="print-bar-brand">
    <img src="${logoSrc}" alt="SoulSathiya" onerror="this.style.display='none'"/>
    <div>
      <div class="print-bar-name">Soul<span>Sathiya</span></div>
      <div class="print-bar-tagline">Relationship Intelligence Report</div>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨️&nbsp; Print / Save as PDF</button>
</div>

<div class="page">

  <!-- Report Header -->
  <div class="rh">
    <div class="rh-brand">
      <img src="${logoSrc}" alt="" class="rh-logo" onerror="this.style.display='none'"/>
      <div>
        <div class="rh-name">Soul<span>Sathiya</span></div>
        <div class="rh-tagline">AI-Powered Relationship Intelligence</div>
      </div>
    </div>
    <div class="rh-right">
      <strong>Relationship Intelligence Report</strong>
      Generated ${genDate}
    </div>
  </div>

  <!-- Hero -->
  <div class="hero">
    <div class="hero-label">${esc(report.overall_label||'')} Relationship Intelligence</div>
    <div class="hero-score">${report.overall_score}</div>
    <div class="hero-denom">out of 100</div>
    ${report.overall_percentile ? `<div class="hero-badge">${esc(report.overall_percentile)}</div>` : ''}
    <h1>${esc(report.headline||'Your Relationship Intelligence Report')}</h1>
    <p>${esc(report.summary||'')}</p>
  </div>

  <!-- Score Context -->
  ${report.score_context ? `<div class="sctx"><div class="sctx-lbl">What Your Score Means</div><p>${esc(report.score_context)}</p></div>` : ''}

  <!-- Radar Chart -->
  ${profiles.length > 0 ? `
  <div style="margin-bottom:28px">
    <h2 class="sh">Your Profile at a Glance</h2>
    <p class="ss">A visual map of all six relationship intelligence dimensions.</p>
    <div class="radar-wrap">${radarSVG}</div>
  </div>` : ''}

  <!-- Six Dimensions -->
  <div style="margin-bottom:28px">
    <h2 class="sh">Your Six Dimensions</h2>
    <p class="ss">Full personalised analysis across all six relationship intelligence areas.</p>
    ${sectionsHTML}
  </div>

  <!-- Attachment Style -->
  ${report.attachment_style ? `
  <div style="margin-bottom:28px">
    <h2 class="sh">Your Attachment Style</h2>
    <p class="ss">Identified from your responses to the Emotional Foundation section.</p>
    <div class="attach">
      <div class="attach-head">
        <span class="attach-emoji">${report.attachment_style.emoji}</span>
        <div>
          <div class="attach-lbl">Attachment Style</div>
          <div class="attach-name">${esc(report.attachment_style.name)}</div>
        </div>
      </div>
      <p class="attach-desc">${esc(report.attachment_style.description)}</p>
      <div class="attach-grid">
        <div class="attach-in"><div class="attach-bl gold">In Relationships</div><div class="attach-bt">${esc(report.attachment_style.in_relationships)}</div></div>
        <div class="attach-pt"><div class="attach-bl green">Ideal Partner Trait</div><div class="attach-bt">${esc(report.attachment_style.ideal_partner_trait)}</div></div>
      </div>
    </div>
  </div>` : ''}

  <!-- Strengths & Growth -->
  <div style="margin-bottom:28px">
    <div class="sg-grid">
      <div class="sg-box"><h3 class="sg-h green">✦ Your Top Strengths</h3>${strengthsHTML}</div>
      <div class="sg-box"><h3 class="sg-h gold">✦ Growth Opportunities</h3>${growthHTML}</div>
    </div>
  </div>

  <!-- Inter-dimension Insights -->
  ${interHTML ? `
  <div style="margin-bottom:28px">
    <h2 class="sh">How Your Dimensions Interact</h2>
    <p class="ss">The most meaningful insights live at the intersection of your dimensions.</p>
    ${interHTML}
  </div>` : ''}

  <!-- Commitment Score -->
  ${report.xp_earned !== undefined ? `
  <div style="margin-bottom:28px">
    <h2 class="sh">Your Commitment Score</h2>
    <div class="commit">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-size:24px">${report.commitment_badge||''}</span>
        <div>
          <div class="commit-tier">${esc(report.commitment_tier||'')}</div>
          <div style="font-family:sans-serif;font-size:11px;color:${T2}">Dedication level</div>
        </div>
      </div>
      <div class="cbar-wrap"><div class="cbar-fill" style="width:${report.commitment_pct||0}%"></div></div>
      <div style="font-family:sans-serif;font-size:12px;color:${T2}">
        <strong style="color:${G};font-size:15px">${(report.xp_earned||0).toLocaleString()}</strong> / ${(report.xp_max||1080).toLocaleString()} XP &nbsp;·&nbsp; ${report.commitment_pct||0}% complete
      </div>
      ${report.commitment_message ? `<div class="commit-msg">"${esc(report.commitment_message)}"</div>` : ''}
    </div>
  </div>` : ''}

  <!-- Ideal Partner Profile -->
  <div style="margin-bottom:28px">
    <h2 class="sh">❤️ Your Ideal Partner Profile</h2>
    <div class="partner">
      <p class="partner-sum">${esc(report.partner_compatibility_profile||'')}</p>
      ${pdHTML ? `<div class="pd-grid">${pdHTML}</div>` : ''}
    </div>
  </div>

  <!-- Recommendations -->
  <div style="margin-bottom:28px">
    <h2 class="sh">Your Personalised Recommendations</h2>
    <p class="ss">Each recommendation below is specific to your scores and patterns.</p>
    ${recsHTML}
  </div>

  <!-- Footer -->
  <div class="rfooter">
    <span><span class="rfooter-brand">SoulSathiya</span> · Relationship Intelligence Report · soulsathiya.com</span>
    <span>Generated ${genDate} · Confidential</span>
  </div>

</div>
</body></html>`;
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function InsightsReportPage() {
  const navigate   = useNavigate();
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [inviteEmail,  setInviteEmail]  = useState('');
  const [inviting,     setInviting]     = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError,  setInviteError]  = useState('');

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

  const handlePrint = () => {
    const html = buildPrintHTML(r);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Pop-up blocked — please allow pop-ups for this site and try again.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

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
        <button onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(212,165,32,0.1)', border: `1px solid ${GOLD}40`,
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            color: GOLD, fontSize: 13, fontFamily: 'sans-serif' }}>
          <Download size={13} /> Print / Save as PDF
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
        {r.section_profiles?.length > 0 && (
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

        {/* ══ 11. Compatibility Intelligence — Invite Partner ══ */}
        <section style={{ marginBottom: 48 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(212,165,32,0.07), rgba(99,102,241,0.07))',
            border: '1px solid rgba(212,165,32,0.22)', borderRadius: 20,
            padding: '36px 32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Heart size={20} color={GOLD} />
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, margin: 0 }}>
                Explore Your <span style={{ color: GOLD }}>Compatibility Intelligence</span>
              </h2>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(245,237,216,0.65)', lineHeight: 1.75, marginBottom: 24, maxWidth: 560 }}>
              If your partner has also completed their 108-question assessment, invite them to generate a
              <strong style={{ color: 'rgba(245,237,216,0.9)' }}> Compatibility Intelligence Report</strong> — a deep cross-analysis
              of both your profiles across all 6 dimensions. One of you pays ₹799; both get full access.
            </p>

            {inviteResult ? (
              /* Success state */
              <div style={{
                background: 'rgba(22,101,52,0.15)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 14, padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CheckCircle2 size={20} color="#4ade80" />
                  <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 15 }}>Invitation Created!</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
                  Share this link with your partner. Once they accept and both reports are ready, either of you can unlock the Compatibility Report for ₹799.
                </p>
                <div style={{
                  background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px',
                  color: GOLD, fontSize: 12, wordBreak: 'break-all', fontFamily: 'monospace',
                  border: '1px solid rgba(212,165,32,0.2)',
                }}>
                  {inviteResult.invite_link}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(inviteResult.invite_link); }}
                    style={{
                      background: 'rgba(212,165,32,0.15)', border: '1px solid rgba(212,165,32,0.3)',
                      borderRadius: 8, padding: '8px 16px', color: GOLD,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                    Copy Link
                  </button>
                  {inviteResult.pair_id && (
                    <button
                      onClick={() => navigate(`/insights/compatibility/report/${inviteResult.pair_id}`)}
                      style={{
                        background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                        color: NAVY, border: 'none', borderRadius: 8,
                        padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                      View Compatibility Report <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Invite form */
              <div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 520 }}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                    placeholder="Partner's email address"
                    style={{
                      flex: 1, minWidth: 200,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,165,32,0.25)',
                      borderRadius: 10, padding: '11px 16px', color: '#F5EDD8',
                      fontSize: 14, fontFamily: 'sans-serif', outline: 'none',
                    }}
                  />
                  <button
                    disabled={inviting || !inviteEmail.trim()}
                    onClick={async () => {
                      setInviting(true); setInviteError('');
                      try {
                        const res = await axios.post(
                          `${BACKEND_URL}/api/insights/compatibility/invite`,
                          { partner_email: inviteEmail.trim() },
                          { withCredentials: true }
                        );
                        setInviteResult(res.data);
                      } catch (e) {
                        setInviteError(e.response?.data?.detail || 'Failed to send invitation. Please try again.');
                      } finally { setInviting(false); }
                    }}
                    style={{
                      background: inviting ? 'rgba(212,165,32,0.4)' : `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                      color: NAVY, border: 'none', borderRadius: 10,
                      padding: '11px 20px', fontSize: 14, fontWeight: 700,
                      cursor: inviting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
                    }}>
                    <Send size={14} /> {inviting ? 'Sending…' : 'Invite Partner'}
                  </button>
                </div>
                {inviteError && (
                  <div style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>{inviteError}</div>
                )}
                <p style={{ color: 'rgba(245,237,216,0.4)', fontSize: 12, marginTop: 12 }}>
                  Your partner will receive a personalised invite link. Both individual reports must be unlocked before the compatibility report can be generated.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ══ 12. CTA ══ */}
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
