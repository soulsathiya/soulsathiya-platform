import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Users, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const features = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "AI-Powered Compatibility",
      description: "Advanced psychometric matching for deeper connections"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verified Profiles",
      description: "KYC verified members for trust and authenticity"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Gated Communities",
      description: "Connect within your professional and cultural circles"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Privacy First",
      description: "Control your photo visibility and personal information"
    }
  ];

  const subscriptionPlans = [
    {
      tier: "Free",
      price: "₹0",
      features: [
        "Create profile",
        "View up to 10 matches",
        "Send 3 interests per month",
        "Basic filters"
      ]
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
        "Priority customer support"
      ]
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
        "Exclusive events access"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <span className="text-2xl font-heading font-bold text-foreground">SoulSathiya</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" data-testid="header-login-btn">Login</Button>
            </Link>
            <Link to="/register">
              <Button data-testid="header-register-btn">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="font-heading text-5xl lg:text-6xl leading-tight text-foreground">
                Find Your <span className="text-primary">Soulmate</span> Through Deep Compatibility
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                SoulSathiya uses advanced psychometric assessment and AI-powered matching to help you find a lifelong partner who truly understands you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="hero-get-started-btn">
                    Start Your Journey
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="hero-login-btn">
                    Already a Member?
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/30902344/pexels-photo-30902344.jpeg"
                alt="Happy couple"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl mb-4">Why Choose SoulSathiya?</h2>
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
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl mb-4">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade when you're ready to accelerate your journey
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan, index) => (
              <div
                key={index}
                className={`card-surface p-8 space-y-6 relative ${
                  plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : ''
                }`}
                data-testid={`pricing-card-${plan.tier.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="font-heading text-2xl mb-2">{plan.tier}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start space-x-2 text-sm">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
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

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-4xl text-white mb-6">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of Indians who found their life partners through deep compatibility
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="shadow-lg" data-testid="cta-register-btn">
              Create Your Free Profile
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-6 h-6 fill-primary text-primary" />
                <span className="text-xl font-heading font-bold">SoulSathiya</span>
              </div>
              <p className="text-gray-400 text-sm">
                Finding soulmates through deep compatibility and trust
              </p>
            </div>
            <div>
              <h4 className="font-heading text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Tips</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 SoulSathiya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
