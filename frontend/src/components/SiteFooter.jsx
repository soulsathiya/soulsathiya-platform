import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Instagram, Twitter, Youtube } from 'lucide-react';

// ─── Brand Logo ────────────────────────────────────────────────────────────────
const SoulSathiyaLogo = ({ className = 'w-8 h-8' }) => (
  <img
    src="/logo.png"
    alt="SoulSathiya"
    className={`${className} object-contain`}
    draggable={false}
  />
);

// ─── Config ────────────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  {
    icon:  Linkedin,
    href:  'https://linkedin.com/company/soulsathiya',
    label: 'LinkedIn',
  },
  {
    icon:  Instagram,
    href:  'https://instagram.com/soulsathiya',
    label: 'Instagram',
  },
  {
    icon:  Twitter,
    href:  'https://twitter.com/soulsathiya',
    label: 'Twitter / X',
  },
  {
    icon:  Youtube,
    href:  'https://youtube.com/@soulsathiya',
    label: 'YouTube',
  },
];

const FOOTER_COLS = [
  {
    heading: 'Company',
    links: [
      { label: 'About Us',         internal: true,  to:   '/about'                             },
      { label: 'How It Works',     internal: true,  to:   '/how-it-works'                      },
      { label: 'Success Stories',  internal: false, href: '#testimonials'                      },
      { label: 'Pricing / Plans',  internal: true,  to:   '/subscription'                      },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', internal: false, href: 'mailto:support@soulsathiya.com' },
      { label: 'Safety Tips', internal: true,  to:   '/terms'                         },
      { label: 'Contact Us',  internal: false, href: 'mailto:hello@soulsathiya.com'   },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',   internal: true, to: '/privacy' },
      { label: 'Terms of Service', internal: true, to: '/terms'   },
      { label: 'Cookie Policy',    internal: true, to: '/privacy' },
    ],
  },
];

// ─── Link Item ─────────────────────────────────────────────────────────────────
const FooterLink = ({ link }) => {
  const cls = 'text-sm text-muted-foreground hover:text-primary transition-colors duration-200';

  if (link.internal) {
    return (
      <Link to={link.to} className={cls}>
        {link.label}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      className={cls}
      target={link.href.startsWith('http') ? '_blank' : undefined}
      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {link.label}
    </a>
  );
};

// ─── SiteFooter ───────────────────────────────────────────────────────────────
const SiteFooter = () => (
  <footer className="bg-background border-t border-primary/10 pt-14 pb-8 px-6">
    <div className="container mx-auto max-w-6xl">

      {/* ── Top Grid: brand + 3 columns ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">

        {/* Brand column */}
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center space-x-2.5 mb-4">
            <SoulSathiyaLogo className="w-8 h-8" />
            <span className="text-xl font-heading font-bold text-foreground">
              Soul<span className="text-primary">Sathiya</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            India's First AI-Powered Relationship Intelligence Platform
          </p>
          <p className="text-xs text-muted-foreground/45 tracking-[0.25em] uppercase">
            Compatibility&nbsp;•&nbsp;Connection&nbsp;•&nbsp;Commitment
          </p>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map(col => (
          <div key={col.heading}>
            <h4 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider mb-5">
              {col.heading}
            </h4>
            <ul className="space-y-3">
              {col.links.map(link => (
                <li key={link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom Bar: copyright + social ───────────────────────────── */}
      <div className="border-t border-primary/10 pt-8">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-5">

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/50">
            © 2026 SoulSathiya. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-9 h-9 rounded-full
                  border border-border/50
                  flex items-center justify-center
                  text-muted-foreground/60
                  hover:text-primary hover:border-primary/40 hover:bg-primary/5
                  transition-all duration-200
                "
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  </footer>
);

export default SiteFooter;
