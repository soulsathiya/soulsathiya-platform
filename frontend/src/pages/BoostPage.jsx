import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, TrendingUp, Users, Clock, Check, Crown, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BoostPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [boostStatus, setBoostStatus] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/boost/plans`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/boost/status`, { withCredentials: true })
      ]);

      setPlans(plansRes.data.plans || []);
      setBoostStatus(statusRes.data);
    } catch (error) {
      console.error('Failed to fetch boost data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseBoost = async (duration) => {
    setPurchaseLoading(true);

    try {
      const orderRes = await axios.post(
        `${BACKEND_URL}/api/boost/purchase`,
        { duration },
        { withCredentials: true }
      );

      const { order } = orderRes.data;

      // Initialize Razorpay
      const options = {
        key: order.razorpay_key_id,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.razorpay_order_id,
        name: 'SoulSathiya',
        description: 'Profile Boost',
        image: window.location.origin + '/logo.png',
        handler: async (response) => {
          try {
            await axios.post(
              `${BACKEND_URL}/api/boost/verify-payment`,
              {
                boost_id: order.boost_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              },
              { withCredentials: true }
            );

            toast.success('Profile boost activated! You will now appear at the top of matches.');
            fetchData();
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com'
        },
        theme: {
          color: '#D4A520'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      if (error.response?.status === 400) {
        const detail = error?.response?.data?.detail;
        const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Failed to create boost order';
        toast.error(message);
      } else {
        toast.error('Failed to create boost order');
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Top Position",
      description: "Appear at the top of match results"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "3x More Views",
      description: "Get 3x more profile views"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Priority Visibility",
      description: "Stand out with a boost badge"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Instant Results",
      description: "See increased engagement immediately"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-2xl font-heading font-bold">Soul<span className="text-primary">Sathiya</span></span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Zap className="w-12 h-12 text-primary fill-primary" />
          </div>
          <h1 className="font-heading text-4xl lg:text-5xl mb-4">
            Boost Your Profile
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get noticed faster with a profile boost. Appear at the top of match results and get 3x more profile views.
          </p>
        </div>

        {/* Active Boost Status */}
        {boostStatus?.has_active_boost && (
          <div className="card-surface p-6 mb-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading text-xl mb-1">Boost Active!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your profile is currently boosted
                  </p>
                </div>
              </div>
              <Badge className="bg-primary text-white">
                <Crown className="w-3 h-3 mr-1" />
                Boosted
              </Badge>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="card-surface p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                {benefit.icon}
              </div>
              <h3 className="font-heading text-lg">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="mb-12">
          <h2 className="font-heading text-3xl text-center mb-8">Choose Your Boost</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`card-surface p-8 space-y-6 relative ${
                  plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="font-heading text-2xl mb-2">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start space-x-2 text-sm">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handlePurchaseBoost(plan.duration)}
                  disabled={purchaseLoading || boostStatus?.has_active_boost}
                >
                  {purchaseLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : boostStatus?.has_active_boost ? (
                    'Already Boosted'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Activate Boost
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="card-surface p-8 bg-gradient-to-r from-primary/5 to-secondary/5">
          <h2 className="font-heading text-2xl mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                1
              </div>
              <h3 className="font-heading text-lg">Choose Duration</h3>
              <p className="text-sm text-muted-foreground">
                Select how long you want your boost to last
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                2
              </div>
              <h3 className="font-heading text-lg">Complete Payment</h3>
              <p className="text-sm text-muted-foreground">
                Secure payment through Razorpay
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                3
              </div>
              <h3 className="font-heading text-lg">Get More Matches</h3>
              <p className="text-sm text-muted-foreground">
                Instantly appear at the top and get noticed
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Razorpay script loaded via public/index.html */}
    </div>
  );
};

export default BoostPage;
