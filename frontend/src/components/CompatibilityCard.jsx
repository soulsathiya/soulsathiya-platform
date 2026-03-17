import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import CompatibilityReportModal from './CompatibilityReportModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Maps backend domain keys → human-readable display labels
const DOMAIN_DISPLAY = {
  emotional_style:        'Emotional Alignment',
  values:                 'Shared Values',
  marriage_expectations:  'Family & Marriage',
  lifestyle:              'Lifestyle',
  personality:            'Personality Harmony',
  trust_attachment:       'Trust & Attachment',
  growth_mindset:         'Growth Mindset',
};

// Animated progress bar
const ScoreBar = ({ label, value, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  const color =
    value >= 80 ? 'hsl(43,90%,58%)' :
    value >= 60 ? 'hsl(43,70%,50%)' :
                  'hsl(25,60%,45%)';

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
};

// Animated SVG ring for the main score
const ScoreRing = ({ score }) => {
  const [animated, setAnimated] = useState(0);
  const r = 52;
  const circumference = 2 * Math.PI * r;
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circumference - (animated / 100) * circumference;
  const color =
    score >= 80 ? 'hsl(43,90%,58%)' :
    score >= 65 ? 'hsl(43,70%,50%)' :
                  'hsl(25,60%,45%)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
      <svg width="128" height="128" className="absolute inset-0 -rotate-90">
        {/* track */}
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(212,165,32,0.15)" strokeWidth="8" />
        {/* progress */}
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s' }}
          filter="drop-shadow(0 0 6px rgba(212,165,32,0.5))"
        />
      </svg>
      <div className="z-10 text-center">
        <div className="font-heading font-bold leading-none" style={{ fontSize: 32, color }}>
          {Math.round(score)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">%</div>
      </div>
    </div>
  );
};

const getMatchLabel = (score) => {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 75) return 'Strong Match';
  if (score >= 65) return 'Good Match';
  return 'Growing Match';
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
        // Check if current viewer has completed profiling
        const statusRes = await axios.get(
          `${BACKEND_URL}/api/psychometric/status`,
          { withCredentials: true }
        );
        const hasProfile = statusRes.data?.completed === true;
        setViewer(hasProfile);

        if (hasProfile) {
          // Fetch compatibility — will 404 if target hasn't completed profiling
          const compRes = await axios.get(
            `${BACKEND_URL}/api/compatibility/${targetUserId}`,
            { withCredentials: true }
          );
          setCompatibility(compRes.data);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          // Target user hasn't completed profiling
          setCompatibility(null);
        } else if (err.response?.status !== 401) {
          setError('Could not load compatibility data.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="card-surface p-6 mb-6 flex items-center justify-center min-h-[100px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) return null;

  // Feature 3: Viewer hasn't completed profiling
  if (!viewerHasProfile) {
    return (
      <div className="card-surface p-8 mb-6 text-center border border-primary/20">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(212,165,32,0.15)' }}
        >
          <ClipboardList className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-heading text-lg mb-2">Unlock Compatibility Insights</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
          Complete your SoulSathiya Personality Profile to unlock compatibility insights with{' '}
          <span className="text-foreground font-medium">{targetName}</span>.
        </p>
        <Button onClick={() => navigate('/onboarding/psychometric')}>
          <Sparkles className="w-4 h-4 mr-2" />
          Start Personality Profile
        </Button>
      </div>
    );
  }

  // Target hasn't completed profiling either
  if (!compatibility) {
    return (
      <div className="card-surface p-6 mb-6 border border-primary/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(212,165,32,0.12)' }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Compatibility Insights Unavailable</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {targetName} hasn't completed their personality profile yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Feature 1: Full compatibility snapshot
  const score          = compatibility.compatibility_percentage ?? 0;
  const domainBreakdown = compatibility.domain_breakdown ?? {};
  const matchLabel     = getMatchLabel(score);

  // Build ordered display bars (top 6 by weight order)
  const domainOrder = [
    'emotional_style',
    'values',
    'marriage_expectations',
    'lifestyle',
    'personality',
    'trust_attachment',
  ];
  const bars = domainOrder
    .filter(k => domainBreakdown[k] !== undefined)
    .map(k => ({ key: k, label: DOMAIN_DISPLAY[k] || k, value: domainBreakdown[k] }));

  // Simple AI-style insight text (rule-based, same logic as Python utility)
  const sortedDomains = Object.entries(domainBreakdown).sort((a, b) => b[1] - a[1]);
  const top1 = sortedDomains[0];
  const top2 = sortedDomains[1];
  const low  = sortedDomains[sortedDomains.length - 1];
  const label = (key) => (DOMAIN_DISPLAY[key] || key).toLowerCase();
  const insightText = top1 && top2
    ? `You and ${targetName} share strong alignment in ${label(top1[0])} and ${label(top2[0])}. ` +
      `One area that may benefit from attention is ${label(low[0])}.`
    : `You and ${targetName} show meaningful compatibility across personality dimensions.`;

  return (
    <>
      {/* ── Compatibility Card ────────────────────────────────── */}
      <div
        className="mb-6 rounded-2xl overflow-hidden border border-primary/25"
        style={{ background: 'linear-gradient(135deg, hsl(225,35%,13%) 0%, hsl(225,38%,10%) 100%)' }}
      >
        {/* Header strip */}
        <div
          className="px-6 py-3 flex items-center gap-2"
          style={{ background: 'rgba(212,165,32,0.08)', borderBottom: '1px solid rgba(212,165,32,0.15)' }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold tracking-widest uppercase text-primary">
            Compatibility with {targetName}
          </span>
        </div>

        <div className="p-6">
          {/* Score + insight row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <ScoreRing score={score} />
              <span className="text-sm font-semibold text-primary">{matchLabel}</span>
            </div>
            <div className="flex-1 flex items-center sm:items-start">
              <p className="text-sm text-muted-foreground leading-relaxed text-center sm:text-left sm:pt-2">
                {insightText}
              </p>
            </div>
          </div>

          {/* Category bars */}
          <div className="mb-5">
            {bars.map((bar, i) => (
              <ScoreBar key={bar.key} label={bar.label} value={bar.value} delay={i * 60} />
            ))}
          </div>

          {/* CTA */}
          <Button
            variant="outline"
            className="w-full border-primary/30 hover:border-primary/60 text-primary hover:text-primary"
            onClick={() => setShowModal(true)}
          >
            View Full Compatibility Report
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Full Report Modal */}
      {showModal && (
        <CompatibilityReportModal
          compatibility={compatibility}
          targetName={targetName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default CompatibilityCard;
