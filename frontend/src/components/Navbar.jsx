import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X, Linkedin, Instagram, Twitter, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Social Links (shared config) ─────────────────────────────────────────────
const SOCIAL_LINKS = [
  { icon: Linkedin, href: 'https://linkedin.com/company/soulsathiya', label: 'LinkedIn'   },
  { icon: Instagram, href: 'https://instagram.com/soulsathiya',       label: 'Instagram'  },
  { icon: Twitter,  href: 'https://twitter.com/soulsathiya',          label: 'Twitter/X'  },
  { icon: Youtube,  href: 'https://youtube.com/@soulsathiya',         label: 'YouTube'    },
];

// ─── Brand Logo ────────────────────────────────────────────────────────────────
const SoulSathiyaLogo = ({ className = 'w-9 h-9' }) => (
  <img
    src="/logo.png"
    alt="SoulSathiya"
    className={`${className} object-contain`}
    draggable={false}
  />
);

// ─── Nav Links Config ──────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'About',        to: '/about'         },
];

// ─── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const location    = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-card border-b border-border/50 backdrop-blur-md shadow-lg shadow-black/20'
          : 'glass-card border-b border-border/30 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link
          to="/"
          className="flex items-center space-x-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          <SoulSathiyaLogo className="w-9 h-9 transition-transform duration-200 group-hover:scale-105" />
          <span className="text-xl font-heading font-bold text-foreground">
            Soul<span className="text-primary">Sathiya</span>
          </span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {NAV_LINKS.map(({ label, to }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative py-1 transition-colors duration-200 ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                {/* Active underline accent */}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Desktop CTA ── */}
        <div className="hidden md:flex items-center gap-2">

          {/* Social Icons */}
          <div className="flex items-center gap-1.5 mr-1">
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-8 h-8 rounded-full
                  bg-white/8 border border-white/20
                  flex items-center justify-center
                  text-white/75
                  hover:bg-white/15 hover:border-white/40 hover:text-white hover:scale-110
                  transition-all duration-200
                "
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border/50 mx-1" />

          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-white/5 font-medium"
            >
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button
              size="sm"
              className="btn-primary px-5 shadow-lg shadow-primary/20 font-semibold"
            >
              Build Your Profile
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          className="md:hidden text-foreground p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-t border-border/40 px-6 py-5 space-y-1">
          {NAV_LINKS.map(({ label, to }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`block text-base font-medium py-3 border-b border-border/20 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="pt-3 space-y-3">
            <Link to="/login" className="block text-base text-muted-foreground hover:text-foreground py-1 transition-colors">
              Login
            </Link>
            <Link to="/register" className="block">
              <Button size="sm" className="btn-primary w-full font-semibold">
                Build Your Profile
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>

            {/* Mobile Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    w-9 h-9 rounded-full
                    bg-white/10 border border-white/25
                    flex items-center justify-center
                    text-white/80
                    hover:bg-white/20 hover:text-white
                    transition-all duration-200
                  "
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
