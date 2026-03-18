import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, ArrowRight, Shield, CheckCircle2, Brain,
  Sparkles, Users, Star, Globe, Target, Zap,
  MessageCircle, TrendingUp, BookOpen, Award, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelationshipJourneyCards } from './HowItWorksPage';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';

// ─── Section 1: Hero ─────────────────────────────────────────────────────────

const HeroSection = () => (
  <section className="relative overflow-hidden py-28 lg:py-36 text-center">
    {/* Background glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 30%, hsla(43,82%,52%,0.07) 0%, transparent 70%)',
      }}
    />
    <div className="container mx-auto px-6 relative z-10 space-y-7 max-w-3xl mx-auto">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary mx-auto">
        <Heart className="w-4 h-4 fill-primary" />
        Our Story & Mission
      </div>
      <h1 className="font-heading text-5xl lg:text-7xl font-bold text-foreground leading-tight">
        Redefining Relationships{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, hsl(43,82%,62%) 0%, hsl(38,70%,52%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Through Understanding
        </span>
      </h1>
      <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        We believe the right relationship begins with genuine self-awareness and deep
        compatibility — not swipes, not luck, not surface-level attraction.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
        <Link to="/register">
          <Button size="lg" className="btn-primary px-10 py-4 text-base font-semibold">
            Start Your Journey <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
        <Link to="/how-it-works">
          <Button variant="outline" size="lg" className="px-10 py-4 text-base border-border/60 hover:border-primary/50 hover:bg-primary/5">
            How It Works
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

// ─── Section 2: Mission + Why ─────────────────────────────────────────────────

const MissionSection = () => (
  <section className="py-24 bg-gradient-to-b from-background to-card/40">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        {/* Left: Mission statement */}
        <div className="space-y-7">
          <div>
            <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-4">Our Mission</p>
            <h2 className="font-heading text-4xl font-bold text-foreground mb-5 leading-tight">
              Help Every Person Find a Relationship That Truly Flourishes
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            SoulSathiya was built on a simple conviction: that lasting relationships are
            formed when two people deeply understand each other before they commit.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We combine the science of psychology with the power of AI to create a
            platform where compatibility is measured, relationships are nurtured, and
            every match is made with intentionality and care.
          </p>
          <blockquote
            className="border-l-2 border-primary pl-6 py-2 italic text-lg text-foreground/80 font-heading"
          >
            "The quality of your relationships determines the quality of your life."
          </blockquote>
        </div>

        {/* Right: Problem → Shift → Solution */}
        <div className="space-y-5">
          {[
            {
              step: 'The Problem',
              color: 'hsl(0,72%,50%)',
              colorBg: 'hsla(0,72%,50%,0.08)',
              borderColor: 'hsla(0,72%,50%,0.2)',
              text: 'Most matchmaking platforms optimise for engagement — more swipes, more messages, more time spent. The result is burnout, wasted years, and relationships built on attraction alone rather than deep compatibility.',
            },
            {
              step: 'The Shift',
              color: 'hsl(43,82%,52%)',
              colorBg: 'hsla(43,82%,52%,0.08)',
              borderColor: 'hsla(43,82%,52%,0.2)',
              text: 'Modern relationship science confirms what we\'ve always known: lasting partnerships form when personality, values, communication styles, and life goals are aligned. Attraction fades; deep compatibility endures.',
            },
            {
              step: 'Our Solution',
              color: 'hsl(142,71%,45%)',
              colorBg: 'hsla(142,71%,45%,0.08)',
              borderColor: 'hsla(142,71%,45%,0.2)',
              text: 'SoulSathiya uses a psychology-backed assessment and AI to surface only the most compatible profiles — then provides a Relationship Intelligence Report to give you the clarity to make confident decisions.',
            },
          ].map(({ step, color, colorBg, borderColor, text }) => (
            <div
              key={step}
              className="rounded-2xl p-6 space-y-3"
              style={{ background: colorBg, border: `1px solid ${borderColor}` }}
            >
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{step}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ─── Section 3: Our Approach ──────────────────────────────────────────────────

const APPROACH_PILLARS = [
  {
    icon: BookOpen,
    title: 'Psychology',
    color: 'hsl(43,82%,52%)',
    colorBg: 'hsla(43,82%,52%,0.1)',
    desc: 'Our assessments are grounded in established relationship psychology. We measure personality dimensions, attachment styles, communication preferences, and value systems — the factors research shows matter most in long-term compatibility.',
    points: ['Attachment theory', 'Big Five personality', 'Values alignment', 'Communication mapping'],
  },
  {
    icon: Zap,
    title: 'Artificial Intelligence',
    color: 'hsl(217,91%,60%)',
    colorBg: 'hsla(217,91%,60%,0.1)',
    desc: 'Our AI engine synthesises assessment responses across 10 dimensions to compute a compatibility score. It continuously learns to surface better matches — not from swipe data, but from deep psychological signals.',
    points: ['10-dimension scoring', 'Adaptive matching', 'Deep compatibility analysis', 'Bias-free evaluation'],
  },
  {
    icon: Heart,
    title: 'Human Intent',
    color: 'hsl(330,80%,60%)',
    colorBg: 'hsla(330,80%,60%,0.1)',
    desc: 'Every feature on SoulSathiya is designed for people who are genuinely ready for a long-term relationship. We filter for intent from day one — through KYC verification, psychometric onboarding, and platform culture.',
    points: ['KYC identity verification', 'Intent-based onboarding', 'Serious user community', 'Relationship-first design'],
  },
];

const ApproachSection = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 space-y-4">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase">Our Approach</p>
        <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
          Three Pillars of Deep Compatibility
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Everything on SoulSathiya is built on the intersection of these three forces.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {APPROACH_PILLARS.map(({ icon: Icon, title, color, colorBg, desc, points }) => (
          <div
            key={title}
            className="rounded-2xl p-8 space-y-6 transition-all duration-300 hover:-translate-y-1"
            style={{
              background: 'hsl(225,35%,13%)',
              border: '1px solid hsl(225,28%,22%)',
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: colorBg, border: `1px solid ${color.replace('hsl(', 'hsla(').replace(')', ',0.25)')}` }}
            >
              <Icon className="w-7 h-7" style={{ color }} />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-3">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
            <ul className="space-y-2">
              {points.map((pt, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section 4: Relationship Journey ─────────────────────────────────────────

const JourneySection = () => (
  <section className="py-24 bg-gradient-to-b from-card/30 to-background">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 space-y-4">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase">The Journey</p>
        <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
          Find. Understand. Grow.
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          SoulSathiya maps the full arc of a relationship — from first discovery to lasting growth.
        </p>
      </div>
      <RelationshipJourneyCards />
    </div>
  </section>
);

// ─── Section 5: Founder Section ───────────────────────────────────────────────

const FounderSection = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 space-y-4">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase">The Founder</p>
        <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
          Built With Purpose
        </h2>
      </div>
      <div
        className="max-w-4xl mx-auto rounded-3xl p-10 lg:p-14"
        style={{
          background: 'hsl(225,35%,13%)',
          border: '1px solid hsl(225,28%,24%)',
        }}
      >
        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Left: Avatar */}
          <div className="lg:col-span-2 flex flex-col items-center lg:items-start gap-4">
            <div
              className="w-32 h-32 rounded-3xl flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(43,60%,20%) 0%, hsl(43,50%,14%) 100%)',
                border: '2px solid hsla(43,82%,52%,0.3)',
                boxShadow: '0 0 40px hsla(43,82%,52%,0.12)',
              }}
            >
              <User className="w-16 h-16 text-primary/60" />
            </div>
            <div className="text-center lg:text-left">
              <p className="font-heading text-xl font-bold text-foreground">Rakesh Kumar Dogra</p>
              <p className="text-sm text-primary font-medium mt-1">Founder, SoulSathiya</p>
            </div>
            <div className="flex items-center gap-2">
              {[Brain, Heart, Shield].map((Icon, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'hsla(43,82%,52%,0.1)', border: '1px solid hsla(43,82%,52%,0.2)' }}
                >
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Note */}
          <div className="lg:col-span-3 space-y-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsla(43,82%,52%,0.1)' }}
            >
              <Star className="w-5 h-5 text-primary" />
            </div>
            <blockquote className="font-heading text-2xl text-foreground leading-relaxed italic">
              "I built SoulSathiya because I saw brilliant, deserving people struggling
              to find the right partner — not because they were unlucky, but because
              the tools available to them were fundamentally misaligned with what
              makes relationships actually work."
            </blockquote>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                The idea for SoulSathiya began with a simple question: what if a
                matchmaking platform was designed not to maximise engagement, but to
                maximise relationship success?
              </p>
              <p>
                That question led to deep research into relationship psychology,
                compatibility science, and what separates relationships that last
                from those that don't. The answer was clear: understanding.
              </p>
              <p>
                SoulSathiya is my commitment to building a platform that takes
                relationships seriously — one that uses the best of technology
                and psychology to help people find what they're truly looking for.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section 6: Vision ────────────────────────────────────────────────────────

const VisionSection = () => (
  <section className="py-24 bg-gradient-to-b from-card/30 to-background">
    <div className="container mx-auto px-6">
      <div
        className="max-w-3xl mx-auto text-center rounded-3xl py-16 px-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, hsl(43,60%,16%) 0%, hsl(225,38%,11%) 100%)',
          border: '1px solid hsla(43,82%,52%,0.25)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, hsla(43,82%,52%,0.05) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 space-y-6">
          <p className="text-primary font-semibold text-sm tracking-widest uppercase">Our Vision</p>
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            A World Where Every Person Finds
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, hsl(43,82%,62%) 0%, hsl(38,70%,52%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Their True Partner
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            We envision a future where technology doesn't distract from human connection —
            it deepens it. Where relationships are formed with clarity, intention,
            and mutual understanding from the very first interaction.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2 text-muted-foreground text-sm">
            <Globe className="w-4 h-4 text-primary" />
            Starting in India. Built for the world.
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section 7: Trust Checklist ───────────────────────────────────────────────

const TRUST_POINTS = [
  { label: 'Psychology-Based Framework', desc: 'Every match is underpinned by validated psychological dimensions, not arbitrary algorithms.' },
  { label: 'Structured Relationship Journey', desc: 'FIND → UNDERSTAND → GROW — a clear path from first match to lasting commitment.' },
  { label: 'Verified Users Only', desc: 'KYC verification ensures every profile belongs to a real, intentional person.' },
  { label: 'Long-Term Relationship Focus', desc: 'Designed exclusively for people seeking serious, committed partnerships.' },
  { label: 'Privacy-First Design', desc: 'Your psychometric data is yours. We never sell it, never share it without your consent.' },
  { label: 'Continuous AI Moderation', desc: 'AI monitors the platform 24/7 to maintain a safe, respectful environment.' },
];

const TrustSection = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 space-y-4">
        <p className="text-primary font-semibold text-sm tracking-widest uppercase">Why Trust Us</p>
        <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground">
          Built on Principles, Not Metrics
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          We measure our success by the quality of relationships we help create — not by engagement numbers.
        </p>
      </div>
      <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-5">
        {TRUST_POINTS.map(({ label, desc }) => (
          <div
            key={label}
            className="flex gap-4 p-6 rounded-2xl transition-all duration-300 hover:border-primary/30"
            style={{
              background: 'hsl(225,35%,13%)',
              border: '1px solid hsl(225,28%,22%)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ background: 'hsla(43,82%,52%,0.12)', border: '1px solid hsla(43,82%,52%,0.2)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">{label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section 8: Final CTA ─────────────────────────────────────────────────────

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
            Join a Community That Takes Relationships Seriously
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Build your compatibility profile today. Let psychology and AI guide you
            toward the relationship you truly deserve.
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
            <Link to="/how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-4 text-base border-border/60 hover:border-primary/50 hover:bg-primary/5"
              >
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Page Assembly ────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <MissionSection />
      <ApproachSection />
      <JourneySection />
      <FounderSection />
      <VisionSection />
      <TrustSection />
      <CTASection />
      <SiteFooter />
    </div>
  );
}
