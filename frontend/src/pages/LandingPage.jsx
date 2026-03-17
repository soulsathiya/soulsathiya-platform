import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Sparkles, Check, ArrowRight, ArrowDown, Brain,
  CheckCircle2, Heart, Lock, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import RadarChart from '../components/RadarChart';
import RotatingTagline from '../components/RotatingTagline';
import { getDimensionInsight, getOverallInsight } from '../utils/compatibilityInsights';

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
// Each particle: position within image bounds, size, animation duration + delay,
// horizontal drift direction. Kept to 10 items to stay lightweight.
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

  const subscriptionPlans = [
    {
      tier: 'Free',
      price: '₹0',
      features: [
        'Create compatibility profile',
        'View up to 10 matches',
        'Send 3 interests per month',
        'Basic compatibility filters',
      ],
    },
    {
      tier: 'Premium',
      price: '₹1,999',
      period: '/ month',
      popular: true,
      features: [
        'Unlimited profile views',
        'Unlimited interests',
        'Advanced compatibility filters',
        'See who viewed your profile',
        'Priority customer support',
        'Deep Compatibility Report (₹999/pair add-on)',
      ],
    },
    {
      tier: 'Elite',
      price: '₹4,999',
      period: '/ month',
      features: [
        'All Premium features',
        'Profile boost',
        'Dedicated relationship manager',
        'Verified badge priority',
        'Exclusive events access',
        'Unlimited Deep Compatibility Reports',
      ],
      badge: 'Most Comprehensive',
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

      {/* ── Fixed Header ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-primary">
            <SoulSathiyaLogo className="w-9 h-9" />
            <span className="text-2xl font-heading font-bold text-foreground">
              Soul<span className="text-primary">Sathiya</span>
            </span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground" data-testid="header-login-btn">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 text-sm sm:text-base px-3 sm:px-4" data-testid="header-register-btn">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="mandala-bg pt-32 pb-20 px-6 bg-gradient-to-b from-background via-background to-card overflow-hidden">
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

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 font-semibold"
                    data-testid="hero-get-started-btn"
                  >
                    Build Your Compatibility Profile
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-primary/40 text-foreground hover:bg-primary/10 hover:border-primary"
                    data-testid="hero-login-btn"
                  >
                    Browse Verified Profiles
                  </Button>
                </Link>
              </div>

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

            {/* Right: Hero image — animated mandala effect */}
            <div className="relative" style={{ minHeight: '320px', aspectRatio: '4 / 3' }}>

              {/* Animated golden glow backdrop (slow breathing pulse) */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-secondary/15 rounded-3xl blur-2xl mandala-glow-pulse" />

              {/* Main image */}
              <img
                src="/hero-mandala.jpg"
                alt="Couple before golden mandala — SoulSathiya"
                className="relative rounded-3xl shadow-2xl shadow-primary/20 w-full h-full object-cover border border-primary/15"
                loading="eager"
              />

              {/* Pulsing golden ring overlay — sits on top of image, non-blocking */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none mandala-ring-pulse"
                style={{ border: '1px solid rgba(212,165,32,0.18)' }}
              />

              {/* Floating particle orbs rising from the mandala */}
              {MANDALA_PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="mandala-particle"
                  style={{
                    width:        p.size,
                    height:       p.size,
                    top:          p.top,
                    left:         p.left,
                    '--p-dur':    p.dur,
                    '--p-delay':  p.delay,
                    '--p-drift':  p.drift,
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
          {/*
           * Each word uses the shared .brand-word keyframe (3.6 s cycle).
           * Negative delays kick every word into its correct phase at page load
           * so the sequence starts immediately with no blank pause.
           *   Word 1:  delay  0s   → lit  0.0–1.2 s
           *   Word 2:  delay -2.4s → lit  1.2–2.4 s
           *   Word 3:  delay -1.2s → lit  2.4–3.6 s
           */}
          <p className="text-center font-heading text-sm sm:text-base tracking-[0.35em] uppercase select-none">
            <span className="brand-word" style={{ animationDelay: '0s'   }}>Compatibility</span>
            <span className="text-primary/25">&nbsp;•&nbsp;</span>
            <span className="brand-word" style={{ animationDelay: '-2.4s' }}>Connection</span>
            <span className="text-primary/25">&nbsp;•&nbsp;</span>
            <span className="brand-word" style={{ animationDelay: '-1.2s' }}>Commitment</span>
          </p>
        </div>
      </div>

      {/* ── How It Works — Relationship Intelligence ───────────────────── */}
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

          {/*
           * Layout: flex-col on mobile (cards stacked), flex-row on desktop.
           * The middle slot holds the Stage 1 → Stage 2 flow connector.
           */}
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
            {/*
             * Mobile  (flex-col parent): renders as a vertical connector
             *   — line top → pulsing node → arrow down → line bottom
             * Desktop (flex-row parent): renders as a horizontal connector
             *   — line left → pulsing node → arrow right → line right
             * The connector is purely presentational (aria-hidden).
             */}
            <div
              aria-hidden="true"
              className="flex-none flex flex-col md:flex-row items-center justify-center
                         py-2 md:py-0 px-0 md:px-5 gap-0"
            >
              {/* Top line (mobile) / Left line (desktop) */}
              <div className="w-px h-6 md:h-px md:w-8
                              bg-gradient-to-b   md:bg-gradient-to-r
                              from-primary/10 to-primary/40" />

              {/* Central node — glowing gold circle */}
              <div className="flex flex-col md:flex-row items-center gap-1 mx-0 my-1 md:my-0 md:mx-1">
                <div className="w-9 h-9 rounded-full
                                bg-card border border-primary/40
                                flex items-center justify-center
                                stage-connector-node">
                  {/* Arrow icon: down on mobile, right on desktop */}
                  <ArrowDown  className="w-4 h-4 text-primary md:hidden" />
                  <ArrowRight className="w-4 h-4 text-primary hidden md:flex" />
                </div>
                {/* Label */}
                <span className="text-[10px] font-semibold text-primary/50
                                 uppercase tracking-widest
                                 md:hidden">
                  then
                </span>
              </div>

              {/* Bottom line (mobile) / Right line (desktop) */}
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

      {/* ── Compatibility Insights Preview ─────────────────────────────── */}
      <section className="py-20 px-6 bg-card/40" id="compatibility-preview">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
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

              {/* ── Score hero header ──────────────────────────────────── */}
              <div className="relative px-8 pt-8 pb-6 text-center"
                style={{
                  background: 'linear-gradient(160deg, rgba(212,165,32,0.12) 0%, rgba(20,31,53,0) 60%)',
                  borderBottom: '1px solid rgba(212,165,32,0.10)',
                }}>
                <p className="text-xs font-semibold text-primary/60 uppercase tracking-[0.25em] mb-4">
                  Sample Compatibility
                </p>

                {/* Big score */}
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

              {/* ── Radar chart — vertex labels enabled ────────────────── */}
              <div className="flex-1 flex items-center justify-center px-4 py-8"
                style={{ background: 'radial-gradient(ellipse at center, rgba(212,165,32,0.05) 0%, transparent 70%)' }}>
                <RadarChart dimensions={radarDimensions} size={400} showLabels={true} />
              </div>

            </div>

            {/* ── Right: Structured insights ────────────────────────────── */}
            <div className="flex flex-col">
              <div className="card-surface p-6 rounded-2xl flex-1">
                <h3 className="font-heading text-xl text-foreground mb-4">
                  Sample Compatibility Insights
                </h3>

                {/*
                 * Each row: score bar + 3 human-readable lines
                 *   Insight    — what the score reveals
                 *   Means      — practical day-to-day implication
                 *   Why        — why this dimension matters in a marriage
                 */}
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

                      {/* Label + score row */}
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

                      {/* h-2 gold gradient progress bar */}
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

                      {/* Single-line insight */}
                      <p className="text-xs text-muted-foreground leading-snug">{item.insight}</p>
                    </div>
                  ))}
                </div>

                {/* Summary footer */}
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

      {/* ── Features Section ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
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
                {/* Icon wrapper — glows on parent card hover via .feature-card:hover .feature-icon */}
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

      {/* ── Trust & Safety Section ────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-card/40" id="trust-safety">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl mb-4 text-foreground">
              Built on <span className="text-primary">Trust & Safety</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A secure, serious platform for people who are ready for a meaningful commitment
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {trustItems.map((item, i) => (
              <div
                key={i}
                className="card-surface feature-card p-6 flex items-start gap-4"
              >
                {/* Icon — circular, left-aligned for scan-friendly layout */}
                <div className="feature-icon w-11 h-11 shrink-0 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary mt-0.5">
                  {item.icon}
                </div>

                {/* Text block */}
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

      {/* ── Love Story / Aspirational Feature Section ─────────────────────── */}
      <section className="py-20 px-6 bg-background" id="testimonials">
        <div className="container mx-auto max-w-6xl">

          {/* Section header */}
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

          {/* 3 feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                photo:   'https://images.pexels.com/photos/10987899/pexels-photo-10987899.jpeg?auto=compress&cs=tinysrgb&w=800&h=700&fit=crop',
                title:   'Discover Deep Compatibility',
                body:    'Go beyond biodata and surface traits. SoulSathiya analyses emotional alignment, life goals, communication styles, and deeper relationship patterns to reveal true compatibility.',
              },
              {
                photo:   'https://images.pexels.com/photos/32161001/pexels-photo-32161001.jpeg?auto=compress&cs=tinysrgb&w=800&h=700&fit=crop',
                title:   'Understand Relationship Dynamics',
                body:    'Every couple has patterns — how they communicate, resolve conflict, and build intimacy. Our compatibility intelligence helps you understand these dynamics before commitment.',
              },
              {
                photo:   'https://images.pexels.com/photos/36079282/pexels-photo-36079282.jpeg?auto=compress&cs=tinysrgb&w=800&h=700&fit=crop',
                title:   'Build Relationships That Last',
                body:    'Compatibility isn\'t luck. It\'s the alignment of values, emotional rhythms, and life direction. SoulSathiya helps you discover partners with the foundation for lasting relationships.',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="card-surface feature-card rounded-2xl overflow-hidden group"
                data-testid={`story-card-${i}`}
              >
                {/* Photo with overlay */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                  <img
                    src={card.photo}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Dark gradient over full image */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(12,19,35,0.80) 0%, rgba(12,19,35,0.35) 55%, rgba(12,19,35,0.15) 100%)' }}
                  />

                  {/* "Your Story Could Begin Here" overlay — bottom of image */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                    <span
                      className="inline-block text-xs font-semibold text-white/90 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                      style={{ background: 'rgba(12,19,35,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      Your Story Could Begin Here
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
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

          {/* CTA below */}
          <div className="text-center mt-14">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
              Begin Your Compatibility Journey
            </h3>
            <Link to="/register">
              <Button size="lg" className="px-8">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Your Compatibility Profile
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* ── Self-Discovery + Compatibility Simulator ──────────────────────── */}
      <section className="py-20 px-6 bg-card/30" id="self-discovery">
        <div className="container mx-auto max-w-6xl space-y-12">

          {/* Section header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              Psychology-Driven Matching
            </div>
            <h2 className="font-heading text-3xl md:text-4xl mb-4 text-foreground leading-tight">
              Imagine Your Future Relationship —{' '}
              <span className="text-primary">And Understand Yourself First</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how your patterns shape the partner you truly connect with.
            </p>
          </div>

          {/* ── Part 1: Self Discovery ─────────────────────────────────────── */}
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground text-center mb-8">
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
                      background:    '#0F1A2E',
                      border:        `1px solid ${isHovered ? 'rgba(212,175,55,0.35)' : '#1f2a44'}`,
                      borderRadius:  '0.75rem',
                      padding:       '1rem',
                      opacity:       isRevealed ? (isDimmed ? 0.45 : 1) : 0,
                      transform:     isRevealed ? (isHovered ? 'translateY(-4px)' : 'none') : 'translateY(24px)',
                      boxShadow:     isHovered ? '0 16px 36px rgba(0,0,0,0.45)' : 'none',
                      transition:    `opacity 0.5s ${i * 100}ms, transform 0.5s ${i * 100}ms, box-shadow 0.3s, border-color 0.3s`,
                      cursor:        'default',
                    }}
                  >
                    <h4 style={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '0.6rem' }}>
                      {card.title}
                    </h4>
                    <ul style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {card.traits.map((t, ti) => (
                        <li key={ti} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {ti > 0 && <span style={{ color: 'rgba(212,175,55,0.4)' }}>•</span>}
                          {t}
                        </li>
                      ))}
                    </ul>
                    {/* Insight — reveals on hover */}
                    <p style={{
                      fontSize:   '0.72rem',
                      fontStyle:  'italic',
                      color:      '#D4AF37',
                      opacity:    isHovered ? 1 : 0,
                      transition: 'opacity 0.3s',
                      borderTop:  '1px solid rgba(212,175,55,0.12)',
                      paddingTop: '0.6rem',
                      minHeight:  '1.4rem',
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
              <p className="text-sm text-muted-foreground/60 italic whitespace-nowrap">
                "Now imagine when the right patterns align…"
              </p>
              <div className="flex-1 h-px bg-primary/20" />
            </div>
          </div>

          {/* ── Part 2: Compatibility Simulator ───────────────────────────── */}
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground text-center mb-8">
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
                      background:   '#0F1A2E',
                      border:       `1px solid ${isHovered ? 'rgba(212,175,55,0.35)' : '#1f2a44'}`,
                      borderRadius: '0.75rem',
                      padding:      '1.5rem',
                      display:      'flex',
                      flexDirection:'column',
                      gap:          '1rem',
                      opacity:      isRevealed ? (isDimmed ? 0.45 : 1) : 0,
                      transform:    isRevealed ? (isHovered ? 'translateY(-4px)' : 'none') : 'translateY(24px)',
                      boxShadow:    isHovered ? '0 20px 44px rgba(0,0,0,0.5)' : 'none',
                      transition:   `opacity 0.5s ${i * 120}ms, transform 0.5s ${i * 120}ms, box-shadow 0.3s, border-color 0.3s`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{card.emoji}</span>
                      <h4 className="font-heading" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                        {card.title}
                      </h4>
                    </div>

                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                      {card.points.map((pt, pi) => (
                        <li key={pi} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
                          <span style={{ color: '#D4AF37', fontSize: '0.75rem', marginTop: '0.15rem', flexShrink: 0 }}>{card.emoji}</span>
                          {pt}
                        </li>
                      ))}
                    </ul>

                    {/* Insight badge */}
                    <div style={{
                      fontSize:        '0.72rem',
                      fontWeight:      600,
                      color:           '#D4AF37',
                      background:      'rgba(212,175,55,0.07)',
                      border:          '1px solid rgba(212,175,55,0.18)',
                      borderRadius:    '0.5rem',
                      padding:         '0.45rem 0.75rem',
                      textAlign:       'center',
                      opacity:         isHovered ? 1 : 0.7,
                      transition:      'opacity 0.3s',
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
                className="px-8"
                style={{ transition: 'transform 0.3s, box-shadow 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Your Compatibility Profile
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground/50 mt-3">
              Takes less than 3 minutes &nbsp;•&nbsp; No commitment required
            </p>
          </div>

        </div>
      </section>

      {/* ── Pricing Section ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-card/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl mb-4 text-foreground">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade when you're ready to accelerate your journey
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan, index) => (
              <div
                key={index}
                className={`card-surface p-8 space-y-6 relative rounded-2xl ${
                  plan.popular ? 'ring-1 ring-primary shadow-xl shadow-primary/10 md:scale-105' : ''
                }`}
                data-testid={`pricing-card-${plan.tier.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-lg shadow-primary/30">
                    Most Popular
                  </div>
                )}
                {plan.badge && (
                  <div className="absolute -top-4 right-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <h3 className="font-heading text-2xl mb-2 text-foreground">{plan.tier}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start space-x-2 text-sm text-foreground">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    data-testid={`select-plan-${plan.tier.toLowerCase()}-btn`}
                  >
                    {plan.tier === 'Free' ? 'Start Your Compatibility Profile' : 'Get Started'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────────────────── */}
      <section className="mandala-bg py-20 px-6 bg-card border-t border-primary/10">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <div className="flex items-center justify-center mb-2">
            <SoulSathiyaLogo className="w-20 h-20" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground leading-snug">
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
              Build Your Compatibility Profile
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
      <footer className="bg-background text-foreground py-12 px-6 border-t border-primary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2.5 mb-4 text-primary">
                <SoulSathiyaLogo className="w-7 h-7" />
                <span className="text-xl font-heading font-bold text-foreground">
                  Soul<span className="text-primary">Sathiya</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                India's First Relationship Intelligence Platform
              </p>
              <p className="text-muted-foreground/60 text-xs mt-2 tracking-widest uppercase">
                Compatibility · Connection · Commitment
              </p>
            </div>
            <div>
              <h4 className="font-heading text-lg mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><a href="mailto:careers@soulsathiya.com" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#testimonials" className="hover:text-primary transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-lg mb-4 text-foreground">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@soulsathiya.com" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Safety Tips</Link></li>
                <li><a href="mailto:hello@soulsathiya.com" className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-lg mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary/10 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 SoulSathiya. All rights reserved. &nbsp;|&nbsp; India's First Relationship Intelligence Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
