import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Crown, Check, Loader2, Zap, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PLAN_HIGHLIGHTS = {
  basic: { color: 'border-gray-200', badge: '', icon: <Star className="w-6 h-6 text-gray-500" /> },
  premium: { color: 'border-primary ring-2 ring-primary shadow-xl', badge: 'Most Popular', icon: <Crown className="w-6 h-6 text-primary" /> },
  elite: { color: 'border-amber-400 ring-2 ring-amber-400 shadow-xl', badge: 'Most Comprehensive', icon: <Zap className="w-6 h-6 text-amber-500" /> },
};

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, plansRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BACKEND_URL}/api/subscription/plans`, { withCredentials: true }),
        ]);
        setCurrentUser(meRes.data);
        setPlans(plansRes.data.plans || []);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        else toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleSubscribe = async (plan) => {
    if (currentUser?.subscription_tier === plan.tier) {
      toast.info('You are already on this plan');
      return;
    }
    setPaying(plan.tier);
    try {
      // Create Razorpay order
      const orderRes = await axios.post(
        `${BACKEND_URL}/api/subscription/create-order`,
        { tier: plan.tier },
        { withCredentials: true }
      );
      const { order } = orderRes.data;

      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page.');
        return;
      }

      const options = {
        key: order.razorpay_key_id || order.key_id,
        amount: plan.price * 100,
        currency: plan.currency || 'INR',
        order_id: order.razorpay_order_id || order.id,
        name: 'SoulSathiya',
        description: `${plan.name} Subscription — 1 Month`,
        image: 'https://via.placeholder.com/100',
        handler: async (response) => {
          try {
            await axios.post(
              `${BACKEND_URL}/api/subscription/verify-payment`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                tier: plan.tier,
              },
              { withCredentials: true }
            );
            toast.success(`Welcome to ${plan.name}! Your subscription is now active.`);
            navigate('/dashboard');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: currentUser?.full_name, email: currentUser?.email },
        theme: { color: '#E65100' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      const rawDetail = error?.response?.data?.detail;
      const detail = (Array.isArray(rawDetail) ? rawDetail[0]?.msg : rawDetail) || error?.message || 'Failed to initiate payment';
      toast.error(detail);
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <span className="text-2xl font-heading font-bold">SoulSathiya</span>
          </Link>
          <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Unlock Your Full Potential</span>
          </div>
          <h1 className="font-heading text-5xl mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade whenever you're ready. Every plan helps you get closer to finding your soulmate.
          </p>
          {currentUser?.subscription_tier && currentUser.subscription_tier !== 'free' && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">Current Plan: {currentUser.subscription_tier}</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const highlight = PLAN_HIGHLIGHTS[plan.tier] || PLAN_HIGHLIGHTS.basic;
            const isCurrent = currentUser?.subscription_tier === plan.tier;
            return (
              <div key={plan.tier} className={`relative bg-white rounded-2xl border p-8 space-y-6 ${highlight.color}`} data-testid={`plan-card-${plan.tier}`}>
                {highlight.badge && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-medium ${plan.tier === 'elite' ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-primary'}`}>
                    {highlight.badge}
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  {highlight.icon}
                  <h3 className="font-heading text-2xl">{plan.name}</h3>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-bold">₹{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">/ month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Deep Exploration: {plan.deep_exploration}</p>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.tier === 'premium' ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan)}
                  disabled={paying === plan.tier || isCurrent}
                  data-testid={`subscribe-${plan.tier}-btn`}
                >
                  {paying === plan.tier ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : isCurrent ? (
                    <><ShieldCheck className="w-4 h-4 mr-2" /> Current Plan</>
                  ) : (
                    <>Get {plan.name} <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Trust Section */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 text-center">
          <h3 className="font-heading text-2xl mb-2">100% Secure Payment</h3>
          <p className="text-muted-foreground mb-4">Powered by Razorpay · All major cards, UPI, Net Banking accepted</p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-green-500" /> SSL Encrypted</span>
            <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-green-500" /> Cancel Anytime</span>
            <span className="flex items-center"><Heart className="w-4 h-4 mr-1 text-primary" /> 24/7 Support</span>
          </div>
        </div>
      </main>

      <script src="https://checkout.razorpay.com/v1/checkout.js" />
    </div>
  );
};

export default SubscriptionPage;
