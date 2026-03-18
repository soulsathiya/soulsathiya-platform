import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Shield, Mail, ArrowLeft, CheckCircle2,
  AlertTriangle, Heart, Lock, Eye, UserX, Smartphone,
  MapPin, Flag, Users, Sparkles, MessageCircle, CreditCard,
  PhoneCall, Handshake, ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED LAYOUT  (mirrors LegalPages pattern)
───────────────────────────────────────────────────────────────────────────── */
const SupportLayout = ({ badge, badgeIcon: BadgeIcon, title, subtitle, children }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0C1323', color: '#F5EDD8' }}>

      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <header style={{
        backgroundColor: scrolled ? 'rgba(12,19,35,0.96)' : 'transparent',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(212,165,32,0.15)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="SoulSathiya"
                 style={{ width: 36, height: 36, objectFit: 'contain' }} draggable={false} />
            <span style={{
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
              fontSize: 20, color: '#F5EDD8', letterSpacing: '0.3px',
            }}>SoulSathiya</span>
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid rgba(212,165,32,0.3)',
                backgroundColor: 'transparent', color: '#D4A520',
                fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(212,165,32,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <ArrowLeft size={15} /> Home
            </button>
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,165,32,0.09) 0%, transparent 70%)',
        padding: '64px 24px 56px', textAlign: 'center',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '6px 16px', borderRadius: 999,
          border: '1px solid rgba(212,165,32,0.3)',
          backgroundColor: 'rgba(212,165,32,0.07)',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#D4A520', marginBottom: 22,
        }}>
          {BadgeIcon && <BadgeIcon size={13} />} {badge}
        </span>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700,
          color: '#F5EDD8', margin: '0 0 18px', lineHeight: 1.2,
        }}>{title}</h1>
        <p style={{
          fontSize: 16, color: 'rgba(245,237,216,0.6)',
          maxWidth: 520, margin: '0 auto', lineHeight: 1.75,
        }}>{subtitle}</p>
      </div>

      {/* ── Thin gold divider ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto 0', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,165,32,0.3), transparent)' }} />
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '56px 24px 96px' }}>
        {children}
      </main>
    </div>
  );
};

/* ── Reusable card ────────────────────────────────────────────────────────── */
const Card = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: '#0F1A2E',
    border: '1px solid rgba(212,165,32,0.18)',
    borderRadius: 16, padding: '28px 32px',
    marginBottom: 24,
    ...style,
  }}>
    {children}
  </div>
);

/* ── Section heading ─────────────────────────────────────────────────────── */
const SectionHeading = ({ icon: Icon, color = '#D4A520', children }) => (
  <h2 style={{
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22, fontWeight: 700,
    color: '#F5EDD8', margin: '0 0 18px',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    {Icon && (
      <span style={{
        width: 34, height: 34, borderRadius: 9,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={color} />
      </span>
    )}
    {children}
  </h2>
);

/* ── Bullet row ──────────────────────────────────────────────────────────── */
const Bullet = ({ icon: Icon, color = '#D4A520', label, desc }) => (
  <li style={{
    display: 'flex', gap: 14, alignItems: 'flex-start',
    padding: '13px 0',
    borderBottom: '1px solid rgba(212,165,32,0.08)',
    listStyle: 'none',
  }}>
    <span style={{
      width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 2,
      backgroundColor: `${color}15`,
      border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={14} color={color} />
    </span>
    <div>
      <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: 15, color: '#F5EDD8' }}>{label}</p>
      {desc && <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(245,237,216,0.55)', lineHeight: 1.65 }}>{desc}</p>}
    </div>
  </li>
);

/* ── Warning bullet (red-tinted for scam warnings) ───────────────────────── */
const WarnBullet = ({ icon: Icon = AlertTriangle, label, desc, note }) => (
  <li style={{
    display: 'flex', gap: 14, alignItems: 'flex-start',
    padding: '14px 0',
    borderBottom: '1px solid rgba(212,165,32,0.07)',
    listStyle: 'none',
  }}>
    <span style={{
      width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 2,
      backgroundColor: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={14} color="#EF4444" />
    </span>
    <div>
      <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: 15, color: '#F5EDD8' }}>{label}</p>
      {desc && <p style={{ margin: '0 0 4px', fontSize: 13.5, color: 'rgba(245,237,216,0.55)', lineHeight: 1.65 }}>{desc}</p>}
      {note && <p style={{ margin: 0, fontSize: 12.5, color: '#D4A520', fontStyle: 'italic' }}>↳ {note}</p>}
    </div>
  </li>
);

/* ── Closing quote strip ─────────────────────────────────────────────────── */
const ClosingQuote = ({ children }) => (
  <div style={{
    textAlign: 'center', marginTop: 48,
    padding: '28px 32px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, rgba(212,165,32,0.07) 0%, rgba(212,165,32,0.03) 100%)',
    border: '1px solid rgba(212,165,32,0.2)',
  }}>
    <p style={{
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 20, fontStyle: 'italic',
      color: '#F5EDD8', margin: 0, lineHeight: 1.65,
    }}>"{children}"</p>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE 1 — HELP CENTER
───────────────────────────────────────────────────────────────────────────── */
export const HelpCenterPage = () => (
  <SupportLayout
    badge="Support"
    badgeIcon={BookOpen}
    title="Help Center"
    subtitle="Welcome to SoulSathiya's Help Center — your guide to navigating meaningful connections."
  >
    {/* Topic cards */}
    {[
      {
        icon: Sparkles, color: '#D4A520',
        label: 'Getting Started',
        desc: 'How to create and optimise your profile to attract deeply compatible matches.',
        tips: [
          'Complete all sections of your personality profile for better AI matching',
          'Add recent, clear photos to build trust with potential partners',
          'Set your relationship intent clearly — this filters your recommendations',
          'Take the psychometric assessment to unlock compatibility scoring',
        ],
      },
      {
        icon: Heart, color: '#E879A0',
        label: 'Relationship Intelligence Assessment',
        desc: 'Understand your compatibility score and what your psychological insights mean.',
        tips: [
          'Your compatibility score is built across 6 relationship dimensions',
          'Higher scores indicate stronger alignment — not perfection',
          'Deep Couple Reports are available for ₹999 (one-time, per couple)',
          'Both partners must complete the assessment to generate a shared report',
        ],
      },
      {
        icon: Users, color: '#60A5FA',
        label: 'Matches & Recommendations',
        desc: 'How SoulSathiya surfaces deeply compatible partners for you.',
        tips: [
          'AI analyses personality, values, communication style, and life goals',
          'Matches refresh regularly as profiles are updated',
          'Use compatibility filters to refine by specific dimensions',
          'Sending an interest signals genuine intent — use it thoughtfully',
        ],
      },
      {
        icon: CreditCard, color: '#34D399',
        label: 'Plans & Payments',
        desc: 'Details about subscriptions, pricing, and premium features.',
        tips: [
          'Free plan includes 10 curated matches and 3 interests per month',
          'Premium unlocks unlimited views, interests, and advanced filters',
          'Elite includes a dedicated relationship manager and priority placement',
          'Payments are secured via Razorpay — no card data is stored by us',
        ],
      },
      {
        icon: Lock, color: '#A78BFA',
        label: 'Privacy & Security',
        desc: 'How your personal data is protected and your experience kept safe.',
        tips: [
          'Your psychological data is never shared with or sold to third parties',
          'You control photo visibility and profile information at all times',
          'All profiles are KYC-verified before becoming discoverable',
          'Use the block and report feature freely — we act swiftly',
        ],
      },
    ].map(({ icon: Icon, color, label, desc, tips }) => (
      <Card key={label}>
        <SectionHeading icon={Icon} color={color}>{label}</SectionHeading>
        <p style={{ margin: '0 0 16px', fontSize: 14.5, color: 'rgba(245,237,216,0.6)', lineHeight: 1.7 }}>
          {desc}
        </p>
        <ul style={{ margin: 0, padding: 0 }}>
          {tips.map(t => (
            <li key={t} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '8px 0', listStyle: 'none',
              borderBottom: '1px solid rgba(212,165,32,0.07)',
              fontSize: 14, color: 'rgba(245,237,216,0.7)', lineHeight: 1.65,
            }}>
              <ChevronRight size={14} color={color} style={{ marginTop: 3, flexShrink: 0 }} />
              {t}
            </li>
          ))}
        </ul>
      </Card>
    ))}

    {/* Contact prompt */}
    <Card style={{ textAlign: 'center', background: 'rgba(212,165,32,0.05)' }}>
      <p style={{ margin: '0 0 6px', fontSize: 15, color: '#F5EDD8', fontWeight: 600 }}>
        Can't find what you're looking for?
      </p>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: 'rgba(245,237,216,0.55)' }}>
        Our support team is here to help.
      </p>
      <a href="mailto:support@soulsathiya.com" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '11px 24px', borderRadius: 10,
        background: 'linear-gradient(135deg, #D4A520, #B8881A)',
        color: '#000', fontWeight: 700, fontSize: 14, textDecoration: 'none',
        letterSpacing: '0.3px',
      }}>
        <Mail size={15} /> Email Support
      </a>
    </Card>

    <ClosingQuote>
      Our goal is to make your journey smooth, informed, and meaningful.
    </ClosingQuote>
  </SupportLayout>
);

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE 2 — SAFETY TIPS
───────────────────────────────────────────────────────────────────────────── */
export const SafetyTipsPage = () => (
  <SupportLayout
    badge="Your Safety"
    badgeIcon={Shield}
    title="Safety Tips"
    subtitle="Your safety — both emotional and personal — is our highest priority."
  >

    {/* Common Scams */}
    <Card>
      <SectionHeading icon={AlertTriangle} color="#EF4444">
        Common Scams to Watch Out For
      </SectionHeading>
      <ul style={{ margin: 0, padding: 0 }}>
        <WarnBullet
          icon={CreditCard}
          label="Money Requests"
          desc="Asking for financial help due to emergencies or urgent situations."
          note="Never send money to someone you haven't met and verified in person."
        />
        <WarnBullet
          icon={Heart}
          label="Fake Emotional Bonding"
          desc="Expressing love or deep attachment very quickly to gain trust."
          note="Genuine relationships take time. Rapid intensity is a red flag."
        />
        <WarnBullet
          icon={Eye}
          label="Intimate Photo / Video Requests"
          desc="Asking for private content which may later be used for blackmail."
          note="Never share intimate content online — with anyone."
        />
        <WarnBullet
          icon={Users}
          label="Fake High-Status Profiles"
          desc="Claiming to be NRI, army officer, doctor abroad, etc. with impressive but unverifiable stories."
          note="Verify through conversation, consistency, and real-world interaction."
        />
        <WarnBullet
          icon={PhoneCall}
          label="Avoiding Real-World Verification"
          desc="Hesitating or making excuses when you suggest a video call or meeting."
          note="Genuine people are open to connecting beyond text over time."
        />
        <WarnBullet
          icon={Smartphone}
          label="Moving Off Platform Quickly"
          desc="Asking to shift to WhatsApp or Telegram immediately after matching."
          note="Stay on platform initially — it protects both parties."
        />
      </ul>
    </Card>

    {/* Stay Secure */}
    <Card>
      <SectionHeading icon={Lock} color="#A78BFA">Stay Secure</SectionHeading>
      <ul style={{ margin: 0, padding: 0 }}>
        {[
          { icon: Lock,        text: 'Never share bank details, OTPs, or passwords' },
          { icon: UserX,       text: 'Avoid sharing Aadhaar, PAN, or passport copies' },
          { icon: AlertTriangle, text: 'Be cautious of unknown links sent via chat' },
          { icon: MessageCircle, text: 'Use platform chat until sufficient trust is built' },
        ].map(({ icon: Icon, text }) => (
          <Bullet key={text} icon={Icon} color="#A78BFA" label={text} />
        ))}
      </ul>
    </Card>

    {/* Build Trust */}
    <Card>
      <SectionHeading icon={Handshake} color="#34D399">Build Trust the Right Way</SectionHeading>
      <ul style={{ margin: 0, padding: 0 }}>
        {[
          { icon: Heart,        text: 'Take time to understand values, not just attraction' },
          { icon: Sparkles,     text: 'Use compatibility insights to guide decisions, not replace them' },
          { icon: CheckCircle2, text: 'Ask thoughtful questions and observe consistency over time' },
        ].map(({ icon: Icon, text }) => (
          <Bullet key={text} icon={Icon} color="#34D399" label={text} />
        ))}
      </ul>
    </Card>

    {/* Meeting Safely */}
    <Card>
      <SectionHeading icon={MapPin} color="#60A5FA">Meeting Safely</SectionHeading>
      <ul style={{ margin: 0, padding: 0 }}>
        {[
          { icon: MapPin,   text: 'Always meet in public places for the first few meetings' },
          { icon: PhoneCall, text: 'Inform a trusted friend or family member before meeting' },
          { icon: Eye,      text: 'Avoid isolated locations or late-night meetings initially' },
        ].map(({ icon: Icon, text }) => (
          <Bullet key={text} icon={Icon} color="#60A5FA" label={text} />
        ))}
      </ul>
    </Card>

    {/* Report & Block */}
    <Card style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
      <SectionHeading icon={Flag} color="#EF4444">Report &amp; Block</SectionHeading>
      <p style={{ margin: '0 0 16px', fontSize: 14.5, color: 'rgba(245,237,216,0.65)', lineHeight: 1.7 }}>
        If you encounter any of the following, report immediately:
      </p>
      <ul style={{ margin: '0 0 20px', padding: 0 }}>
        {['Money requests or financial pressure', 'Suspicious or inconsistent behaviour', 'Harassment, threats, or inappropriate content'].map(t => (
          <li key={t} style={{
            display: 'flex', gap: 10, alignItems: 'center',
            padding: '8px 0', listStyle: 'none',
            borderBottom: '1px solid rgba(239,68,68,0.1)',
            fontSize: 14, color: 'rgba(245,237,216,0.7)',
          }}>
            <Flag size={13} color="#EF4444" style={{ flexShrink: 0 }} />
            {t}
          </li>
        ))}
      </ul>
      <div style={{
        padding: '14px 18px', borderRadius: 10,
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        fontSize: 14, color: '#F5EDD8', fontWeight: 600,
      }}>
        🚨 &nbsp;Report immediately. Our team takes strict and swift action.
      </div>
    </Card>

    <ClosingQuote>
      Healthy relationships begin with safe and conscious choices.
    </ClosingQuote>
  </SupportLayout>
);

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE 3 — CONTACT US
───────────────────────────────────────────────────────────────────────────── */
export const ContactUsPage = () => (
  <SupportLayout
    badge="Get in Touch"
    badgeIcon={Mail}
    title="Contact Us"
    subtitle="We're here to support you at every step of your journey."
  >

    {/* Contact cards */}
    {[
      {
        icon: PhoneCall, color: '#D4A520',
        title: 'Customer Support',
        email: 'support@soulsathiya.com',
        detail: 'Response Time: 24–48 hours',
        desc: 'For account issues, subscription queries, technical problems, or any help navigating the platform.',
      },
      {
        icon: Handshake, color: '#34D399',
        title: 'Partnerships',
        email: 'partnerships@soulsathiya.com',
        detail: null,
        desc: 'Interested in collaborating with SoulSathiya? Reach out to explore strategic or community partnerships.',
      },
      {
        icon: MessageCircle, color: '#60A5FA',
        title: 'Feedback',
        email: 'feedback@soulsathiya.com',
        detail: null,
        desc: 'Your experience shapes our platform. Share suggestions, feature requests, or general feedback — we read every message.',
      },
    ].map(({ icon: Icon, color, title, email, detail, desc }) => (
      <Card key={title} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Icon */}
        <span style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={color} />
        </span>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 20, fontWeight: 700, color: '#F5EDD8', margin: '0 0 6px',
          }}>{title}</h3>
          <a href={`mailto:${email}`} style={{
            fontSize: 15, color: color, fontWeight: 600,
            textDecoration: 'none', letterSpacing: '0.2px',
          }}>
            {email}
          </a>
          {detail && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(245,237,216,0.45)' }}>
              {detail}
            </p>
          )}
          <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(245,237,216,0.55)', lineHeight: 1.7 }}>
            {desc}
          </p>
        </div>
      </Card>
    ))}

    {/* Office hours / commitment strip */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16, marginTop: 8,
    }}>
      {[
        { icon: CheckCircle2, color: '#34D399', label: 'Verified Team',       note: 'All support staff are trained and background-verified' },
        { icon: Lock,         color: '#A78BFA', label: 'Confidential',         note: 'Your conversations with us are always private' },
        { icon: Heart,        color: '#E879A0', label: 'Emotionally Mindful',  note: 'We understand the sensitivity of relationship journeys' },
      ].map(({ icon: Icon, color, label, note }) => (
        <div key={label} style={{
          padding: '20px 22px', borderRadius: 14,
          backgroundColor: '#0F1A2E',
          border: '1px solid rgba(212,165,32,0.15)',
          textAlign: 'center',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 10, marginBottom: 10,
            backgroundColor: `${color}15`, border: `1px solid ${color}30`,
          }}>
            <Icon size={18} color={color} />
          </span>
          <p style={{ margin: '0 0 5px', fontWeight: 700, fontSize: 14, color: '#F5EDD8' }}>{label}</p>
          <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(245,237,216,0.45)', lineHeight: 1.6 }}>{note}</p>
        </div>
      ))}
    </div>

    <ClosingQuote>
      We're here to support you at every step of your journey.
    </ClosingQuote>
  </SupportLayout>
);
