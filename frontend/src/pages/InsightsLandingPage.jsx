import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Lock, ChevronRight, Star, Shield, Brain, Heart, MessageCircle, RefreshCw, Sun, Rocket } from 'lucide-react';

const GOLD   = '#D4A520';
const NAVY   = '#0C1323';
const CARD   = '#0F1A2E';

const SECTIONS = [
  { level: 1, icon: '❤️', title: 'Emotional Foundation',      subtitle: 'How you feel, connect, and heal', color: '#D4A520' },
  { level: 2, icon: '🌟', title: 'Values & Life Vision',       subtitle: 'What truly matters to you',        color: '#B8860B' },
  { level: 3, icon: '💬', title: 'Communication & Connection', subtitle: 'How you speak, listen, and love',  color: '#C9982A' },
  { level: 4, icon: '🔄', title: 'Relationship Patterns',      subtitle: 'Your history, habits, and healing', color: '#A0780A' },
  { level: 5, icon: '☀️', title: 'Daily Life & Lifestyle',     subtitle: 'How you live every day',           color: '#D4A520' },
  { level: 6, icon: '🚀', title: 'Growth & Future',            subtitle: 'Your dreams and who you\'re becoming', color: '#B8860B' },
];

const FEATURES = [
  { icon: Brain, text: 'A guided experience across 6 dimensions' },
  { icon: Sparkles, text: 'Personalised mini-insight after each level' },
  { icon: Shield, text: 'Completely private — only you see your results' },
  { icon: Lock, text: 'Start instantly — no signup needed' },
];

const TESTIMONIALS = [
  {
    quote: "I finally understood why I kept repeating the same patterns. This changed how I see myself.",
    name: "Priya S.",
    city: "Bengaluru",
  },
  {
    quote: "The mini-insights after each section made me stop and reflect in a way I never have before.",
    name: "Arjun M.",
    city: "Mumbai",
  },
  {
    quote: "Worth every rupee. The report felt like it was written specifically for me.",
    name: "Kavitha R.",
    city: "Chennai",
  },
];

export default function InsightsLandingPage() {
  const navigate  = useNavigate();
  const heroRef   = useRef(null);

  // Subtle parallax on scroll
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onScroll = () => {
      hero.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: NAVY, minHeight: '100vh', color: '#F5EDD8', fontFamily: 'Georgia, serif', overflowX: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid rgba(212,165,32,0.12)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="SoulSathiya" style={{ width: 32, height: 32 }} onError={e => { e.target.style.display = 'none'; }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#F5EDD8', letterSpacing: '0.02em' }}>
            Soul<span style={{ color: GOLD }}>Sathiya</span>
          </span>
        </a>
        <button
          onClick={() => navigate('/login')}
          style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13 }}
        >
          Sign In
        </button>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: 620, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 60px', overflow: 'hidden' }}>
        {/* Background glow */}
        <div ref={heroRef} style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(212,165,32,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 700 }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,165,32,0.1)', border: '1px solid rgba(212,165,32,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: GOLD }}>
            <Sparkles size={13} />
            India's First AI-Powered Relationship Intelligence Platform
          </div>

          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(36px, 6vw, 62px)', lineHeight: 1.15, fontWeight: 700, margin: '0 0 24px', letterSpacing: '-0.01em' }}>
            Discover Your<br />
            <span style={{ color: GOLD }}>Relationship Intelligence</span>
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(245,237,216,0.8)', maxWidth: 560, margin: '0 auto 36px' }}>
            A guided experience across 6 dimensions of how you relate. Start instantly — your private journey awaits.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'rgba(245,237,216,0.75)' }}>
                <Icon size={12} color={GOLD} />
                {text}
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <button
            onClick={() => navigate('/insights/assessment')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
              color: '#0C1323', fontWeight: 700, fontSize: 17,
              padding: '16px 40px', borderRadius: 12, border: 'none',
              cursor: 'pointer', letterSpacing: '0.01em',
              boxShadow: `0 8px 32px rgba(212,165,32,0.35)`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(212,165,32,0.45)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(212,165,32,0.35)`; }}
          >
            Start Your Private Relationship Analysis
            <ArrowRight size={18} />
          </button>

          <p style={{ marginTop: 14, fontSize: 12, color: 'rgba(245,237,216,0.45)' }}>
            No login required · Takes ~25 minutes · 100% private
          </p>
        </div>
      </section>

      {/* ── What You'll Discover ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, marginBottom: 16 }}>
            Your 6-Level Journey
          </h2>
          <p style={{ color: 'rgba(245,237,216,0.65)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Each level reveals a new dimension of your relationship self. Complete all six for your full report.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {SECTIONS.map((s) => (
            <div
              key={s.level}
              style={{
                background: CARD,
                border: '1px solid rgba(212,165,32,0.12)',
                borderRadius: 16,
                padding: '28px 24px',
                display: 'flex', alignItems: 'flex-start', gap: 18,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,165,32,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(212,165,32,0.12)'}
            >
              <div style={{ flexShrink: 0, width: 44, height: 44, background: 'rgba(212,165,32,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Level {s.level}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(245,237,216,0.55)' }}>{s.subtitle} · 18 questions</div>
              </div>
              <ChevronRight size={16} color="rgba(212,165,32,0.5)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(212,165,32,0.03)', borderTop: '1px solid rgba(212,165,32,0.08)', borderBottom: '1px solid rgba(212,165,32,0.08)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, marginBottom: 56 }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {[
              { step: '01', title: 'Start instantly', desc: 'No login, no sign-up. Click and begin immediately.' },
              { step: '02', title: 'Begin your guided experience', desc: 'Six levels of increasingly honest self-insight.' },
              { step: '03', title: 'Earn insights', desc: 'After each level, receive your personalised mini-insight.' },
              { step: '04', title: 'Unlock your report', desc: 'Sign in and unlock your full Relationship Intelligence Report — ₹999, one time.' },
            ].map((item) => (
              <div key={item.step} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 42, color: GOLD, fontWeight: 700, lineHeight: 1, marginBottom: 14 }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(245,237,216,0.6)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample Mini-Insight Preview ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20, fontFamily: 'sans-serif' }}>
            Example Mini-Insight
          </div>
          <div style={{ background: CARD, border: `1px solid ${GOLD}30`, borderRadius: 20, padding: '36px 32px', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
            {/* Top glow */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 32 }}>💛</div>
              <div>
                <div style={{ fontSize: 11, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Level 1 Complete</div>
                <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700 }}>Emotionally Secure</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ background: 'rgba(212,165,32,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 13, color: GOLD, fontWeight: 700 }}>
                  78 / 100
                </div>
              </div>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(245,237,216,0.85)', marginBottom: 20 }}>
              "You demonstrate strong emotional self-awareness and the capacity to connect authentically. Your ability to identify and hold your emotions means you bring a rich inner presence to relationships. Partners naturally feel seen and safe with you."
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 4, fontFamily: 'sans-serif' }}>✦ STRENGTH</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(245,237,216,0.8)' }}>Emotionally available without losing yourself</div>
              </div>
              <div style={{ background: 'rgba(212,165,32,0.06)', border: '1px solid rgba(212,165,32,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: GOLD, marginBottom: 4, fontFamily: 'sans-serif' }}>✦ GROWTH</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(245,237,216,0.8)' }}>Holding space for different emotional worlds</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(212,165,32,0.03)', borderTop: '1px solid rgba(212,165,32,0.08)', borderBottom: '1px solid rgba(212,165,32,0.08)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
            What people are saying
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ background: CARD, border: '1px solid rgba(212,165,32,0.12)', borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={GOLD} color={GOLD} />)}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(245,237,216,0.8)', marginBottom: 20, fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                <div style={{ fontSize: 13, color: GOLD, fontFamily: 'sans-serif' }}>— {t.name}, {t.city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compatibility Intelligence Report ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,165,32,0.1)', border: '1px solid rgba(212,165,32,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 20, fontSize: 12, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              💞 For Couples
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, marginBottom: 18, lineHeight: 1.2 }}>
              Go Deeper Together —<br />
              <span style={{ color: GOLD }}>Compatibility Intelligence Report</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(245,237,216,0.65)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Once both partners complete the 108-question assessment independently, SoulSathiya
              cross-analyses both profiles to reveal how your relationship truly works — and where it can grow.
            </p>
          </div>

          {/* Two columns: what you get + pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, marginBottom: 40 }}>

            {/* What you get */}
            <div style={{ background: CARD, border: '1px solid rgba(212,165,32,0.15)', borderRadius: 20, padding: '32px 28px' }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>🔬</div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>What You'll Discover</div>
              {[
                { icon: '❤️', text: 'Emotional dynamic — your combined attachment map' },
                { icon: '🌟', text: 'Values alignment — deal-breakers surfaced, shared vision revealed' },
                { icon: '💬', text: 'Communication chemistry — love language match & conflict style analysis' },
                { icon: '🔄', text: 'Relationship pattern overlap — where your histories intertwine' },
                { icon: '☀️', text: 'Lifestyle compatibility — pace, family, and daily rhythm' },
                { icon: '🚀', text: 'Growth trajectory — where you're headed together' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 14, color: 'rgba(245,237,216,0.75)', lineHeight: 1.55 }}>{text}</span>
                </div>
              ))}
              <div style={{ marginTop: 20, background: 'rgba(212,165,32,0.07)', border: '1px solid rgba(212,165,32,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'rgba(245,237,216,0.7)', lineHeight: 1.6 }}>
                <strong style={{ color: GOLD }}>One payment, two people.</strong> Either partner pays — both get full access to the shared report.
              </div>
            </div>

            {/* Pricing paths */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Path 1 */}
              <div style={{ background: CARD, border: '1px solid rgba(212,165,32,0.15)', borderRadius: 16, padding: '22px 24px' }}>
                <div style={{ fontSize: 12, color: 'rgba(245,237,216,0.45)', fontFamily: 'sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Both have individual reports</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 32, fontWeight: 700, color: GOLD }}>₹799</span>
                  <span style={{ fontSize: 13, color: 'rgba(245,237,216,0.5)' }}>per couple</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(245,237,216,0.6)', lineHeight: 1.5 }}>Just the Compatibility Intelligence Report — one partner pays, both access</div>
              </div>

              {/* Path 2 — Most Chosen */}
              <div style={{ background: 'rgba(212,165,32,0.07)', border: `1.5px solid ${GOLD}`, borderRadius: 16, padding: '22px 24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -11, left: 20, background: `linear-gradient(135deg, ${GOLD}, #B8860B)`, color: '#0C1323', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>
                  MOST CHOSEN
                </div>
                <div style={{ fontSize: 12, color: 'rgba(245,237,216,0.45)', fontFamily: 'sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>One has individual report, partner hasn't yet</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 32, fontWeight: 700, color: GOLD }}>₹1,499</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(245,237,216,0.6)', lineHeight: 1.5 }}>Partner's individual report + Compatibility Report · saves ₹299</div>
              </div>

              {/* Path 3 */}
              <div style={{ background: CARD, border: '1px solid rgba(212,165,32,0.15)', borderRadius: 16, padding: '22px 24px' }}>
                <div style={{ fontSize: 12, color: 'rgba(245,237,216,0.45)', fontFamily: 'sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Neither has taken the assessment</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 32, fontWeight: 700, color: GOLD }}>₹1,999</span>
                  <span style={{ fontSize: 13, color: 'rgba(245,237,216,0.5)' }}>couple pack</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(245,237,216,0.6)', lineHeight: 1.5 }}>Both individual reports + Compatibility Report · saves ₹798</div>
              </div>

            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => window.location.href = '/insights/assessment'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                color: '#0C1323', fontWeight: 700, fontSize: 16,
                padding: '15px 36px', borderRadius: 12, border: 'none',
                cursor: 'pointer', boxShadow: `0 8px 28px rgba(212,165,32,0.3)`,
              }}
            >
              Start Your Assessment — It Begins with You
              <ArrowRight size={17} />
            </button>
            <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(245,237,216,0.4)' }}>
              Complete your 108-question assessment, then invite your partner to unlock your Compatibility Report
            </p>
          </div>

        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 24 }}>💛</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>
            Your most meaningful relationship begins with understanding yourself.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(245,237,216,0.65)', lineHeight: 1.7, marginBottom: 40 }}>
            Six dimensions. One deeply honest portrait of how you connect, love, and grow.
          </p>
          <button
            onClick={() => navigate('/insights/assessment')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
              color: '#0C1323', fontWeight: 700, fontSize: 17,
              padding: '16px 40px', borderRadius: 12, border: 'none',
              cursor: 'pointer',
              boxShadow: `0 8px 32px rgba(212,165,32,0.35)`,
            }}
          >
            Begin Your Journey — Free
            <ArrowRight size={18} />
          </button>
          <p style={{ marginTop: 14, fontSize: 12, color: 'rgba(245,237,216,0.4)' }}>
            No login · No credit card · Start in seconds
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(212,165,32,0.1)', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: 13, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif' }}>
          © 2026 SoulSathiya · India's Relationship Intelligence Platform
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Help', '/help']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 13, color: 'rgba(245,237,216,0.4)', textDecoration: 'none', fontFamily: 'sans-serif' }}
              onMouseEnter={e => e.target.style.color = GOLD}
              onMouseLeave={e => e.target.style.color = 'rgba(245,237,216,0.4)'}
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
