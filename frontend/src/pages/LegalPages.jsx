import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Shield, CheckCircle, Mail, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─────────────────────────────────────────
   SHARED LAYOUT
───────────────────────────────────────── */
const LegalLayout = ({ title, subtitle, children }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0C1323', color: '#F5EDD8' }}>
      {/* ── Sticky Header ── */}
      <header
        style={{
          backgroundColor: scrolled ? 'rgba(12,19,35,0.95)' : 'transparent',
          backdropFilter: 'blur(12px)',
          borderBottom: scrolled ? '1px solid rgba(212,165,32,0.15)' : '1px solid transparent',
          transition: 'all 0.3s ease',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Heart style={{ width: 26, height: 26, color: '#D4A520', fill: '#D4A520' }} />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 700,
                fontSize: 20,
                color: '#F5EDD8',
                letterSpacing: '0.3px',
              }}
            >
              SoulSathiya
            </span>
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(212,165,32,0.3)',
                backgroundColor: 'transparent',
                color: '#D4A520',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(212,165,32,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Home
            </button>
          </Link>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #141F35 0%, #0C1323 60%, #1a1200 100%)',
          borderBottom: '1px solid rgba(212,165,32,0.12)',
          padding: '56px 24px 48px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 20,
              backgroundColor: 'rgba(212,165,32,0.1)',
              border: '1px solid rgba(212,165,32,0.25)',
              marginBottom: 20,
            }}
          >
            <Shield style={{ width: 13, height: 13, color: '#D4A520' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#D4A520', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Legal &amp; Privacy
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 700,
              color: '#F5EDD8',
              margin: '0 0 12px',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 15, color: '#A8997A', margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
          )}
          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              color: '#6B7A99',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#D4A520',
              }}
            />
            Last updated: March 2026
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main
        style={{
          maxWidth: 860,
          margin: '48px auto 80px',
          padding: '0 24px',
        }}
      >
        {children}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(212,165,32,0.1)',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: '#6B7A99', margin: 0 }}>
          © 2026 SoulSathiya &nbsp;·&nbsp;{' '}
          <Link to="/privacy" style={{ color: '#D4A520', textDecoration: 'none' }}>Privacy Policy</Link>
          &nbsp;·&nbsp;
          <Link to="/terms" style={{ color: '#D4A520', textDecoration: 'none' }}>Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
};

/* ─────────────────────────────────────────
   REUSABLE COMPONENTS
───────────────────────────────────────── */

/** A full-width card wrapping a single section */
const SectionCard = ({ children, highlight }) => (
  <div
    style={{
      backgroundColor: highlight ? 'rgba(212,165,32,0.06)' : '#141F35',
      border: highlight ? '1px solid rgba(212,165,32,0.25)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: '32px 36px',
      marginBottom: 20,
    }}
  >
    {children}
  </div>
);

/** Section number badge + heading */
const SectionHeading = ({ number, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
    <span
      style={{
        minWidth: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(212,165,32,0.15)',
        border: '1px solid rgba(212,165,32,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#D4A520',
        flexShrink: 0,
        marginTop: 2,
      }}
    >
      {number}
    </span>
    <h2
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(19px, 2.5vw, 23px)',
        fontWeight: 700,
        color: '#F5EDD8',
        margin: 0,
        lineHeight: 1.3,
      }}
    >
      {children}
    </h2>
  </div>
);

/** Body paragraph */
const Para = ({ children, style }) => (
  <p
    style={{
      fontSize: 15,
      lineHeight: 1.8,
      color: '#C5B99A',
      margin: '0 0 12px',
      ...style,
    }}
  >
    {children}
  </p>
);

/** Bullet list */
const BulletList = ({ items }) => (
  <ul style={{ margin: '8px 0 12px', padding: 0, listStyle: 'none' }}>
    {items.map((item, i) => (
      <li
        key={i}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 15,
          lineHeight: 1.7,
          color: '#C5B99A',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            marginTop: 7,
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: '#D4A520',
            flexShrink: 0,
          }}
        />
        {item}
      </li>
    ))}
  </ul>
);

/** Trust callout — highlights key trust statements */
const TrustCallout = ({ children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: 'rgba(212,165,32,0.08)',
      border: '1px solid rgba(212,165,32,0.2)',
      borderRadius: 10,
      padding: '12px 16px',
      marginTop: 16,
    }}
  >
    <CheckCircle style={{ width: 16, height: 16, color: '#D4A520', flexShrink: 0, marginTop: 2 }} />
    <p style={{ fontSize: 14, fontWeight: 600, color: '#D4A520', margin: 0, lineHeight: 1.6 }}>{children}</p>
  </div>
);

/** Disclaimer block */
const Disclaimer = ({ children }) => (
  <div
    style={{
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderLeft: '3px solid #D4A520',
      borderRadius: '0 8px 8px 0',
      padding: '12px 16px',
      marginTop: 14,
    }}
  >
    <p style={{ fontSize: 13.5, color: '#A8997A', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
      <strong style={{ color: '#D4A520', fontStyle: 'normal' }}>Important:</strong> {children}
    </p>
  </div>
);

/** Sub-heading within a card */
const SubHeading = ({ children }) => (
  <p
    style={{
      fontSize: 14,
      fontWeight: 700,
      color: '#F5EDD8',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      margin: '18px 0 6px',
    }}
  >
    {children}
  </p>
);

/* ─────────────────────────────────────────
   TERMS OF SERVICE
───────────────────────────────────────── */
export const TermsOfServicePage = () => (
  <LegalLayout
    title="Terms of Service"
    subtitle="Please read these terms carefully before using SoulSathiya. By accessing the platform, you agree to be bound by the conditions below."
  >
    {/* 1 */}
    <SectionCard>
      <SectionHeading number="1">Acceptance of Terms</SectionHeading>
      <Para>
        By accessing or using SoulSathiya, you agree to be bound by these Terms of Service. If you do not agree
        with any part of these terms, you must not use the platform.
      </Para>
    </SectionCard>

    {/* 2 */}
    <SectionCard>
      <SectionHeading number="2">Eligibility</SectionHeading>
      <Para>You must be at least 18 years of age to use SoulSathiya. By registering, you confirm that:</Para>
      <BulletList
        items={[
          'You are legally eligible to marry under applicable laws in your jurisdiction',
          'All information provided by you is accurate, current, and truthful',
        ]}
      />
      <Para>
        SoulSathiya reserves the right to verify user information and suspend accounts found to be in violation.
      </Para>
    </SectionCard>

    {/* 3 */}
    <SectionCard>
      <SectionHeading number="3">User Conduct</SectionHeading>
      <Para>You agree to use the platform responsibly and not to:</Para>
      <BulletList
        items={[
          'Create false, misleading, or duplicate profiles',
          'Harass, abuse, threaten, or harm other users',
          'Share personal or contact information of another user without consent',
          'Use the platform for advertising, solicitation, or commercial purposes',
          'Attempt to hack, disrupt, or bypass platform security',
        ]}
      />
      <Disclaimer>Violation of any of the above may result in immediate suspension or permanent termination of your account.</Disclaimer>
    </SectionCard>

    {/* 4 */}
    <SectionCard>
      <SectionHeading number="4">Subscriptions and Payments</SectionHeading>
      <BulletList
        items={[
          'Subscription plans are billed in advance on a recurring basis (monthly or as selected).',
          'Payments are securely processed via Razorpay or other authorised payment gateways.',
          'Refunds may be requested within 7 days of purchase, provided the subscription has not been substantially used.',
          'One-time services (such as profile boosts or premium reports) are non-refundable once activated or delivered.',
        ]}
      />
      <Para style={{ marginTop: 12 }}>
        SoulSathiya reserves the right to modify pricing with prior notice.
      </Para>
    </SectionCard>

    {/* 5 */}
    <SectionCard highlight>
      <SectionHeading number="5">Deep Couple Compatibility Exploration</SectionHeading>
      <Para>
        The Deep Exploration feature is a paid service or included in select subscription plans.
      </Para>
      <BulletList
        items={[
          'Both partners must complete the full assessment for report generation',
          'Reports are generated using AI-based psychological models and compatibility frameworks',
          'Results are intended for self-awareness and informational purposes only',
        ]}
      />
      <Disclaimer>
        This feature does not constitute medical, psychological, or professional counselling advice. Users
        are encouraged to exercise personal judgement and seek qualified professionals where needed.
      </Disclaimer>
    </SectionCard>

    {/* 6 */}
    <SectionCard>
      <SectionHeading number="6">Limitation of Liability</SectionHeading>
      <Para>SoulSathiya acts solely as a platform to facilitate introductions and compatibility insights.</Para>
      <BulletList
        items={[
          'We do not guarantee matches, relationships, or outcomes',
          'We are not responsible for user behaviour, interactions, or off-platform activities',
          'Compatibility scores and insights are algorithmic estimates and should not be solely relied upon for life decisions',
        ]}
      />
      <Para>
        To the maximum extent permitted by law, SoulSathiya disclaims liability for any direct, indirect, or
        consequential damages arising from platform use.
      </Para>
    </SectionCard>

    {/* 7 */}
    <SectionCard>
      <SectionHeading number="7">Privacy and Data Usage</SectionHeading>
      <Para>Your use of SoulSathiya is also governed by our Privacy Policy.</Para>
      <BulletList
        items={[
          'We collect and process user data to provide matchmaking and compatibility insights',
          'Sensitive psychological data is handled with strict confidentiality',
          'Users are responsible for safeguarding their account credentials',
        ]}
      />
      <TrustCallout>We do not sell your personal data to third parties — ever.</TrustCallout>
    </SectionCard>

    {/* 8 */}
    <SectionCard>
      <SectionHeading number="8">Termination</SectionHeading>
      <BulletList
        items={[
          'SoulSathiya reserves the right to suspend or terminate accounts that violate these terms',
          'Users may delete their account at any time via account settings or by contacting support',
          'Upon termination, access to paid services may be discontinued without refund (subject to applicable policy)',
        ]}
      />
    </SectionCard>

    {/* 9 */}
    <SectionCard>
      <SectionHeading number="9">Changes to Terms</SectionHeading>
      <Para>
        We may update these Terms of Service from time to time. Continued use of the platform after changes
        constitutes acceptance of the revised terms. We will notify users of significant changes via email or
        in-app notification.
      </Para>
    </SectionCard>

    {/* Contact CTA */}
    <div
      style={{
        marginTop: 40,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(212,165,32,0.12) 0%, rgba(20,31,53,0.8) 100%)',
        border: '1px solid rgba(212,165,32,0.2)',
        padding: '32px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}
    >
      <div>
        <p style={{ fontSize: 17, fontWeight: 700, color: '#F5EDD8', margin: '0 0 4px' }}>
          Have questions about these terms?
        </p>
        <p style={{ fontSize: 14, color: '#A8997A', margin: 0 }}>
          Our support team is happy to help.
        </p>
      </div>
      <a
        href="mailto:support@soulsathiya.com"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 22px',
          borderRadius: 10,
          backgroundColor: '#D4A520',
          color: '#0C1323',
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Mail style={{ width: 15, height: 15 }} />
        support@soulsathiya.com
      </a>
    </div>
  </LegalLayout>
);

/* ─────────────────────────────────────────
   PRIVACY POLICY
───────────────────────────────────────── */
export const PrivacyPolicyPage = () => (
  <LegalLayout
    title="Privacy Policy"
    subtitle="Your privacy matters deeply to us. This policy explains exactly how we collect, use, and protect your personal information."
  >
    {/* 1 */}
    <SectionCard highlight>
      <SectionHeading number="1">Introduction</SectionHeading>
      <Para>
        SoulSathiya ("we", "our", "us") is committed to protecting your privacy and ensuring the security of your
        personal information.
      </Para>
      <Para>
        This Privacy Policy explains how we collect, use, store, and protect your data when you use our platform.
        By using SoulSathiya, you agree to the practices described in this policy.
      </Para>
    </SectionCard>

    {/* 2 */}
    <SectionCard>
      <SectionHeading number="2">Information We Collect</SectionHeading>
      <Para>We collect the following categories of information:</Para>

      <SubHeading>a. Personal Information</SubHeading>
      <BulletList
        items={[
          'Name, age, gender, location',
          'Contact details (email address, phone number)',
          'Profile details (education, profession, relationship preferences)',
        ]}
      />

      <SubHeading>b. Psychological &amp; Compatibility Data</SubHeading>
      <BulletList
        items={[
          'Responses to personality assessments',
          'Compatibility inputs and relationship preferences',
          'Readiness scores and behavioural insights',
        ]}
      />
      <Para style={{ fontSize: 13.5, color: '#A8997A', fontStyle: 'italic' }}>
        This data is used exclusively to provide AI-powered matchmaking and compatibility insights.
      </Para>

      <SubHeading>c. Usage Data</SubHeading>
      <BulletList
        items={[
          'App interactions and activity',
          'Login details and device information',
          'Preferences and engagement behaviour',
        ]}
      />

      <SubHeading>d. Payment Information</SubHeading>
      <BulletList
        items={[
          'Payments are processed securely via Razorpay or authorised payment providers',
          'We do not store your full card or banking details',
        ]}
      />
    </SectionCard>

    {/* 3 */}
    <SectionCard>
      <SectionHeading number="3">How We Use Your Information</SectionHeading>
      <Para>We use your data to:</Para>
      <BulletList
        items={[
          'Create and manage your account',
          'Provide compatible match suggestions',
          'Generate compatibility reports and insights',
          'Improve platform performance and user experience',
          'Communicate important updates and service-related notifications',
          'Ensure safety, security, and fraud prevention',
        ]}
      />
    </SectionCard>

    {/* 4 */}
    <SectionCard highlight>
      <SectionHeading number="4">Psychological Data &amp; AI Usage</SectionHeading>
      <Para>
        SoulSathiya uses AI models and psychological frameworks to generate compatibility insights.
      </Para>
      <BulletList
        items={[
          'Your responses are analysed to create match suggestions, readiness scores, and reports',
          'These insights are designed for self-awareness and informed decision-making',
        ]}
      />
      <TrustCallout>
        We do not use your psychological data for advertising, and we never sell it to third parties.
      </TrustCallout>
      <Disclaimer>
        AI insights are for informational purposes only and do not constitute medical or professional
        psychological advice.
      </Disclaimer>
    </SectionCard>

    {/* 5 */}
    <SectionCard>
      <SectionHeading number="5">Data Sharing and Disclosure</SectionHeading>
      <TrustCallout>We do not sell your personal data — period.</TrustCallout>
      <Para style={{ marginTop: 16 }}>
        We may share limited data only in the following cases:
      </Para>
      <BulletList
        items={[
          'With other users (as part of your profile visibility settings)',
          'With trusted service providers (e.g., payment gateways, hosting services)',
          'If required by law or valid legal process',
          'To protect the safety, rights, or integrity of users and the platform',
        ]}
      />
    </SectionCard>

    {/* 6 */}
    <SectionCard>
      <SectionHeading number="6">Data Security</SectionHeading>
      <Para>
        We implement appropriate technical and organisational measures to protect your data, including:
      </Para>
      <BulletList
        items={[
          'Secure servers and industry-standard encryption practices',
          'Restricted access to sensitive information',
          'Regular monitoring for vulnerabilities and security audits',
        ]}
      />
      <Disclaimer>
        No system is completely secure. Users are advised to protect their login credentials and use strong, unique passwords.
      </Disclaimer>
    </SectionCard>

    {/* 7 */}
    <SectionCard>
      <SectionHeading number="7">Data Retention</SectionHeading>
      <BulletList
        items={[
          'We retain your data as long as your account is active',
          'You may request deletion of your account and associated data at any time',
          'Some data may be retained for legal, security, or compliance purposes',
        ]}
      />
    </SectionCard>

    {/* 8 */}
    <SectionCard>
      <SectionHeading number="8">Your Rights</SectionHeading>
      <Para>You have the right to:</Para>
      <BulletList
        items={[
          'Access and update your personal information',
          'Control profile visibility and match preferences',
          'Request deletion of your account',
          'Withdraw consent for certain data uses (where applicable)',
        ]}
      />
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          color: '#A8997A',
        }}
      >
        <Mail style={{ width: 14, height: 14, color: '#D4A520' }} />
        To exercise these rights, contact:{' '}
        <a
          href="mailto:support@soulsathiya.com"
          style={{ color: '#D4A520', textDecoration: 'none', fontWeight: 600 }}
        >
          support@soulsathiya.com
        </a>
      </div>
    </SectionCard>

    {/* 9 */}
    <SectionCard>
      <SectionHeading number="9">Cookies and Tracking</SectionHeading>
      <Para>We may use cookies or similar technologies to:</Para>
      <BulletList
        items={[
          'Improve user experience',
          'Analyse platform usage',
          'Remember your preferences',
        ]}
      />
      <Para>You can manage cookie preferences through your browser settings at any time.</Para>
    </SectionCard>

    {/* 10 */}
    <SectionCard>
      <SectionHeading number="10">Third-Party Services</SectionHeading>
      <Para>
        SoulSathiya may use third-party tools such as payment processors and analytics services.
        These providers operate under their own privacy policies.
        We encourage users to review their policies where applicable.
      </Para>
    </SectionCard>

    {/* 11 */}
    <SectionCard>
      <SectionHeading number="11">Changes to This Policy</SectionHeading>
      <Para>
        We may update this Privacy Policy from time to time. Continued use of the platform after changes
        indicates acceptance of the revised policy. We will notify users of significant changes via
        email or in-app notification.
      </Para>
    </SectionCard>

    {/* 12 */}
    <SectionCard>
      <SectionHeading number="12">Contact Us</SectionHeading>
      <Para>
        If you have questions or concerns about this Privacy Policy, please reach out to us:
      </Para>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        <a
          href="mailto:support@soulsathiya.com"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 15,
            color: '#D4A520',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <Mail style={{ width: 16, height: 16 }} />
          support@soulsathiya.com
        </a>
      </div>
    </SectionCard>

    {/* Bottom CTA */}
    <div
      style={{
        marginTop: 40,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(212,165,32,0.12) 0%, rgba(20,31,53,0.8) 100%)',
        border: '1px solid rgba(212,165,32,0.2)',
        padding: '32px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}
    >
      <div>
        <p style={{ fontSize: 17, fontWeight: 700, color: '#F5EDD8', margin: '0 0 4px' }}>
          Ready to find your compatible partner?
        </p>
        <p style={{ fontSize: 14, color: '#A8997A', margin: 0 }}>
          Your data is safe. Your journey starts here.
        </p>
      </div>
      <Link
        to="/register"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 22px',
          borderRadius: 10,
          backgroundColor: '#D4A520',
          color: '#0C1323',
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Build Your Profile
        <ChevronRight style={{ width: 15, height: 15 }} />
      </Link>
    </div>
  </LegalLayout>
);

/* ─────────────────────────────────────────
   ABOUT US  (kept for backward compat)
───────────────────────────────────────── */
export const AboutUsPage = () => (
  <LegalLayout title="About SoulSathiya" subtitle="Redefining relationships through understanding, psychology, and AI.">
    <SectionCard highlight>
      <SectionHeading number="✦">Our Mission</SectionHeading>
      <Para>
        SoulSathiya exists to increase the number of happy, deeply compatible marriages in India — by bringing
        psychology, behavioural science, and artificial intelligence to the world of matrimony.
      </Para>
    </SectionCard>

    <SectionCard>
      <SectionHeading number="✦">Why We're Different</SectionHeading>
      <Para>
        Traditional matrimonial platforms match people on surface-level criteria: caste, income, height. These
        factors rarely predict relationship happiness.
      </Para>
      <Para>
        SoulSathiya uses a multi-domain psychometric assessment across scientifically validated dimensions —
        including emotional style, values, trust &amp; attachment, and life expectations — to compute genuine
        compatibility scores.
      </Para>
    </SectionCard>

    <SectionCard>
      <SectionHeading number="✦">Deep Couple Compatibility Exploration</SectionHeading>
      <Para>
        When two people are mutually interested, they can unlock our deep compatibility assessment. An AI then
        generates a comprehensive report that gives both partners genuine insight into their relationship
        potential — before committing to anything.
      </Para>
    </SectionCard>

    <SectionCard>
      <SectionHeading number="✦">The Founder</SectionHeading>
      <Para>
        SoulSathiya was founded by <strong style={{ color: '#F5EDD8' }}>Rakesh Kumar Dogra</strong>, who
        believes that every person deserves a partner who truly understands and complements them. The platform
        was built with a singular focus: helping people build marriages that last a lifetime.
      </Para>
    </SectionCard>

    <div
      style={{
        marginTop: 40,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(212,165,32,0.12) 0%, rgba(20,31,53,0.8) 100%)',
        border: '1px solid rgba(212,165,32,0.2)',
        padding: '32px 36px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 700, color: '#F5EDD8', margin: '0 0 8px' }}>
        Start Your Journey
      </p>
      <p style={{ fontSize: 14, color: '#A8997A', margin: '0 0 20px' }}>
        Join thousands of thoughtful individuals finding real compatibility.
      </p>
      <Link
        to="/register"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '13px 28px',
          borderRadius: 10,
          backgroundColor: '#D4A520',
          color: '#0C1323',
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        Build Your Compatibility Profile
        <ChevronRight style={{ width: 16, height: 16 }} />
      </Link>
    </div>
  </LegalLayout>
);
