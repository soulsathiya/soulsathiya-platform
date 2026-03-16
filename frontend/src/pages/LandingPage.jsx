import React from 'react';
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
    { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Verified Members', desc: 'Every profile KYC-verified for authenticity' },
    { icon: <Lock className="w-5 h-5" />, label: 'Privacy-First Controls', desc: 'You decide who sees your photos and details' },
    { icon: <Brain className="w-5 h-5" />, label: 'Compatibility-Driven', desc: 'AI-powered matching based on deep psychology' },
    { icon: <Heart className="w-5 h-5" />, label: 'Marriage-Focused', desc: 'A serious community built for lasting commitment' },
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

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Radar chart */}
            <div className="flex flex-col items-center space-y-4">
              <div className="card-surface p-6 rounded-2xl w-full max-w-sm mx-auto">
                <div className="text-center mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Sample Compatibility</p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-4xl font-heading font-bold text-primary">89%</span>
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-muted-foreground">Overall</span>
                      <span className="text-xs font-medium text-primary">Strong Match</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/80 italic leading-snug max-w-xs mx-auto">
                    {getOverallInsight(89)}
                  </p>
                </div>
                <div className="flex justify-center">
                  <RadarChart dimensions={radarDimensions} size={220} />
                </div>
              </div>
            </div>

            {/* Sample insights */}
            <div className="space-y-5">
              <div className="card-surface p-6 space-y-4 rounded-2xl">
                <h3 className="font-heading text-xl text-foreground">Sample Compatibility Insights</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Emotional Alignment', value: 92, status: 'strong' },
                    { label: 'Life Goals', value: 88, status: 'strong' },
                    { label: 'Communication Style', value: 78, status: 'strong' },
                    { label: 'Conflict Resolution', value: 72, status: 'growth' },
                    { label: 'Family Values', value: 85, status: 'strong' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {item.status === 'strong'
                            ? <Check className="w-3.5 h-3.5 text-primary" />
                            : <span className="text-primary/60 text-xs">▲</span>
                          }
                          <span className="text-foreground font-medium">{item.label}</span>
                        </div>
                        <span className="text-primary font-bold">{item.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground/80 italic leading-snug">
                        {getDimensionInsight(item.label, item.value)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-primary/10 pt-3 grid grid-cols-2 gap-3">
                  <div className="bg-primary/8 border border-primary/15 rounded-lg p-3">
                    <p className="text-xs font-semibold text-primary mb-1">Strong Alignment</p>
                    <p className="text-xs text-muted-foreground">Emotional Stability · Life Vision · Communication</p>
                  </div>
                  <div className="bg-muted/40 border border-primary/10 rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Growth Area</p>
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
                className="card-surface p-6 space-y-4 text-center hover:border-primary/30 transition-all duration-200"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 mx-auto bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustItems.map((item, i) => (
              <div key={i} className="card-surface p-6 space-y-3 text-center hover:border-primary/30 transition-all duration-200">
                <div className="w-12 h-12 mx-auto bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <h4 className="font-heading text-lg text-foreground">{item.label}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Success Stories ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-background" id="testimonials">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl mb-4 text-foreground">Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real couples who found each other through compatibility intelligence
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                names: 'Priya & Arjun',
                location: 'Mumbai & Bangalore',
                compat: '91%',
                story: 'Our compatibility analysis predicted we would communicate effortlessly — and it was right. When we explored our Deep Compatibility Report together, we saw alignment we never expected. We got married six months after matching.',
                photo: 'https://images.pexels.com/photos/10987899/pexels-photo-10987899.jpeg',
              },
              {
                names: 'Meera & Vikram',
                location: 'Delhi & Hyderabad',
                compat: '87%',
                story: 'I never believed a platform could truly understand relationship compatibility. SoulSathiya proved me wrong. Our Deep Report highlighted exactly where we were strong and where we needed to grow. We got engaged last month.',
                photo: 'https://images.pexels.com/photos/32161001/pexels-photo-32161001.jpeg',
              },
              {
                names: 'Ananya & Rahul',
                location: 'Pune & Chennai',
                compat: '89%',
                story: 'SoulSathiya felt completely different from other matrimonial sites. The compatibility insights showed us we were emotionally aligned in ways we had never articulated ourselves. We just completed our wedding ceremony.',
                photo: 'https://images.pexels.com/photos/36079282/pexels-photo-36079282.jpeg',
              },
            ].map((story, i) => (
              <div
                key={i}
                className="card-surface rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300"
                data-testid={`testimonial-${i}`}
              >
                {/* Couple photo */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={story.photo}
                    alt={story.names}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  {/* Score badge over photo */}
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <div className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                      {story.compat} Compatible
                    </div>
                  </div>
                </div>

                {/* Story content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-heading text-lg font-semibold text-foreground">{story.names}</h4>
                    <p className="text-xs text-muted-foreground">{story.location}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "{story.story}"
                  </p>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10 text-muted-foreground text-sm">
            <p>Join over <strong className="text-primary">10,000+</strong> members who have found meaningful connections</p>
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
                    Get Started
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
          <h2 className="font-heading text-4xl text-foreground">
            Ready to Find Your <span className="text-gold-gradient">Perfect Match</span>?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of Indians who found their life partners through deep compatibility intelligence
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
