import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ClipboardList, Loader2, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import RadarChart from './RadarChart';
import CompatibilityReportModal from './CompatibilityReportModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Maps backend domain keys → display labels (6 canonical categories)
const DISPLAY_MAP = [
  { key: 'emotional_style',       label: 'Emotional Alignment',  insight: 'You both naturally express emotions openly, creating strong emotional safety.' },
  { key: 'values',                label: 'Life Goals',           insight: 'Your core values and life ambitions are deeply aligned.' },
  { key: 'personality',           label: 'Communication',        insight: 'Your communication styles complement each other naturally.' },
  { key: 'trust_attachment',      label: 'Conflict Resolution',  insight: 'A secure attachment style helps you navigate disagreements with care.' },
  { key: 'marriage_expectations', label: 'Family Values',        insight: 'Shared vision for family life makes long-term planning feel effortless.' },
  { key: 'lifestyle',             label: 'Intimacy',             insight: 'Your lifestyle rhythms and closeness needs are beautifully in sync.' },
];

const getMatchLabel = (score) => {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 75) return 'Strong Match';
  if (score >= 65) return 'Good Match';
  return 'Growing Match';
};

const getInsightSentence = (score, targetName) => {
  if (score >= 85) return `A deeply natural fit — aligned in values, emotion, and the way you both picture a life well lived.`;
  if (score >= 75) return `You and ${targetName} share meaningful common ground across the dimensions that matter most.`;
  if (score >= 65) return `Genuine potential here — with open communication, this connection can grow beautifully.`;
  return `Every great relationship starts somewhere — understanding your differences is the first step.`;
};

// Animated gold-gradient progress bar
const ScoreBar = ({ label, value, insight, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 mb-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#D4AF37' }} />
        <span className="text-xs font-semibold text-foreground flex-1">{label}</span>
        <span className="text-xs font-bold" style={{ color: '#D4AF37' }}>{Math.round(value)}%</span>
      </div>
      {/* h-2 gold gradient bar */}
      <div className="h-2 rounded-full bg-white/8 overflow-hidden mx-5">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: 'linear-gradient(90deg, #b8860b 0%, #D4AF37 60%, #f5d060 100%)',
          }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5 mx-5 leading-snug">{insight}</p>
    </div>
  );
};

// Animated score ring
const ScoreRing = ({ score }) => {
  const [animated, setAnimated] = useState(0);
  const r = 48;
  const circumference = 2 * Math.PI * r;
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);
  const offset = circumference - (animated / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
      <svg width="112" height="112" className="absolute inset-0 -rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="7" />
        <circle
          cx="56" cy="56" r={r}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          filter="drop-shadow(0 0 5px rgba(212,175,55,0.4))"
        />
      </svg>
      <div className="z-10 text-center">
        <div className="font-heading font-bold leading-none" style={{ fontSize: 30, color: '#D4AF37' }}>
          {Math.round(score)}
        </div>
        <div className="text-[10px] text-muted-foreground">%</div>
      </div>
    </div>
  );
};

/**
 * CompatibilityCard
 * Props:
 *   targetUserId  — the profile being viewed
 *   targetName    — display name of target user
 */
const CompatibilityCard = ({ targetUserId, targetName }) => {
  const navigate = useNavigate();
  const [loading, setLoading]             = useState(true);
  const [viewerHasProfile, setViewer]     = useState(false);
  const [compatibility, setCompatibility] = useState(null);
  const [error, setError]                 = useState(null);
  const [showModal, setShowModal]         = useState(false);

  useEffect(() => {
    if (!targetUserId) return;
    const load = async () => {
      try {
        const statusRes = await axios.get(`${BACKEND_URL}/api/psychometric/status`, { withCredentials: true });
        const hasProfile = statusRes.data?.completed === true;
        setViewer(hasProfile);
        if (hasProfile) {
          const compRes = await axios.get(`${BACKEND_URL}/api/compatibility/${targetUserId}`, { withCredentials: true });
          setCompatibility(compRes.data);
        }
      } catch (err) {
        if (err.response?.status !== 404 && err.response?.status !== 401) {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="card-surface p-5 mb-6 flex items-center justify-center min-h-[80px]">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error) return null;

  // Viewer hasn't completed profiling
  if (!viewerHasProfile) {
    return (
      <div className="card-surface p-6 mb-6 text-center border border-primary/20">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(212,175,55,0.12)' }}>
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-heading text-base font-semibold mb-1.5">Unlock Compatibility Insights</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
          Complete your SoulSathiya Personality Profile to unlock compatibility insights with{' '}
          <span className="text-foreground font-medium">{targetName}</span>.
        </p>
        <Button size="sm" onClick={() => navigate('/onboarding/psychometric')}>
          <Sparkles className="w-3.5 h-3.5 mr-2" />
          Start Personality Profile
        </Button>
      </div>
    );
  }

  // Target hasn't completed profiling
  if (!compatibility) {
    return (
      <div className="card-surface px-5 py-4 mb-6 border border-primary/10 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">Compatibility Insights Unavailable</p>
          <p className="text-xs text-muted-foreground">{targetName} hasn't completed their personality profile yet.</p>
        </div>
      </div>
    );
  }

  const score           = compatibility.compatibility_percentage ?? 0;
  const domainBreakdown = compatibility.domain_breakdown ?? {};
  const matchLabel      = getMatchLabel(score);
  const insightText     = getInsightSentence(score, targetName);

  // Build 6 display rows with scores from backend
  const displayRows = DISPLAY_MAP.map(row => ({
    ...row,
    value: domainBreakdown[row.key] ?? 0,
  }));

  // Radar chart uses the same 6 display labels
  const radarDimensions = displayRows.map(r => ({ label: r.label, value: Math.round(r.value) }));

  return (
    <>
      <div
        className="mb-6 rounded-2xl overflow-hidden border border-primary/20"
        style={{ background: 'linear-gradient(135deg, hsl(225,35%,12%) 0%, hsl(225,38%,9%) 100%)' }}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="px-5 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(212,175,55,0.07)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-primary">
            Compatibility with {targetName}
          </span>
        </div>

        {/* ── Two-column body ──────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-0">

          {/* LEFT: Score + Radar + Legend */}
          <div
            className="p-5 flex flex-col items-center gap-4 border-b md:border-b-0 md:border-r"
            style={{ borderColor: 'rgba(212,175,55,0.10)' }}
          >
            {/* Score card */}
            <div className="text-center w-full">
              <div className="flex items-center justify-center gap-3 mb-1">
                <ScoreRing score={score} />
                <div className="text-left">
                  <div className="text-[11px] text-muted-foreground mb-0.5">Compatibility</div>
                  <div className="font-heading font-bold text-lg leading-tight" style={{ color: '#D4AF37' }}>
                    {matchLabel} <span style={{ fontSize: 13 }}>✦</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed text-center px-2 mt-1">
                {insightText}
              </p>
            </div>

            {/* Radar chart */}
            <div className="flex justify-center w-full">
              <RadarChart dimensions={radarDimensions} size={340} showLabels={true} />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="w-6 border-t-2" style={{ borderColor: '#D4AF37' }} />
              <span>Compatibility shape</span>
            </div>
          </div>

          {/* RIGHT: 6 insight cards */}
          <div className="p-5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              Compatibility Insights
            </p>

            <div>
              {displayRows.map((row, i) => (
                <ScoreBar
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  insight={row.insight}
                  delay={i * 60}
                />
              ))}
            </div>

            {/* Deep Exploration teaser strip */}
            <button
              onClick={() => navigate(`/profile/${targetUserId}`, { state: { openDeep: true } })}
              className="mt-4 w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: 'linear-gradient(90deg,rgba(99,60,180,0.16),rgba(139,92,246,0.10))',
                border: '1px solid rgba(139,92,246,0.28)',
              }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139,92,246,0.18)' }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold leading-tight" style={{ color: '#c4b5fd' }}>
                  Want deeper insights?
                </p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(196,181,253,0.65)' }}>
                  108-question Relationship Intelligence Report
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#a78bfa' }} />
            </button>

            {/* View full report CTA */}
            <button
              onClick={() => setShowModal(true)}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-2 rounded-lg border border-primary/20 hover:border-primary/40"
            >
              View Full Compatibility Report
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <CompatibilityReportModal
          compatibility={compatibility}
          targetName={targetName}
          targetUserId={targetUserId}
          displayRows={displayRows}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default CompatibilityCard;
