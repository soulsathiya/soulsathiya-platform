import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Shared mini-components ─────────────────────────────────────────────────
function FeatureRow({ text, muted }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${muted ? 'text-white/30' : 'text-yellow-400'}`} />
      <span className={`leading-snug ${muted ? 'text-white/55' : 'text-white/75'}`}>{text}</span>
    </li>
  );
}

function PlanBadge({ children, variant = 'gold' }) {
  const styles = {
    gold:   'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black',
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white',
  };
  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold tracking-wide shadow ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [paying, setPaying]           = useState(null);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true })
      .then(r => setCurrentUser(r.data))
      .catch(e => { if (e.response?.status === 401) navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubscribe = async (tier, price) => {
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
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
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
            &larr; Back to Dashboard
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
        <p className="text-muted-foreground max-w-lg mx-auto">
          Three simple plans. No hidden fees. Upgrade or downgrade anytime.
        </p>
        {currentTier !== 'free' && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 border border-green-700/40 px-4 py-2 rounded-full text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Current Plan: <span className="capitalize font-bold">{currentTier}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Cards grid (3 columns) ──────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-5xl pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* ════════════════════════════════════════════════════════════════
              FREE
             ════════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col rounded-2xl border border-white/8 bg-[#0F1A2E] p-6 gap-5">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Free</p>
              <h3 className="font-heading text-xl font-bold text-white">Start Free</h3>
              <p className="text-xs text-white/50 leading-snug">Begin your compatibility journey</p>
            </div>
            <div>
              <span className="text-4xl font-extrabold text-white">&#8377;0</span>
              <span className="text-white/40 text-sm ml-1">forever</span>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                'Create your personality profile',
                '10 curated matches / month',
                '3 interests per month',
                'Basic compatibility insights',
                'Browse verified profiles',
              ].map(f => <FeatureRow key={f} text={f} muted />)}
            </ul>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 rounded-xl border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-sm font-semibold transition-all duration-200"
            >
              {currentTier === 'free' ? '&#10003; Your Current Plan' : 'Continue Free'}
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              PREMIUM — ₹2,499
             ════════════════════════════════════════════════════════════════ */}
          <div
            className="flex flex-col rounded-2xl p-6 gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:scale-[1.04]"
            style={{
              background:  'linear-gradient(155deg, #1a2a1a 0%, #0F1A2E 60%)',
              border:      '1.5px solid rgba(212,175,55,0.55)',
              boxShadow:   '0 0 40px rgba(212,175,55,0.12), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge variant="gold">&#11088; Most Popular</PlanBadge>
              {currentTier === 'premium' && (
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-yellow-400/60 uppercase tracking-widest">Premium</p>
              <h3 className="font-heading text-xl font-bold text-white">Find Your Match</h3>
              <p className="text-xs text-white/50 leading-snug">For active seekers</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-yellow-400">&#8377;2,499</span>
                <span className="text-white/40 text-sm">/ month</span>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                '40 interests / month',
                'See who viewed your profile',
                'Weekly curated match digest',
                'Advanced compatibility filters',
                'Priority customer support',
                'One Compatibility Intelligence Report / month (add-on)',
              ].map(f => <FeatureRow key={f} text={f} />)}
            </ul>
            <button
              onClick={() => handleSubscribe('premium', 2499)}
              disabled={paying === 'premium' || currentTier === 'premium'}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC5A)', color: '#000' }}
            >
              {paying === 'premium'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : currentTier === 'premium'
                ? '&#10003; Current Plan'
                : 'Upgrade to Premium \u2192'}
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              ELITE — ₹6,999
             ════════════════════════════════════════════════════════════════ */}
          <div
            className="flex flex-col rounded-2xl border border-purple-500/30 bg-[#0F1A2E] p-6 gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            style={{ boxShadow: '0 0 24px rgba(139,92,246,0.08)' }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge variant="purple">&#128142; Most Comprehensive</PlanBadge>
              {currentTier === 'elite' && (
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-purple-400/60 uppercase tracking-widest">Elite</p>
              <h3 className="font-heading text-xl font-bold text-white">Elite Matchmaking</h3>
              <p className="text-xs text-white/50 leading-snug">For serious marriage intent</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-purple-400">&#8377;6,999</span>
                <span className="text-white/40 text-sm">/ month</span>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                'Unlimited interests',
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
              onClick={() => handleSubscribe('elite', 6999)}
              disabled={paying === 'elite' || currentTier === 'elite'}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paying === 'elite'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : currentTier === 'elite'
                ? '&#10003; Current Plan'
                : 'Go Elite \u2192'}
            </button>
          </div>

        </div>

        {/* ── Microcopy ───────────────────────────────────────────────────── */}
        <p className="text-center text-sm text-white/35 mt-10">
          Start free. Upgrade when you&apos;re ready to take your journey seriously.
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
            Powered by Razorpay &middot; All major cards, UPI, Net Banking accepted
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
