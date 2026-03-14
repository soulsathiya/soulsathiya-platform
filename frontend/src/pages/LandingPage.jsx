import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Sparkles, Check, ArrowRight, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Brand logo mark — real 3D gold "S" image ────────────────────────────────
const SoulSathiyaLogo = ({ className = 'w-9 h-9' }) => (
  <img
    src="/logo.png"
    alt="SoulSathiya"
    className={`${className} object-contain`}
    draggable={false}
  />
);

// ─── Page component ───────────────────────────────────────────────────────────
const LandingPage = () => {
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Compatibility",
      description: "Advanced psychometric matching for deeper, lasting connections",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verified Profiles",
      description: "KYC-verified members for trust and authentic relationships",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Gated Communities",
      description: "Connect within your professional and cultural circles",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Privacy First",
      description: "Control photo visibility and personal information with ease",
    },
  ];

  const subscriptionPlans = [
    {
      tier: "Free",
      price: "₹0",
      features: [
        "Create profile",
        "View up to 10 matches",
        "Send 3 interests per month",
        "Basic filters",
      ],
    },
    {
      tier: "Premium",
      price: "₹1,999",
      period: "/ month",
      popular: true,
      features: [
        "Unlimited profile views",
        "Unlimited interests",
        "Advanced compatibility filters",
        "See who viewed your profile",
        "Priority customer support",
        "Deep Couple Compatibility (₹999/pair add-on)",
      ],
    },
    {
      tier: "Elite",
      price: "₹4,999",
      period: "/ month",
      features: [
        "All Premium features",
        "Profile boost",
        "Dedicated relationship manager",
        "Verified badge priority",
        "Exclusive events access",
        "Unlimited Deep Couple Compatibility Exploration",
      ],
      badge: "Most Comprehensive",
    },
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
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium tracking-wide">
                <Sparkles className="w-4 h-4" />
                India's First Relationship Intelligence Platform
              </div>

              <h1 className="font-heading leading-tight text-foreground">
                Find Your{' '}
                <span className="text-gold-gradient">Soulmate</span>
                <br />
                Through Deep
                <br />
                Compatibility
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                SoulSathiya uses advanced psychometric assessment and AI-powered matching
                to help you find a lifelong partner who truly understands you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 font-semibold"
                    data-testid="hero-get-started-btn"
                  >
                    Start Your Journey
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
                    Already a Member?
                  </Button>
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-8 pt-2">
                {[['10,000+', 'Members'], ['92%', 'Match Rate'], ['500+', 'Weddings']].map(([num, label]) => (
                  <div key={label}>
                    <p className="text-2xl font-heading font-bold text-primary">{num}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative" style={{ minHeight: '320px', aspectRatio: '4 / 3' }}>
              {/* Ambient glow behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-secondary/15 rounded-3xl blur-2xl scale-95 opacity-70" />
              <img
                src="/hero-mandala.jpg"
                alt="Couple before golden mandala — SoulSathiya"
                className="relative rounded-3xl shadow-2xl shadow-primary/20 w-full h-full object-cover border border-primary/15"
                loading="eager"
              />
              {/* Floating compatibility badge */}
              <div className="absolute -bottom-4 -left-4 glass-card px-5 py-3 rounded-xl border border-primary/20">
                <p className="text-xs text-muted-foreground">Average compatibility</p>
                <p className="text-2xl font-heading font-bold text-primary">89%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Motif Bar ───────────────────────────────────────────────── */}
      <div className="py-5 px-6 border-y border-primary/15 bg-card/60">
        <div className="container mx-auto max-w-3xl">
          <p className="text-center font-heading text-sm sm:text-base tracking-[0.35em] text-primary/80 uppercase select-none">
            Compatibility &nbsp;•&nbsp; Connection &nbsp;•&nbsp; Commitment
          </p>
        </div>
      </div>

      {/* ── Features Section ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-card/40">
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
                className="card-surface p-6 space-y-4 text-center"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 mx-auto bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-background">
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
                className={`card-surface p-8 space-y-6 relative ${
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

      {/* ── Deep Exploration Feature ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-card/40" id="deep-exploration">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Premium Feature</span>
              </div>
              <h2 className="font-heading text-4xl text-foreground">
                Deep Couple Compatibility Exploration
              </h2>
              <p className="text-lg text-muted-foreground">
                Go beyond surface-level compatibility with our comprehensive 108-question deep assessment.
                Discover how you and your match align on critical relationship dimensions.
              </p>
              <ul className="space-y-3">
                {[
                  'Expectations & Roles Assessment',
                  'Conflict Resolution Styles',
                  'Attachment & Trust Patterns',
                  'Lifestyle Integration Compatibility',
                  'Intimacy & Communication Analysis',
                  'Family & In-Law Dynamics',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/deep/demo-report">
                  <Button variant="outline" size="lg" className="border-primary/40 hover:bg-primary/10 hover:border-primary" data-testid="view-sample-report-btn">
                    <Sparkles className="w-5 h-5 mr-2" />
                    View Sample Report
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" data-testid="deep-get-started-btn">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Score card */}
            <div className="relative">
              <div className="card-surface p-8 space-y-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
                    <span className="text-2xl font-bold text-primary-foreground">87%</span>
                  </div>
                  <h3 className="font-heading text-xl text-foreground">Sample Deep Score</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Emotional Alignment', value: 92 },
                    { label: 'Life Goals', value: 88 },
                    { label: 'Communication', value: 85 },
                    { label: 'Values Match', value: 82 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-background" id="testimonials">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl mb-4 text-foreground">Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Thousands of couples have found their perfect match through SoulSathiya
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                names: "Priya & Arjun",
                location: "Mumbai & Bangalore",
                compat: "91%",
                quote: "We were matched at 91% compatibility. SoulSathiya understood us better than we understood ourselves. Our Deep Exploration report predicted our communication style perfectly.",
                photo: "https://images.pexels.com/photos/10987899/pexels-photo-10987899.jpeg",
              },
              {
                names: "Meera & Vikram",
                location: "Delhi & Hyderabad",
                compat: "87%",
                quote: "The psychometric assessment felt like it was reading my mind. When I saw our Deep Compatibility report, I knew Vikram was different. We got engaged last month.",
                photo: "https://images.pexels.com/photos/32161001/pexels-photo-32161001.jpeg",
              },
              {
                names: "Ananya & Rahul",
                location: "Pune & Chennai",
                compat: "89%",
                quote: "I was skeptical about matrimonial sites. But SoulSathiya's approach is completely different — no superficial filters, just genuine compatibility. We just completed our wedding.",
                photo: "https://images.pexels.com/photos/36079282/pexels-photo-36079282.jpeg",
              },
            ].map((story, i) => (
              <div key={i} className="card-surface p-8 space-y-4" data-testid={`testimonial-${i}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl font-bold text-primary">{story.compat}</span>
                  <span className="text-sm text-muted-foreground">compatibility</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed italic">"{story.quote}"</p>
                <div className="flex items-center space-x-3 pt-2">
                  <div className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden">
                    <img src={story.photo} alt={story.names} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm text-foreground">{story.names}</p>
                    <p className="text-xs text-muted-foreground">{story.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 text-muted-foreground text-sm">
            <p>Join over <strong className="text-primary">10,000+</strong> members who have found meaningful connections</p>
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
            Join thousands of Indians who found their life partners through deep compatibility
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 font-semibold mt-2"
              data-testid="cta-register-btn"
            >
              Create Your Free Profile
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
