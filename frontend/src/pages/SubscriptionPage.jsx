import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Pricing data (mirrors LandingPage exactly) ─────────────────────────────
const PREMIUM_TIERS = [
  { key: '1mo', period: '1 month',  price: 999,   strike: 1999,  label: null          },
  { key: '3mo', period: '3 months', price: 2499,  strike: 3999,  label: 'Most Chosen' },
  { key: '6mo', period: '6 months', price: 4999,  strike: 7999,  label: 'Best Value'  },
];
const ELITE_TIERS = [
  { key: '1mo', period: '1 month',  price: 2499,  strike: null,  label: null          },
  { key: '3mo', period: '3 months', price: 6999,  strike: null,  label: 'Best Value'  },
  { key: '6mo', period: '6 months', price: 12999, strike: null,  label: 'Best Savings'},
];

// ── Shared mini-components ─────────────────────────────────────────────────
function PlanBadge({ children, variant = 'gold' }) {
  const styles = {
    gold:   'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black',
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white',
    new:    'bg-gradient-to-r from-emerald-500 to-teal-400 text-white',
  };
  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold tracking-wide shadow ${styles[variant]}`}>
      {children}
    </span>
  );
}

function PeriodToggle({ tiers, selected, onChange }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/20 p-0.5 gap-0.5">
      {tiers.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`
            relative flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
            ${selected === t.key
              ? 'bg-yellow-500 text-black shadow'
              : 'text-white/60 hover:text-white/90'}
          `}
        >
          {t.period.split(' ')[0]}&nbsp;mo
          {t.label && selected !== t.key && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
              {t.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function FeatureRow({ text }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Check className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
      <span className="text-white/75 leading-snug">{text}</span>
    </li>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [paying, setPaying]             = useState(null);   // 'premium' | 'elite' | null
  const [premiumKey, setPremiumKey]     = useState('3mo');
  const [eliteKey, setEliteKey]         = useState('3mo');

  const premiumTier = PREMIUM_TIERS.find(t => t.key === premiumKey);
  const eliteTier   = ELITE_TIERS.find(t => t.key === eliteKey);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true })
      .then(r => setCurrentUser(r.data))
      .catch(e => { if (e.response?.status === 401) navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubscribe = async (tier, price, periodLabel) => {
    if (currentUser?.subscription_tier === tier) {
      toast.info('You are already on this plan');
      return;
    }
    setPaying(tier);
    try {
      const orderRes = await axios.post(
        `${BACKEND_URL}/api/subscription/create-order`,
        { tier },
        { withCredentials: true }
      );
      const { order } = orderRes.data;

      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page.');
        return;
      }

      const options = {
        key:       order.razorpay_key_id || order.key_id,
        amount:    price * 100,
        currency:  'INR',
        order_id:  order.razorpay_order_id || order.id,
        name:      'SoulSathiya',
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan — ${periodLabel}`,
        image:     window.location.origin + '/logo.png',
        handler: async (response) => {
          try {
            await axios.post(
              `${BACKEND_URL}/api/subscription/verify-payment`,
              {
                razorpay_payment_id:  response.razorpay_payment_id,
                razorpay_order_id:    response.razorpay_order_id,
                razorpay_signature:   response.razorpay_signature,
                tier,
              },
              { withCredentials: true }
            );
            toast.success(`Welcome to ${tier.charAt(0).toUpperCase() + tier.slice(1)}! Your subscription is now active.`);
            navigate('/dashboard');
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: currentUser?.full_name, email: currentUser?.email },
        theme:   { color: '#D4A520' },
      };

      new window.Razorpay(options).open();
    } catch (error) {
      const rawDetail = error?.response?.data?.detail;
      const detail = (Array.isArray(rawDetail) ? rawDetail[0]?.msg : rawDetail) || error?.message || 'Failed to initiate payment';
      toast.error(detail);
    } finally {
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const currentTier = currentUser?.subscription_tier || 'free';

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/8 sticky top-0 z-50 bg-background/90 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-xl font-heading font-bold text-foreground">
              Soul<span className="text-primary">Sathiya</span>
            </span>
          </Link>
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="text-center pt-16 pb-10 px-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
          <Sparkles className="w-4 h-4" />
          Transparent Pricing
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-3">
          Choose Your <span className="text-primary">Journey</span>
        </h1>
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide mb-4">
          ⚡ Founding Member Pricing — Limited Time
        </div>
        {currentTier !== 'free' && (
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 border border-green-700/40 px-4 py-2 rounded-full text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Current Plan: <span className="capitalize font-bold">{currentTier}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Cards grid ────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-6xl pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">

          {/* ── Free ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-white/8 bg-[#0F1A2E] p-6 gap-5">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Free</p>
              <h3 className="font-heading text-xl font-bold text-white">Start Free</h3>
              <p className="text-xs text-white/50 leading-snug">Start Your Compatibility Journey</p>
            </div>
            <div>
              <span className="text-4xl font-extrabold text-white">₹0</span>
              <span className="text-white/40 text-sm ml-1">forever</span>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                'Create your personality profile',
                '10 curated matches / month',
                '3 interests per month',
                'Basic compatibility insights',
                'Browse verified profiles',
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                  <span className="text-white/55 leading-snug">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 rounded-xl border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-sm font-semibold transition-all duration-200"
            >
              {currentTier === 'free' ? '✓ Your Current Plan' : 'Continue Free'}
            </button>
          </div>

          {/* ── Premium ──────────────────────────────────────────────────── */}
          <div
            className="flex flex-col rounded-2xl p-6 gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl xl:scale-105 xl:-translate-y-1"
            style={{
              background:  'linear-gradient(155deg, #1a2a1a 0%, #0F1A2E 60%)',
              border:      '1.5px solid rgba(212,175,55,0.55)',
              boxShadow:   '0 0 40px rgba(212,175,55,0.12), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge variant="gold">⭐ Most Popular</PlanBadge>
              {currentTier === 'premium' && (
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-yellow-400/60 uppercase tracking-widest">Premium</p>
              <h3 className="font-heading text-xl font-bold text-white">Find Your Match</h3>
              <p className="text-xs text-white/50 leading-snug">Unlock deeper compatibility & real connections</p>
            </div>
            <PeriodToggle tiers={PREMIUM_TIERS} selected={premiumKey} onChange={setPremiumKey} />
            <div>
              {premiumTier.strike && (
                <p className="text-xs text-white/35 line-through mb-0.5">
                  ₹{premiumTier.strike.toLocaleString('en-IN')}
                </p>
              )}
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-yellow-400">
                  ₹{premiumTier.price.toLocaleString('en-IN')}
                </span>
                <span className="text-white/40 text-sm">/ {premiumTier.period}</span>
              </div>
              {premiumTier.label && (
                <span className="inline-block mt-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded-full">
                  {premiumTier.label}
                </span>
              )}
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                'Unlimited profile views & interests',
                'Advanced compatibility filters',
                'See who viewed your profile',
                'Priority customer support',
                'Deep Compatibility Report (add-on)',
                'Weekly curated match digest',
              ].map(f => <FeatureRow key={f} text={f} />)}
            </ul>
            <button
              onClick={() => handleSubscribe('premium', premiumTier.price, premiumTier.period)}
              disabled={paying === 'premium' || currentTier === 'premium'}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC5A)', color: '#000' }}
            >
              {paying === 'premium'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : currentTier === 'premium'
                ? '✓ Current Plan'
                : 'Find Your Compatible Partner →'}
            </button>
          </div>

          {/* ── Elite ────────────────────────────────────────────────────── */}
          <div
            className="flex flex-col rounded-2xl border border-purple-500/30 bg-[#0F1A2E] p-6 gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            style={{ boxShadow: '0 0 24px rgba(139,92,246,0.08)' }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge variant="purple">💎 Most Comprehensive</PlanBadge>
              {currentTier === 'elite' && (
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-purple-400/60 uppercase tracking-widest">Elite</p>
              <h3 className="font-heading text-xl font-bold text-white">Elite Matchmaking</h3>
              <p className="text-xs text-white/50 leading-snug">For serious seekers of a lifelong partner</p>
            </div>
            <PeriodToggle tiers={ELITE_TIERS} selected={eliteKey} onChange={setEliteKey} />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-purple-400">
                  ₹{eliteTier.price.toLocaleString('en-IN')}
                </span>
                <span className="text-white/40 text-sm">/ {eliteTier.period}</span>
              </div>
              {eliteTier.label && (
                <span className="inline-block mt-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-full">
                  {eliteTier.label}
                </span>
              )}
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                'Everything in Premium',
                'Weekly profile boost included',
                'Dedicated relationship manager',
                'Verified priority placement',
                'Exclusive high-intent matches',
                'Unlimited Compatibility Reports',
                'Video call introduction service',
              ].map(f => <FeatureRow key={f} text={f} />)}
            </ul>
            <button
              onClick={() => handleSubscribe('elite', eliteTier.price, eliteTier.period)}
              disabled={paying === 'elite' || currentTier === 'elite'}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paying === 'elite'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : currentTier === 'elite'
                ? '✓ Current Plan'
                : 'Get Premium Matchmaking Experience →'}
            </button>
          </div>

          {/* ── Couple Report ─────────────────────────────────────────────── */}
          <div
            className="flex flex-col rounded-2xl border border-teal-500/30 bg-[#0F1A2E] p-6 gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            style={{ boxShadow: '0 0 24px rgba(20,184,166,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <PlanBadge variant="new">✨ NEW</PlanBadge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-teal-400/60 uppercase tracking-widest">Couple Report</p>
              <h3 className="font-heading text-xl font-bold text-white">Relationship Deep-Dive</h3>
              <p className="text-xs text-white/50 leading-snug">Understand your relationship at a deeper level</p>
            </div>
            <div>
              <p className="text-xs text-white/35 mb-0.5">One-time per couple</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-teal-400">₹999</span>
              </div>
              <span className="inline-block mt-1 text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 rounded-full">
                No subscription needed
              </span>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                'Psychological compatibility analysis',
                'Relationship strengths & blind spots',
                'Communication style insights',
                'Conflict resolution patterns',
                'Long-term relationship potential score',
                'Personalised guidance & next steps',
              ].map(f => <FeatureRow key={f} text={f} />)}
            </ul>
            <button
              onClick={() => navigate('/matches')}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25"
            >
              Get Your Relationship Report →
            </button>
          </div>

        </div>

        {/* ── Microcopy ───────────────────────────────────────────────────── */}
        <p className="text-center text-sm text-white/35 mt-10">
          Start free. Upgrade when you're ready to take your journey seriously.
        </p>

        {/* ── Trust bar ───────────────────────────────────────────────────── */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-500" /> SSL Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" /> Cancel Anytime
          </span>
          <span className="flex items-center gap-1.5">
            <img src="/logo.png" alt="" className="w-4 h-4 object-contain" draggable={false} /> 24/7 Support
          </span>
          <span className="flex items-center gap-1.5 text-white/35">
            Powered by Razorpay · All major cards, UPI, Net Banking accepted
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
