import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Sparkles, Check, ArrowRight, ArrowDown, Brain,
  CheckCircle2, Heart, Lock, Star, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import RadarChart from '../components/RadarChart';
import RotatingTagline from '../components/RotatingTagline';
import { getDimensionInsight, getOverallInsight } from '../utils/compatibilityInsights';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';

// ─── Brand logo ───────────────────────────────────────────────────────────────
const SoulSathiyaLogo = ({ className = 'w-9 h-9' }) => (
  <img
    src="/logo.png"
    alt="SoulSathiya"
    className={`${className} object-contain`}
    draggable={false}
  />
);

// ─── Mandala particle data ────────────────────────────────────────────────────
const MANDALA_PARTICLES = [
  { top: '76%', left: '18%', size: '5px', dur: '5s',   delay: '0s',   drift: '10px'  },
  { top: '80%', left: '45%', size: '4px', dur: '7s',   delay: '1.2s', drift: '-7px'  },
  { top: '68%', left: '72%', size: '6px', dur: '6s',   delay: '0.4s', drift: '8px'   },
  { top: '84%', left: '30%', size: '4px', dur: '8s',   delay: '2s',   drift: '-10px' },
  { top: '73%', left: '60%', size: '5px', dur: '5.5s', delay: '0.9s', drift: '12px'  },
  { top: '82%', left: '82%', size: '4px', dur: '7s',   delay: '2.8s', drift: '-8px'  },
  { top: '88%', left: '12%', size: '5px', dur: '6s',   delay: '0.6s', drift: '6px'   },
  { top: '78%', left: '55%', size: '4px', dur: '8s',   delay: '3.2s', drift: '-12px' },
  { top: '71%', left: '88%', size: '6px', dur: '5.5s', delay: '1.6s', drift: '9px'   },
  { top: '90%', left: '40%', size: '4px', dur: '6.5s', delay: '0.8s', drift: '-6px'  },
];

// ─── Pricing Section (self-contained sub-component) ──────────────────────────

const PREMIUM_TIERS = [
  { key: '1mo', period: '1 month',  price: 999,   strike: 1999,  label: null           },
  { key: '3mo', period: '3 months', price: 2499,  strike: 3999,  label: 'Most Chosen'  },
  { key: '6mo', period: '6 months', price: 4999,  strike: 7999,  label: 'Best Value'   },
];
const ELITE_TIERS = [
  { key: '1mo', period: '1 month',  price: 2499,  strike: null,  label: null           },
  { key: '3mo', period: '3 months', price: 6999,  strike: null,  label: 'Best Value'   },
  { key: '6mo', period: '6 months', price: 12999, strike: null,  label: 'Best Savings' },
];

function PlanBadge({ children, variant = 'gold' }) {
  const styles = {
    gold:   'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black',
    blue:   'bg-blue-600 text-white',
    new:    'bg-gradient-to-r from-emerald-500 to-teal-400 text-white',
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white',
  };
  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold tracking-wide shadow ${styles[variant]}`}>
      {children}
    </span>
  );
}

function PeriodToggle({ tiers, selected, onChange }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/20 p-0.5 gap-0.5">
      {tiers.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`
            relative flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
            ${selected === t.key
              ? 'bg-yellow-500 text-black shadow'
              : 'text-white/60 hover:text-white/90'}
          `}
        >
          {t.period.split(' ')[0]}&nbsp;mo
          {t.label && selected !== t.key && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
              {t.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function FeatureRow({ text }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Check className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
      <span className="text-white/75 leading-snug">{text}</span>
    </li>
  );
}

function PricingSection() {
  const [premiumKey, setPremiumKey] = useState('3mo');
  const [eliteKey,   setEliteKey]   = useState('3mo');

  const premiumTier = PREMIUM_TIERS.find(t => t.key === premiumKey);
  const eliteTier   = ELITE_TIERS.find(t => t.key === eliteKey);

  return (
    <section className="py-20 px-4 bg-card/40" id="pricing">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <Sparkles className="w-4 h-4" />
            Transparent Pricing
          </div>
          <h2 className="font-heading text-4xl font-bold text-foreground mb-3">
            Upgrade Your <span className="text-primary">Experience</span>
          </h2>
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide mb-4">
            ⚡ Founding Member Pricing — Limited Time
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">

          {/* ── Free ──────────────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-white/8 bg-[#0F1A2E] p-6 gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Free</p>
              <h3 className="font-heading text-xl font-bold text-white">Start Free</h3>
              <p className="text-xs text-white/50 leading-snug">Start Your Compatibility Journey</p>
            </div>
            <div>
              <span className="text-4xl font-extrabold text-white">₹0</span>
              <span className="text-white/40 text-sm ml-1">forever</span>
            </div>
            <ul className="space-y-2.5 flex-1">
              {['Create your personality profile','10 curated matches / month','3 interests per month','Basic compatibility insights','Browse verified profiles'].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                  <span className="text-white/55 leading-snug">{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="block">
              <button className="w-full py-2.5 rounded-xl border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-sm font-semibold transition-all duration-200">
                Start Finding Matches
              </button>
            </Link>
          </div>

          {/* ── Premium ─────────────────────────────────────────────── */}
          <div
            className="flex flex-col rounded-2xl p-6 gap-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl xl:scale-105 xl:-translate-y-1"
            style={{
              background:  'linear-gradient(155deg, #1a2a1a 0%, #0F1A2E 60%)',
              border:      '1.5px solid rgba(212,175,55,0.55)',
              boxShadow:   '0 0 40px rgba(212,175,55,0.12), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge variant="gold">⭐ Most Popular</PlanBadge>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-yellow-400/60 uppercase tracking-widest">Premium</p>
              <h3 className="font-heading text-xl font-bold text-white">Find Your Match</h3>
              <p className="text-xs text-white/50 leading-snug">Unlock deeper compatibility &amp; real connections</p>
            </div>

            <PeriodToggle tiers={PREMIUM_TIERS} selected={premiumKey} onChange={setPremiumKey} />

            <div>
              {premiumTier.strike && (
                <p className="text-xs text-white/35 line-through mb-0.5">
                  ₹{premiumTier.strike.toLocaleString('en-IN')}
                </p>
              )}
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-yellow-400">
                  ₹{premiumTier.price.toLocaleString('en-IN')}
                </span>
                <span className="text-white/40 text-sm">/ {premiumTier.period}</span>
              </div>
              {premiumTier.label && (
                <span className="inline-block mt-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded-full">
                  {premiumTier.label}
                </span>
              )}
            </div>

            <ul className="space-y-2.5 flex-1">
              {[
                'Unlimited profile views & interests',
                'Advanced compatibility filters',
                'See who viewed your profile',
                'Priority customer support',
                'Deep Compatibility Report (add-on)',
                'Weekly curated match digest',
              ].map(f => <FeatureRow key={f} text={f} />)}
            </ul>

            <Link to="/register" className="block">
              <button
                className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC5A)', color: '#000' }}
              >
                Find Your Compatible Partner →
              </button>
            </Link>
          </div>

          {/* ── Elite ───────────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-purple-500/30 bg-[#0F1A2E] p-6 gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            style={{ boxShadow: '0 0 24px rgba(139,92,246,0.08)' }}>
            <div className="flex items-center gap-2">
              <PlanBadge variant="purple">💎 Most Comprehensive</PlanBadge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-purple-400/60 uppercase tracking-widest">Elite</p>
              <h3 className="font-heading text-xl font-bold text-white">Elite Matchmaking</h3>
              <p className="text-xs text-white/50 leading-snug">For serious seekers of a lifelong partner</p>
            </div>

            <PeriodToggle tiers={ELITE_TIERS} selected={eliteKey} onChange={setEliteKey} />

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-purple-400">
                  ₹{eliteTier.price.toLocaleString('en-IN')}
                </span>
                <span className="text-white/40 text-sm">/ {eliteTier.period}</span>
              </div>
              {eliteTier.label && (
                <span className="inline-block mt-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-full">
                  {eliteTier.label}
                </span>
              )}
            </div>

            <ul className="space-y-2.5 flex-1">
              {[
                'Everything in Premium',
                'Weekly profile boost included',
                'Dedicated relationship manager',
                'Verified priority placement',
                'Exclusive high-intent matches',
                'Unlimited Compatibility Reports',
                'Video call introduction service',
              ].map(f => <FeatureRow key={f} text={f} />)}
            </ul>

            <Link to="/register" className="block">
              <button className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25">
                Get Premium Matchmaking Experience →
              </button>
            </Link>
          </div>

          {/* ── Relationship Intelligence ─────────────────────────── */}
          <div className="flex flex-col rounded-2xl bg-[#0F1A2E] p-6 gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            style={{ border: '1.5px solid rgba(212,165,32,0.4)', boxShadow: '0 0 30px rgba(212,165,32,0.08)' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge variant="gold">🧠 Self-Assessment</PlanBadge>
              <PlanBadge variant="new">Start Instantly</PlanBadge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-yellow-400/60 uppercase tracking-widest">Relationship Intelligence</p>
              <h3 className="font-heading text-xl font-bold text-white">Know Yourself First</h3>
              <p className="text-xs text-white/50 leading-snug">A guided experience · 6 dimensions · private</p>
            </div>

            <div>
              <p className="text-xs text-white/35 mb-0.5">Start free · Full report one-time</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-yellow-400">₹999</span>
              </div>
              <span className="inline-block mt-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded-full">
                Assessment is completely free
              </span>
            </div>

            <ul className="space-y-2.5 flex-1">
              {[
                'Start instantly — no signup needed',
                'Personalised insight after each level',
                'Emotional & communication profile',
                'Relationship pattern analysis',
                'Ideal partner compatibility profile',
                '6 personalised recommendations',
              ].map(f => <FeatureRow key={f} text={f} />)}
            </ul>

            <Link to="/insights" className="block">
              <button
                className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC5A)', color: '#000' }}
              >
                Start Free Assessment →
              </button>
            </Link>
          </div>
        </div>

        {/* Microcopy */}
        <p className="text-center text-sm text-white/35 mt-10">
          Start free. Upgrade when you're ready to take your journey seriously.
        </p>

      </div>
    </section>
  );
}

// ─── Guided Journey Section (NEW) ────────────────────────────────────────────
// Two-step visual flow: self-discovery → matchmaking
// Placed immediately after hero so users always know what to do next.
function GuidedJourneySection() {
  return (
    <section className="py-16 px-6 bg-card/30 border-b border-primary/10" id="get-started">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Start With Yourself.{' '}
            <span className="text-primary">Then Find the Right Match.</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Two clear steps. One meaningful journey.
          </p>
        </div>

        {/* 2-step flow — same layout pattern as How It Works */}
        <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-0">

          {/* ── Step 1 ────────────────────────────────────────────────── */}
          <div className="flex-1 rounded-2xl p-8 flex flex-col gap-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(212,165,32,0.06) 0%, #0F1A2E 100%)',
              border: '1px solid rgba(212,165,32,0.28)',
            }}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary rounded-l-2xl" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-heading font-bold text-lg">
                1
              </div>
              <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">First Step</span>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-foreground mb-2">
                Discover Your Relationship Style
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                A guided experience across 6 emotional dimensions. Understand your patterns,
                needs, and what truly makes you compatible — before looking at anyone else.
              </p>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                'Emotional & communication profile',
                'Values & relationship patterns',
                'Personal insight after every level',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <Link to="/insights">
                <Button className="w-full font-semibold" data-testid="guided-assessment-btn">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Free Assessment
                </Button>
              </Link>
              <p className="text-[11px] text-muted-foreground/50 text-center">
                Start instantly — no signup needed
              </p>
            </div>
          </div>

          {/* ── Flow connector ────────────────────────────────────────── */}
          <div
            aria-hidden="true"
            className="flex-none flex flex-col md:flex-row items-center justify-center
                       py-2 md:py-0 px-0 md:px-5 gap-0"
          >
            <div className="w-px h-6 md:h-px md:w-8
                            bg-gradient-to-b   md:bg-gradient-to-r
                            from-primary/10 to-primary/40" />
            <div className="flex flex-col md:flex-row items-center gap-1 mx-0 my-1 md:my-0 md:mx-1">
              <div className="w-9 h-9 rounded-full
                              bg-card border border-primary/40
                              flex items-center justify-center
                              stage-connector-node">
                <ArrowDown  className="w-4 h-4 text-primary md:hidden" />
                <ArrowRight className="w-4 h-4 text-primary hidden md:flex" />
              </div>
              <span className="text-[10px] font-semibold text-primary/50
                               uppercase tracking-widest
                               md:hidden">
                then
              </span>
            </div>
            <div className="w-px h-6 md:h-px md:w-8
                            bg-gradient-to-b   md:bg-gradient-to-r
                            from-primary/40 to-primary/10" />
          </div>

          {/* ── Step 2 ────────────────────────────────────────────────── */}
          <div className="flex-1 rounded-2xl p-8 flex flex-col gap-5 relative overflow-hidden"
            style={{ background: '#0F1A2E', border: '1px solid rgba(31,42,68,0.9)' }}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-secondary to-primary/50 rounded-l-2xl" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-heading font-bold text-lg">
                2
              </div>
              <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">Then</span>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-foreground mb-2">
                Get Matched Based on Compatibility
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Once you know yourself, find people who are psychologically aligned —
                not just superficially similar. Real compatibility, not chance.
              </p>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                'AI-powered psychological matching',
                'Verified, serious profiles only',
                'Deep compatibility reports available',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <Link to="/register">
                <button className="w-full py-2.5 rounded-xl border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-sm font-semibold transition-all duration-200">
                  Explore Matches →
                </button>
              </Link>
              <p className="text-[11px] text-muted-foreground/50 text-center">
                Create your free profile in minutes
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const LandingPage = () => {

  // ── Scroll-reveal state for self-discovery section ─────────────────────
  const [revealed,   setRevealed]   = useState(new Set());
  const [hoveredSD,  setHoveredSD]  = useState(null);
  const [hoveredSim, setHoveredSim] = useState(null);

  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const key = entry.target.dataset.idx;
            setRevealed(prev => new Set([...prev, key]));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Matching',
      description: 'Intelligent compatibility analysis that goes beyond surface-level filters',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Verified Profiles',
      description: 'KYC-verified members for authentic, trustworthy connections',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Gated Communities',
      description: 'Connect within your professional and cultural circles',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Privacy First',
      description: 'Control photo visibility and personal information with ease',
    },
  ];

  const trustItems = [
    {
      icon:  <CheckCircle2 className="w-5 h-5" />,
      label: 'Verified Members',
      desc:  'Every profile is KYC-verified — no fake or anonymous accounts.',
    },
    {
      icon:  <Brain className="w-5 h-5" />,
      label: 'Psychology-Based Matching',
      desc:  'Compatibility built on personality, values, and relationship style — not just filters.',
    },
    {
      icon:  <Lock className="w-5 h-5" />,
      label: 'Privacy-First Controls',
      desc:  'You decide who sees your photos, contact details, and personal information.',
    },
    {
      icon:  <Shield className="w-5 h-5" />,
      label: 'Moderated Community',
      desc:  'Profiles are reviewed to maintain authenticity and ensure respectful interactions.',
    },
    {
      icon:  <Heart className="w-5 h-5" />,
      label: 'Serious Marriage Intent',
      desc:  'Designed for meaningful long-term relationships — not casual dating.',
    },
    {
      icon:  <Users className="w-5 h-5" />,
      label: 'Gated Communities',
      desc:  'Connect within your professional, cultural, and value-aligned circles.',
    },
  ];

  const radarDimensions = [
    { label: 'Emotional Alignment', value: 92 },
    { label: 'Life Goals', value: 88 },
    { label: 'Communication', value: 78 },
    { label: 'Conflict Resolution', value: 72 },
    { label: 'Family Values', value: 85 },
    { label: 'Intimacy', value: 80 },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ONE primary CTA: "Start Finding Your Life Partner"
          ONE secondary text-link: "Understand Yourself First →"
          No competing equal-weight buttons.
      ════════════════════════════════════════════════════════════════════ */}
      <section className="mandala-bg pt-16 pb-20 px-6 bg-gradient-to-b from-background via-background to-card overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left: Copy */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium tracking-wide">
                <Sparkles className="w-4 h-4" />
                India's First Relationship Intelligence Platform
              </div>

              <h1 className="font-heading leading-tight text-foreground">
                Find a Partner Who{' '}
                <span className="text-gold-gradient">Truly Understands</span>{' '}
                You
              </h1>

              {/* ── Rotating tagline ─────────────────────────────── */}
              <RotatingTagline />

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                India's first AI-powered relationship intelligence platform that matches
                people based on deep psychological compatibility.
              </p>

              {/* Primary CTA — single, unambiguous */}
              <div>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 font-semibold"
                    data-testid="hero-get-started-btn"
                  >
                    Start Finding Your Life Partner
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>

              {/* Secondary text-link — visually subordinate */}
              <Link to="/insights" className="inline-flex items-center gap-2 group">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary/70 hover:text-primary transition-colors"
                  data-testid="hero-insights-link"
                >
                  Understand Yourself First
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>

              {/* Trust signals row */}
              <div className="flex flex-wrap gap-6 pt-2">
                {[
                  { icon: <Brain className="w-4 h-4" />, title: 'Psychology-Based Compatibility', desc: 'Matched on personality, values & relationship style' },
                  { icon: <Shield className="w-4 h-4" />, title: 'Verified Profiles', desc: 'KYC-verified members for authentic connections' },
                  { icon: <Lock className="w-4 h-4" />, title: 'Privacy-First Platform', desc: 'You control who sees your photos & details' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-2 min-w-[140px]">
                    <span className="text-primary shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero image */}
            <div className="relative" style={{ minHeight: '320px', aspectRatio: '4 / 3' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-secondary/15 rounded-3xl blur-2xl mandala-glow-pulse" />
              <img
                src="/hero-mandala.jpg"
                alt="Couple before golden mandala — SoulSathiya"
                className="relative rounded-3xl shadow-2xl shadow-primary/20 w-full h-full object-cover border border-primary/15"
                loading="eager"
              />
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none mandala-ring-pulse"
                style={{ border: '1px solid rgba(212,165,32,0.18)' }}
              />
              {MANDALA_PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="mandala-particle"
                  style={{
                    width:       p.size,
                    height:      p.size,
                    top:         p.top,
                    left:        p.left,
                    '--p-dur':   p.dur,
                    '--p-delay': p.delay,
                    '--p-drift': p.drift,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Motif Bar ───────────────────────────────────────────────── */}
      <div className="py-5 px-6 border-y border-primary/15 bg-card/60">
        <div className="container mx-auto max-w-3xl">
          <p className="text-center font-heading text-sm sm:text-base tracking-[0.35em] uppercase select-none">
            <span className="brand-word" style={{ animationDelay: '0s'   }}>Compatibility</span>
            <span className="text-primary/25">&nbsp;•&nbsp;</span>
            <span className="brand-word" style={{ animationDelay: '-2.4s' }}>Connection</span>
            <span className="text-primary/25">&nbsp;•&nbsp;</span>
            <span className="brand-word" style={{ animationDelay: '-1.2s' }}>Commitment</span>
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — GUIDED JOURNEY
          Bridges self-discovery and matchmaking so users always know
          what their next action is.
      ════════════════════════════════════════════════════════════════════ */}
      <GuidedJourneySection />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — RELATIONSHIP INTELLIGENCE DEEP-DIVE
          Moved high up — the core product differentiator.
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-background relative overflow-hidden" id="relationship-intelligence">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(212,165,32,0.06) 0%, transparent 70%)' }} />

        <div className="container mx-auto max-w-6xl relative">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Zap className="w-4 h-4" />
              New Feature &nbsp;·&nbsp; Start instantly — no signup needed
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              Discover Your{' '}
              <span className="text-primary">Relationship Intelligence</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A guided experience across 6 dimensions of love — completely private,
              start instantly. Get your personalised mini-insight after each level.
            </p>
          </div>

          {/* Two-column: level pills + insight preview card */}
          <div className="grid md:grid-cols-2 gap-10 items-center mb-14">

            {/* Left: 6 level pills */}
            <div className="space-y-3">
              {[
                { level: 1, icon: '❤️', title: 'Emotional Foundation',       q: '18 questions', color: 'rgba(212,165,32,0.15)', border: 'rgba(212,165,32,0.35)' },
                { level: 2, icon: '🌟', title: 'Values & Life Vision',        q: '18 questions', color: 'rgba(184,134,11,0.12)', border: 'rgba(184,134,11,0.3)' },
                { level: 3, icon: '💬', title: 'Communication & Connection',  q: '18 questions', color: 'rgba(201,152,42,0.12)', border: 'rgba(201,152,42,0.3)' },
                { level: 4, icon: '🔄', title: 'Relationship Patterns',       q: '18 questions', color: 'rgba(160,120,10,0.12)', border: 'rgba(160,120,10,0.3)' },
                { level: 5, icon: '☀️', title: 'Daily Life & Lifestyle',      q: '18 questions', color: 'rgba(212,165,32,0.12)', border: 'rgba(212,165,32,0.28)' },
                { level: 6, icon: '🚀', title: 'Growth & Future',             q: '18 questions', color: 'rgba(184,134,11,0.12)', border: 'rgba(184,134,11,0.28)' },
              ].map((s) => (
                <div
                  key={s.level}
                  className="flex items-center gap-4 rounded-xl px-5 py-3.5 transition-all duration-200 cursor-default hover:-translate-x-1"
                  style={{ background: s.color, border: `1px solid ${s.border}` }}
                >
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground leading-tight">{s.title}</div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono flex-shrink-0">{s.q}</div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(212,165,32,0.15)', color: 'var(--primary)', border: '1px solid rgba(212,165,32,0.3)' }}
                  >
                    {s.level}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Sample insight card */}
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ background: '#0F1A2E', border: '1px solid rgba(212,165,32,0.25)', boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(212,165,32,0.06)' }}
            >
              <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #D4A520, transparent)' }} />

              <div className="p-7">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">💛</span>
                  <div>
                    <div className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-0.5">Level 1 Complete ✅</div>
                    <div className="text-xs text-muted-foreground">Emotional Foundation</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-2xl font-bold text-primary font-heading">78</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>

                <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Emotionally Secure
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">
                  "You demonstrate strong emotional self-awareness. Your ability to identify
                  and hold your emotions means you bring a rich inner presence to relationships.
                  Partners naturally feel seen and safe with you."
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div className="text-xs font-bold text-emerald-400 mb-1.5">✦ STRENGTH</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">Emotionally available without losing yourself</div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(212,165,32,0.06)', border: '1px solid rgba(212,165,32,0.18)' }}>
                    <div className="text-xs font-bold text-primary mb-1.5">✦ GROWTH</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">Holding space for different emotional worlds</div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(212,165,32,0.08)', border: '1px solid rgba(212,165,32,0.18)' }}>
                    <Zap className="w-3 h-3" fill="currentColor" />
                    +180 XP earned · Level 2 unlocked
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA row */}
          <div className="text-center space-y-4">

            {/* Universal audience label */}
            <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest">
              For Individuals &amp; Couples
            </p>

            <Link to="/insights">
              <Button
                size="lg"
                className="px-10 shadow-xl shadow-primary/25 font-bold text-base hover:scale-[1.02] transition-transform"
                data-testid="insights-cta-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Build Your Relationship Intelligence Report
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            {/* Supporting microcopy — lifecycle-agnostic, universal tone */}
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Gain deep insight into how you connect, communicate, and build lasting relationships.
            </p>

            <div className="flex items-center justify-center gap-6 flex-wrap">
              {[
                '✓ Start instantly — no signup needed',
                '✓ Takes ~25 minutes',
                '✓ Full report ₹999 (optional)',
              ].map(t => (
                <span key={t} className="text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — SAMPLE INSIGHTS (show, don't tell)
          Show compelling output BEFORE explaining the process.
          Moved above "How It Works" for higher emotional impact.
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-card/40" id="compatibility-preview">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Deep Compatibility Intelligence
            </div>
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              What Your <span className="text-primary">Compatibility Report</span> Reveals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A sample of the depth and clarity our compatibility intelligence delivers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-stretch">

            {/* ── Left: Radar chart card ─────────────────────────────── */}
            <div className="card-surface rounded-2xl overflow-hidden w-full flex flex-col">
              <div className="relative px-8 pt-8 pb-6 text-center"
                style={{
                  background: 'linear-gradient(160deg, rgba(212,165,32,0.12) 0%, rgba(20,31,53,0) 60%)',
                  borderBottom: '1px solid rgba(212,165,32,0.10)',
                }}>
                <p className="text-xs font-semibold text-primary/60 uppercase tracking-[0.25em] mb-4">
                  Sample Compatibility
                </p>
                <div
                  className="text-8xl font-heading font-bold text-primary leading-none mb-2"
                  style={{ textShadow: '0 0 48px rgba(212,165,32,0.45), 0 0 16px rgba(212,165,32,0.25)' }}
                >
                  89%
                </div>
                <p className="text-base font-semibold text-primary/90 tracking-wide mb-3">
                  Strong Match &nbsp;✦
                </p>
                <p className="text-sm text-muted-foreground/80 italic leading-relaxed max-w-xs mx-auto">
                  {getOverallInsight(89)}
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center px-4 py-8"
                style={{ background: 'radial-gradient(ellipse at center, rgba(212,165,32,0.05) 0%, transparent 70%)' }}>
                <RadarChart dimensions={radarDimensions} size={400} showLabels={true} />
              </div>
            </div>

            {/* ── Right: Structured insights ────────────────────────────── */}
            <div className="flex flex-col">
              <div className="card-surface p-6 rounded-2xl flex-1">
                <h3 className="font-heading text-2xl text-foreground mb-4">
                  Sample Compatibility Insights
                </h3>

                <div className="space-y-1">
                  {[
                    { label: 'Emotional Alignment',  value: 92, status: 'strong', insight: 'You both naturally express emotions openly, creating strong emotional safety.' },
                    { label: 'Life Goals',            value: 88, status: 'strong', insight: 'Your long-term visions for life, career, and family closely align.' },
                    { label: 'Communication',         value: 78, status: 'strong', insight: 'Your communication styles complement each other naturally and intuitively.' },
                    { label: 'Conflict Resolution',   value: 72, status: 'growth', insight: 'Both of you tend toward calm resolution, rarely letting tension escalate.' },
                    { label: 'Family Values',         value: 85, status: 'strong', insight: 'Shared vision for family life makes long-term planning feel effortless.' },
                    { label: 'Intimacy',              value: 79, status: 'strong', insight: 'Compatible rhythms and lifestyle choices build natural closeness over time.' },
                  ].map((item, i) => (
                    <div key={i} className="border-b border-primary/8 last:border-0 py-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {item.status === 'strong'
                            ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            : <span className="text-amber-400/80 text-xs flex-shrink-0">▲</span>
                          }
                          <span className="text-sm text-foreground font-semibold">{item.label}</span>
                        </div>
                        <span className={`text-sm font-bold ${item.status === 'strong' ? 'text-primary' : 'text-amber-400/80'}`}>
                          {item.value}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.value}%`,
                            background: item.status === 'strong'
                              ? 'linear-gradient(90deg, #b8860b 0%, #D4AF37 60%, #f5d060 100%)'
                              : 'linear-gradient(90deg, #7c4f1a 0%, #b87333 100%)',
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{item.insight}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-primary/10 pt-4">
                  <div className="bg-primary/8 border border-primary/15 rounded-lg p-3">
                    <p className="text-xs font-semibold text-primary mb-1">✦ Strong Alignment</p>
                    <p className="text-xs text-muted-foreground">Emotional · Life Goals · Values</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-400/80 mb-1">▲ Growth Area</p>
                    <p className="text-xs text-muted-foreground">Conflict Style — explore together</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link to="/deep/demo-report">
                  <Button variant="outline" className="border-primary/40 hover:bg-primary/10 hover:border-primary" data-testid="view-sample-report-btn">
                    <Sparkles className="w-4 h-4 mr-2" />
                    View Full Sample Report
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — HOW IT WORKS (moved below sample insights)
          Now users understand WHY they should care before learning HOW.
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-background" id="how-it-works">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              How SoulSathiya Works
            </div>
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              Relationship <span className="text-primary">Intelligence Reports</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compatibility insights are delivered in two meaningful stages, giving you a
              complete picture of your relationship potential.
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-0">

            {/* ── Stage 1 ───────────────────────────────────────────────── */}
            <div className="flex-1 card-surface p-8 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary rounded-l-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-heading font-bold text-lg">
                  1
                </div>
                <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">Stage One</span>
              </div>
              <h3 className="font-heading text-2xl text-foreground">
                Psychological Compatibility Analysis
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Build your compatibility profile and let our intelligence engine understand
                your personality, values, and relationship style. Used to intelligently
                match you with people who are truly aligned with who you are.
              </p>
              <ul className="space-y-2">
                {['Personality & values alignment', 'Communication and emotional style', 'Life goals and vision', 'Relationship expectations'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Powers your intelligent matches
              </div>
            </div>

            {/* ── Flow connector ────────────────────────────────────────── */}
            <div
              aria-hidden="true"
              className="flex-none flex flex-col md:flex-row items-center justify-center
                         py-2 md:py-0 px-0 md:px-5 gap-0"
            >
              <div className="w-px h-6 md:h-px md:w-8
                              bg-gradient-to-b   md:bg-gradient-to-r
                              from-primary/10 to-primary/40" />
              <div className="flex flex-col md:flex-row items-center gap-1 mx-0 my-1 md:my-0 md:mx-1">
                <div className="w-9 h-9 rounded-full
                                bg-card border border-primary/40
                                flex items-center justify-center
                                stage-connector-node">
                  <ArrowDown  className="w-4 h-4 text-primary md:hidden" />
                  <ArrowRight className="w-4 h-4 text-primary hidden md:flex" />
                </div>
                <span className="text-[10px] font-semibold text-primary/50
                                 uppercase tracking-widest
                                 md:hidden">
                  then
                </span>
              </div>
              <div className="w-px h-6 md:h-px md:w-8
                              bg-gradient-to-b   md:bg-gradient-to-r
                              from-primary/40 to-primary/10" />
            </div>

            {/* ── Stage 2 ───────────────────────────────────────────────── */}
            <div className="flex-1 card-surface p-8 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-secondary to-primary/50 rounded-l-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-heading font-bold text-lg">
                  2
                </div>
                <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">Stage Two</span>
              </div>
              <h3 className="font-heading text-2xl text-foreground">
                Deep Compatibility Report
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                When you and a match want to explore deeper, unlock a comprehensive
                compatibility report. Reveals how you align across the full spectrum
                of a real relationship.
              </p>
              <ul className="space-y-2">
                {['Conflict resolution compatibility', 'Attachment and trust patterns', 'Intimacy and communication analysis', 'Family and lifestyle integration'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                <Brain className="w-4 h-4" />
                Available as a mutual exploration
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — PLATFORM FEATURES
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Platform Advantages
            </div>
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              Why Choose <span className="text-primary">SoulSathiya</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We go beyond surface-level matches to find truly compatible partners
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-surface feature-card p-6 space-y-4 text-center"
                data-testid={`feature-card-${index}`}
              >
                <div className="feature-icon w-12 h-12 mx-auto bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — TRUST & SAFETY
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-card/40" id="trust-safety">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Lock className="w-4 h-4" />
              Verified &amp; Secure
            </div>
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              Built on <span className="text-primary">Trust &amp; Safety</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A secure, serious platform for people who are ready for a meaningful commitment
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {trustItems.map((item, i) => (
              <div key={i} className="card-surface feature-card p-6 flex items-start gap-4">
                <div className="feature-icon w-11 h-11 shrink-0 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-heading text-base text-foreground leading-snug mb-1">
                    {item.label}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 8 — LOVE STORY / MATCHMAKING VALUE
          Aspiration — show what the end goal looks like.
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-background" id="testimonials">
        <div className="container mx-auto max-w-6xl">

          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Your Journey Starts Here
            </div>
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              Write Your Own <span className="text-primary">Love Story</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
              Powered by SoulSathiya's world-class relationship compatibility intelligence.
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto">
              Thousands search for partners. Few understand compatibility. SoulSathiya helps you discover the difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                photo:   '/wedding-kerala.jpg',
                title:   'Discover Deep Compatibility',
                body:    'Go beyond biodata and surface traits. SoulSathiya analyses emotional alignment, life goals, communication styles, and deeper relationship patterns to reveal true compatibility.',
              },
              {
                photo:   '/wedding-north-indian.jpg',
                title:   'Understand Relationship Dynamics',
                body:    'Every couple has patterns — how they communicate, resolve conflict, and build intimacy. Our compatibility intelligence helps you understand these dynamics before commitment.',
              },
              {
                photo:   '/wedding-couple.jpg',
                title:   'Build Relationships That Last',
                body:    'Compatibility isn\'t luck. It\'s the alignment of values, emotional rhythms, and life direction. SoulSathiya helps you discover partners with the foundation for lasting relationships.',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="card-surface feature-card rounded-2xl overflow-hidden group"
                data-testid={`story-card-${i}`}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                  <img
                    src={card.photo}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(12,19,35,0.80) 0%, rgba(12,19,35,0.35) 55%, rgba(12,19,35,0.15) 100%)' }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                    <span
                      className="inline-block text-xs font-semibold text-white/90 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                      style={{ background: 'rgba(12,19,35,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      Your Story Could Begin Here
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-heading text-base font-bold text-foreground mb-2">
                    {card.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
              Begin Your Compatibility Journey
            </h3>
            <Link to="/register">
              <Button size="lg" className="px-8">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Finding Matches
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* ── Self-Discovery + Compatibility Simulator ──────────────────────── */}
      <section className="py-20 px-6 bg-card/30" id="self-discovery">
        <div className="container mx-auto max-w-6xl space-y-12">

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              Psychology-Driven Matching
            </div>
            <h2 className="font-heading text-4xl mb-4 text-foreground leading-tight">
              Imagine Your Future Relationship —{' '}
              <span className="text-primary">And Understand Yourself First</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how your patterns shape the partner you truly connect with.
            </p>
          </div>

          {/* ── Part 1: Self Discovery ─────────────────────────────────────── */}
          <div>
            <h3 className="font-heading text-2xl text-foreground text-center mb-8">
              What Kind of Partner Are You?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Emotional Style',      traits: ['Empathetic',       'Vulnerability-open'],  impact: 'You create safety'         },
                { title: 'Communication',         traits: ['Direct',           'Active listener'],     impact: 'Effortless conversations'  },
                { title: 'Conflict Response',     traits: ['Calm under pressure', 'Resolution-first'], impact: 'Conflict becomes clarity'  },
                { title: 'Life Direction',        traits: ['Purpose-driven',   'Growth-focused'],      impact: 'Attracts aligned partners' },
                { title: 'Family Values',         traits: ['Tradition-grounded','Togetherness first'], impact: 'Built to last'             },
                { title: 'Intimacy Pattern',      traits: ['Emotionally led',  'Needs closeness'],     impact: 'Bonds run deep'            },
              ].map((card, i) => {
                const key       = `sd-${i}`;
                const isRevealed = revealed.has(key);
                const isHovered  = hoveredSD === i;
                const isDimmed   = hoveredSD !== null && hoveredSD !== i;
                return (
                  <div
                    key={i}
                    data-reveal="true"
                    data-idx={key}
                    onMouseEnter={() => setHoveredSD(i)}
                    onMouseLeave={() => setHoveredSD(null)}
                    style={{
                      background:    isHovered
                        ? 'linear-gradient(135deg, #142038 0%, #0F1A2E 100%)'
                        : '#0F1A2E',
                      border:        `1px solid ${isHovered ? 'rgba(212,175,55,0.45)' : 'rgba(31,42,68,0.9)'}`,
                      borderLeft:    `3px solid ${isHovered ? '#D4AF37' : 'rgba(212,175,55,0.25)'}`,
                      borderRadius:  '1rem',
                      padding:       '1.5rem',
                      opacity:       isRevealed ? (isDimmed ? 0.4 : 1) : 0,
                      transform:     isRevealed ? (isHovered ? 'translateY(-5px)' : 'none') : 'translateY(24px)',
                      boxShadow:     isHovered ? '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08)' : 'none',
                      transition:    `opacity 0.5s ${i * 100}ms, transform 0.5s ${i * 100}ms, box-shadow 0.3s, border-color 0.3s, background 0.3s`,
                      cursor:        'default',
                    }}
                  >
                    <h4 style={{
                      fontWeight:    700,
                      fontSize:      '1rem',
                      color:         '#D4AF37',
                      marginBottom:  '0.75rem',
                      letterSpacing: '0.01em',
                    }}>
                      {card.title}
                    </h4>
                    <ul style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {card.traits.map((t, ti) => (
                        <li key={ti} style={{
                          fontSize:     '0.85rem',
                          color:        'rgba(255,255,255,0.75)',
                          background:   'rgba(255,255,255,0.05)',
                          border:       '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '999px',
                          padding:      '0.2rem 0.75rem',
                        }}>
                          {t}
                        </li>
                      ))}
                    </ul>
                    <p style={{
                      fontSize:   '0.875rem',
                      fontStyle:  'italic',
                      color:      '#D4AF37',
                      opacity:    isHovered ? 1 : 0,
                      transition: 'opacity 0.3s',
                      borderTop:  '1px solid rgba(212,175,55,0.15)',
                      paddingTop: '0.75rem',
                      minHeight:  '1.6rem',
                    }}>
                      ✨ {card.impact}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Transition divider ─────────────────────────────────────────── */}
          <div
            data-reveal="true"
            data-idx="divider"
            style={{
              opacity:    revealed.has('divider') ? 1 : 0,
              transform:  revealed.has('divider') ? 'none' : 'translateY(12px)',
              transition: 'opacity 0.8s, transform 0.8s',
            }}
          >
            <div className="flex items-center gap-4 max-w-lg mx-auto">
              <div className="flex-1 h-px bg-primary/20" />
              <p className="text-base text-muted-foreground/70 italic whitespace-nowrap">
                "Now imagine when the right patterns align…"
              </p>
              <div className="flex-1 h-px bg-primary/20" />
            </div>
          </div>

          {/* ── Part 2: Compatibility Simulator ───────────────────────────── */}
          <div>
            <h3 className="font-heading text-2xl text-foreground text-center mb-8">
              Imagine the Intelligence of Your Future Relationship
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { emoji: '❤️', title: 'Emotional Alignment', points: ['Conversations feel natural', 'Vulnerability feels safe'],  impact: 'Deep trust, always'        },
                { emoji: '🎯', title: 'Life Goals',           points: ['Decisions become easier',  'Future feels shared'],         impact: 'Less friction, more flow'  },
                { emoji: '⚖️', title: 'Conflict Styles',      points: ['Both partners feel heard', 'Arguments resolve faster'],    impact: 'Conflict becomes growth'   },
              ].map((card, i) => {
                const key        = `sim-${i}`;
                const isRevealed  = revealed.has(key);
                const isHovered   = hoveredSim === i;
                const isDimmed    = hoveredSim !== null && hoveredSim !== i;
                return (
                  <div
                    key={i}
                    data-reveal="true"
                    data-idx={key}
                    onMouseEnter={() => setHoveredSim(i)}
                    onMouseLeave={() => setHoveredSim(null)}
                    style={{
                      background:    isHovered
                        ? 'linear-gradient(135deg, #142038 0%, #0F1A2E 100%)'
                        : '#0F1A2E',
                      border:        `1px solid ${isHovered ? 'rgba(212,175,55,0.45)' : 'rgba(31,42,68,0.9)'}`,
                      borderRadius:  '1rem',
                      padding:       '2rem',
                      display:       'flex',
                      flexDirection: 'column',
                      gap:           '1.25rem',
                      opacity:       isRevealed ? (isDimmed ? 0.4 : 1) : 0,
                      transform:     isRevealed ? (isHovered ? 'translateY(-5px)' : 'none') : 'translateY(24px)',
                      boxShadow:     isHovered ? '0 24px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.1)' : 'none',
                      transition:    `opacity 0.5s ${i * 120}ms, transform 0.5s ${i * 120}ms, box-shadow 0.3s, border-color 0.3s, background 0.3s`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{
                        fontSize:   '2rem',
                        lineHeight:  1,
                        filter:      isHovered ? 'drop-shadow(0 0 8px rgba(212,175,55,0.4))' : 'none',
                        transition:  'filter 0.3s',
                      }}>
                        {card.emoji}
                      </span>
                      <h4 className="font-heading" style={{
                        fontWeight:  700,
                        fontSize:    '1.15rem',
                        color:       'var(--foreground)',
                        lineHeight:  1.2,
                      }}>
                        {card.title}
                      </h4>
                    </div>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      {card.points.map((pt, pi) => (
                        <li key={pi} style={{
                          display:    'flex',
                          alignItems: 'center',
                          gap:        '0.65rem',
                          fontSize:   '0.95rem',
                          color:      'rgba(255,255,255,0.75)',
                        }}>
                          <span style={{
                            width:        '6px',
                            height:       '6px',
                            borderRadius: '50%',
                            background:   '#D4AF37',
                            flexShrink:   0,
                            boxShadow:    '0 0 6px rgba(212,175,55,0.5)',
                          }} />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <div style={{
                      fontSize:     '0.875rem',
                      fontWeight:   600,
                      fontStyle:    'italic',
                      color:        '#D4AF37',
                      background:   'rgba(212,175,55,0.08)',
                      border:       '1px solid rgba(212,175,55,0.2)',
                      borderRadius: '0.625rem',
                      padding:      '0.6rem 1rem',
                      textAlign:    'center',
                      opacity:      isHovered ? 1 : 0.75,
                      transition:   'opacity 0.3s',
                    }}>
                      ✨ {card.impact}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
              Discover Your Compatibility Intelligence
            </h3>
            <Link to="/register">
              <Button
                size="lg"
                className="px-8 hover:scale-105 transition-all duration-300"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Finding Matches
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground/50 mt-3">
              Takes less than 3 minutes &nbsp;•&nbsp; No commitment required
            </p>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 10 — PRICING (last)
          Users now understand the product fully before seeing pricing.
          Header renamed from "Choose Your Journey" → "Upgrade Your Experience"
      ════════════════════════════════════════════════════════════════════ */}
      <PricingSection />

      {/* ── CTA Section ───────────────────────────────────────────────────── */}
      <section className="mandala-bg py-20 px-6 bg-card border-t border-primary/10">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <div className="flex items-center justify-center mb-2">
            <SoulSathiyaLogo className="w-20 h-20" />
          </div>
          <h2 className="font-heading text-4xl text-foreground leading-snug">
            Your Life Partner May Be{' '}
            <span className="text-gold-gradient">One Compatibility Match</span>{' '}
            Away.
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of Indians who are finding their life partners through deep compatibility intelligence
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 font-semibold mt-2"
              data-testid="cta-register-btn"
            >
              Start Finding Matches
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Brand Motif Bar (pre-footer) ──────────────────────────────────── */}
      <div className="py-5 px-6 bg-primary/5 border-t border-primary/15">
        <p className="text-center font-heading text-sm sm:text-base tracking-[0.35em] text-primary/70 uppercase select-none">
          Compatibility &nbsp;•&nbsp; Connection &nbsp;•&nbsp; Commitment
        </p>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
};

export default LandingPage;
