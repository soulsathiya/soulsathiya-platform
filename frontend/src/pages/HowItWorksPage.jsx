import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, ArrowRight, Shield, CheckCircle2, Users, Brain,
  Sparkles, Zap, Target, Eye, Search, MessageCircle,
  UserCheck, TrendingUp, Lock, Star, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';

// ─── Section 1: Hero ─────────────────────────────────────────────────────────

const HeroSection = () => (
  <section className="relative overflow-hidden py-24 lg:py-32">
    {/* Background gradient */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 60% 40%, hsla(43,82%,52%,0.08) 0%, transparent 70%)',
      }}
    />
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4" />
            AI × Psychology × Relationship Journey
          </div>
          <h1 className="font-heading text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Find a Partner Who{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, hsl(43,82%,62%) 0%, hsl(38,70%,52%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Truly Understands
            </span>{' '}
            You
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
            SoulSathiya blends psychological depth with AI precision to surface
            matches built on genuine compatibility — not just photos and proximity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register">
              <Button size="lg" className="btn-primary px-8 py-4 text-base font-semibold">
                Build Your Compatibility Profile
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/deep/demo-report">
              <Button variant="outline" size="lg" className="px-8 py-4 text-base border-border/60 hover:border-primary/50 hover:bg-primary/5">
                See a Sample Report
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> KYC Verified</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> AI Matched</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Psychology-Backed</span>
          </div>
        </div>

        {/* Right: Illustration placeholder */}
        <div className="flex justify-center lg:justify-end">
          <div
            className="relative w-80 h-80 lg:w-96 lg:h-96 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(225,35%,16%) 0%, hsl(225,38%,10%) 100%)',
              border: '1px solid hsla(43,82%,52%,0.2)',
              boxShadow: '0 0 60px hsla(43,82%,52%,0.1)',
            }}
          >
            {/* Decorative concentric rings */}
            {[180, 230, 280].map((size, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-primary/10"
                style={{ width: size, height: size }}
              />
            ))}
            {/* Center icon cluster */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(43,82%,52%) 0%, hsl(38,70%,42%) 100%)' }}
              >
                <Heart className="w-10 h-10 text-black fill-black" />
              </div>
              <div className="flex gap-3">
                {[Brain, Sparkles, Shield].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'hsla(43,82%,52%,0.12)', border: '1px solid hsla(43,82%,52%,0.2)' }}
                  >
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                Psychology · AI · Connection
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section 2: 3-Step Process ────────────────────────────────────────────────

const STEPS = [
  {
    step: '01',
    icon: Target,
    title: 'Build Your Compatibility Profile',
    color: 'hsl(43,82%,52%)',
    colorBg: 'hsla(43,82%,52%,0.1)',
    bullets: [
      'Complete a psychology-based psychometric assessment',
      'Share your values, life goals, and relationship expectations',
      'Upload KYC documents to verify your identity',
    ],
  },
  {
    step: '02',
    icon: Brain,
    title: 'Get Matched by AI + Psychology',
    color: 'hsl(217,91%,60%)',
    colorBg: 'hsla(217,91%,60%,0.1)',
    bullets: [
      'Our AI engine scores compatibility across 10 deep dimensions',
      'Personality, values, communication, and life goals are all weighed',
      'See a compatibility score before you ever say hello',
    ],
  },
  {
    step: '03',
    icon: UserCheck,
    title: 'Connect with Verified Profiles',
    color: 'hsl(142,71%,45%)',
    colorBg: 'hsla(142,71%,45%,0.1)',
    bullets: [
      'Browse matches that are verified and serious about commitment',
      'Express interest and start meaningful conversations',
      'Unlock a deep Relationship Intelligence Report for ₹999',
    ],
  },
];

const StepsSection = () => (
  <section className="py-24 bg-gradient-to-b from-background to-card/50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 space-y-4">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase">The Process</p>
        <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
          Three Steps to Meaningful Connection
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          A structured, thoughtful approach that respects your time and intentions.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {STEPS.map(({ step, icon: Icon, title, color, colorBg, bullets }) => (
          <div
            key={step}
            className="group relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 cursor-default"
            style={{
              background: 'hsl(225,35%,13%)',
              border: '1px solid hsl(225,28%,22%)',
              boxShadow: '0 4px 24px hsla(225,38%,4%,0.4)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color.replace(')', ',0.35)').replace('hsl', 'hsla');
              e.currentTarget.style.boxShadow = `0 12px 40px ${color.replace(')', ',0.15)').replace('hsl', 'hsla')}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'hsl(225,28%,22%)';
              e.currentTarget.style.boxShadow = '0 4px 24px hsla(225,38%,4%,0.4)';
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: colorBg, border: `1px solid ${color.replace(')', ',0.2)').replace('hsl', 'hsla')}` }}
              >
                <Icon className="w-7 h-7" style={{ color }} />
              </div>
              <span
                className="text-4xl font-heading font-bold"
                style={{ color: color.replace(')', ',0.18)').replace('hsl', 'hsla') }}
              >
                {step}
              </span>
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground mb-4">{title}</h3>
            <ul className="space-y-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section 3: Relationship Journey ─────────────────────────────────────────

export const RelationshipJourneyCards = () => (
  <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
    {/* FIND */}
    <div
      className="rounded-2xl p-8 space-y-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(145deg, hsl(225,40%,15%) 0%, hsl(225,38%,10%) 100%)',
        border: '1px solid hsla(217,91%,60%,0.25)',
        boxShadow: '0 4px 32px hsla(217,91%,60%,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'hsla(217,91%,60%,0.15)' }}
        >
          <Search className="w-5 h-5" style={{ color: 'hsl(217,91%,60%)' }} />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'hsl(217,91%,60%)' }}>
          FIND
        </span>
      </div>
      <div>
        <h3 className="font-heading text-xl font-bold text-foreground mb-2">Discover Compatible Matches</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          AI surfaces the most compatible profiles from our verified community.
        </p>
      </div>
      <ul className="space-y-2.5">
        {['Compatibility Score (0–100)', 'Relationship Readiness Score', 'Verified, serious profiles only'].map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(217,91%,60%)' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>

    {/* UNDERSTAND — highlighted */}
    <div
      className="rounded-2xl p-8 space-y-5 relative transition-all duration-300 hover:-translate-y-2"
      style={{
        background: 'linear-gradient(145deg, hsl(43,60%,18%) 0%, hsl(43,50%,12%) 100%)',
        border: '1.5px solid hsla(43,82%,52%,0.5)',
        boxShadow: '0 8px 48px hsla(43,82%,52%,0.18)',
      }}
    >
      {/* Badge */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wide"
        style={{
          background: 'linear-gradient(90deg, hsl(43,82%,52%) 0%, hsl(38,70%,42%) 100%)',
          color: '#0C1323',
        }}
      >
        Most Popular
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'hsla(43,82%,52%,0.2)' }}
        >
          <Eye className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase text-primary">UNDERSTAND</span>
      </div>
      <div>
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="font-heading text-xl font-bold text-foreground">Relationship Intelligence Report</h3>
          <span
            className="text-sm font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'hsla(43,82%,52%,0.2)', color: 'hsl(43,82%,62%)' }}
          >
            ₹999
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A 20-page deep compatibility report with actionable insights.
        </p>
      </div>
      <ul className="space-y-2.5">
        {['Deep compatibility insights across 10 dimensions', 'Decision clarity before committing', 'Communication & conflict style analysis', 'Strengths and growth areas'].map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
      <Link to="/deep/demo-report" className="block">
        <Button size="sm" className="btn-primary w-full mt-2 font-semibold">
          See Sample Report <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </Link>
    </div>

    {/* GROW — coming soon */}
    <div
      className="rounded-2xl p-8 space-y-5 relative transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(145deg, hsl(150,30%,14%) 0%, hsl(150,25%,10%) 100%)',
        border: '1px solid hsla(142,71%,45%,0.2)',
        boxShadow: '0 4px 32px hsla(142,71%,45%,0.05)',
      }}
    >
      {/* Coming Soon tag */}
      <div
        className="absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ background: 'hsla(142,71%,45%,0.15)', color: 'hsl(142,71%,55%)', border: '1px solid hsla(142,71%,45%,0.3)' }}
      >
        Coming Soon
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'hsla(142,71%,45%,0.15)' }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: 'hsl(142,71%,45%)' }} />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'hsl(142,71%,45%)' }}>
          GROW
        </span>
      </div>
      <div>
        <h3 className="font-heading text-xl font-bold text-foreground mb-2">Strengthen Your Relationship</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Guided tools to help you and your partner grow together with intention.
        </p>
      </div>
      <ul className="space-y-2.5">
        {['AI-guided relationship exercises', 'Counselling & coaching support', 'Milestone check-ins together'].map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(142,71%,45%)' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const JourneySection = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 space-y-4">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase">The Journey</p>
        <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
          From Discovery to Partnership
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          SoulSathiya guides you through three meaningful stages of your relationship journey.
        </p>
      </div>
      <RelationshipJourneyCards />
    </div>
  </section>
);

// ─── Section 4: Compatibility Score ──────────────────────────────────────────

const COMPAT_FACTORS = [
  { label: 'Personality', desc: 'Core traits, emotional style, and how you show up in relationships', score: 92 },
  { label: 'Values & Life Goals', desc: 'Shared views on family, career, finances, and the future', score: 85 },
  { label: 'Communication Style', desc: 'How you express needs, resolve conflict, and listen', score: 78 },
  { label: 'Expectations', desc: 'What you want from a partner, from intimacy to independence', score: 88 },
];

const CompatibilitySection = () => (
  <section className="py-24 bg-gradient-to-b from-card/30 to-background">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div className="space-y-8">
          <div>
            <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-4">Compatibility Engine</p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-5">
              A Score Built on What Actually Matters
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We don't match by age and height. Our AI analyses four deep dimensions
              to produce a compatibility score that genuinely predicts relationship success.
            </p>
          </div>
          <div className="space-y-5">
            {COMPAT_FACTORS.map(({ label, desc, score }) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{label}</span>
                  <span className="font-bold text-primary">{score}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${score}%`,
                      background: 'linear-gradient(90deg, hsl(43,82%,52%) 0%, hsl(38,70%,42%) 100%)',
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Score visual */}
        <div className="flex justify-center lg:justify-end">
          <div
            className="w-72 h-72 lg:w-80 lg:h-80 rounded-3xl flex flex-col items-center justify-center gap-4 relative"
            style={{
              background: 'linear-gradient(145deg, hsl(43,60%,18%) 0%, hsl(43,50%,12%) 100%)',
              border: '1.5px solid hsla(43,82%,52%,0.4)',
              boxShadow: '0 0 80px hsla(43,82%,52%,0.12)',
            }}
          >
            {/* Outer ring */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
              <circle cx="160" cy="160" r="140" fill="none" stroke="hsla(43,82%,52%,0.08)" strokeWidth="2" />
              <circle
                cx="160" cy="160" r="140"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="879"
                strokeDashoffset="176"
                transform="rotate(-90 160 160)"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(43,82%,52%)" />
                  <stop offset="100%" stopColor="hsl(38,70%,42%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative z-10 text-center">
              <div
                className="text-7xl font-heading font-bold"
                style={{
                  background: 'linear-gradient(135deg, hsl(43,82%,62%) 0%, hsl(38,70%,52%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                86
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Compatibility Score</div>
              <div
                className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'hsla(43,82%,52%,0.2)', color: 'hsl(43,82%,62%)' }}
              >
                Highly Compatible
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section 5: Safety & Trust ────────────────────────────────────────────────

const TRUST_ITEMS = [
  {
    icon: UserCheck,
    title: 'KYC Verified',
    desc: 'Every profile is verified with a government-issued ID. No fakes, no bots — just real, serious people.',
    color: 'hsl(43,82%,52%)',
    colorBg: 'hsla(43,82%,52%,0.1)',
  },
  {
    icon: Brain,
    title: 'AI Moderation',
    desc: 'Our AI continuously monitors profiles and messages to ensure a safe, respectful environment.',
    color: 'hsl(217,91%,60%)',
    colorBg: 'hsla(217,91%,60%,0.1)',
  },
  {
    icon: Lock,
    title: 'Serious Users Only',
    desc: 'SoulSathiya is designed exclusively for those seeking meaningful, long-term relationships.',
    color: 'hsl(142,71%,45%)',
    colorBg: 'hsla(142,71%,45%,0.1)',
  },
];

const TrustSection = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 space-y-4">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase">Safety & Trust</p>
        <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
          A Platform You Can Trust
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          We take safety seriously — because the most important decisions deserve a secure space.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {TRUST_ITEMS.map(({ icon: Icon, title, desc, color, colorBg }) => (
          <div
            key={title}
            className="rounded-2xl p-8 space-y-5 text-center group transition-all duration-300 hover:-translate-y-1"
            style={{
              background: 'hsl(225,35%,13%)',
              border: '1px solid hsl(225,28%,22%)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: colorBg, border: `1px solid ${color.replace('hsl(', 'hsla(').replace(')', ',0.25)')}` }}
            >
              <Icon className="w-8 h-8" style={{ color }} />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section 6: Final CTA ─────────────────────────────────────────────────────

const CTASection = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <div
        className="rounded-3xl p-12 lg:p-16 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(43,60%,18%) 0%, hsl(225,38%,12%) 50%, hsl(43,50%,14%) 100%)',
          border: '1px solid hsla(43,82%,52%,0.3)',
          boxShadow: '0 0 80px hsla(43,82%,52%,0.1)',
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, hsla(43,82%,52%,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 space-y-7 max-w-2xl mx-auto">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(43,82%,52%) 0%, hsl(38,70%,42%) 100%)' }}
          >
            <Heart className="w-8 h-8 text-black fill-black" />
          </div>
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
            Your Ideal Partner Is Looking for You Too
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Take the first step. Build your compatibility profile today and
            let psychology and AI guide you toward a relationship built to last.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="btn-primary px-10 py-4 text-base font-semibold"
              >
                Build Your Compatibility Profile
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/about">
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-4 text-base border-border/60 hover:border-primary/50 hover:bg-primary/5"
              >
                Learn About Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Page Assembly ────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <StepsSection />
      <JourneySection />
      <CompatibilitySection />
      <TrustSection />
      <CTASection />
      <SiteFooter />
    </div>
  );
}
