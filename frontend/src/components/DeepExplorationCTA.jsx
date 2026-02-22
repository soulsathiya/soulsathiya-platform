import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lock, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DeepExplorationCTA = ({ partnerId, userTier = 'free', compact = false, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    checkStatus();
  }, [partnerId]);

  const checkStatus = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/deep/status/${partnerId}`,
        { withCredentials: true }
      );
      setStatus(response.data);
      if (onStatusChange) onStatusChange(response.data);
    } catch (error) {
      console.error('Failed to check deep status:', error);
    }
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Create Razorpay order
      const options = {
        key: 'rzp_test_placeholder',
        amount: 99900, // ₹999 in paise
        currency: 'INR',
        name: 'SoulSathiya',
        description: 'Deep Couple Compatibility Exploration',
        handler: async (response) => {
          try {
            await axios.post(
              `${BACKEND_URL}/api/deep/unlock-paid/${partnerId}`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              },
              { withCredentials: true }
            );

            toast.success('Deep Exploration unlocked! Start the questionnaire.');
            checkStatus();
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com'
        },
        theme: {
          color: '#E65100'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setLoading(true);

    try {
      if (userTier === 'elite') {
        await axios.post(
          `${BACKEND_URL}/api/deep/unlock/${partnerId}`,
          {},
          { withCredentials: true }
        );
        toast.success('Deep Exploration unlocked! Start the questionnaire.');
        checkStatus();
      } else if (userTier === 'premium') {
        handlePayment();
      } else {
        toast.error('Please upgrade to Premium or Elite to access Deep Exploration');
        setTimeout(() => window.location.href = '/subscription', 1500);
      }
    } catch (error) {
      if (error.response?.status === 402) {
        handlePayment();
      } else if (error.response?.status === 403) {
        toast.error('Please upgrade to access this feature');
        setTimeout(() => window.location.href = '/subscription', 1500);
      } else {
        toast.error(error.response?.data?.detail || 'Failed to unlock');
      }
    } finally {
      setLoading(false);
    }
  };

  if (status?.unlocked && status?.both_completed) {
    return (
      <Button 
        variant="default" 
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90" 
        onClick={() => window.location.href = `/deep/report/${status.pair_id}`}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        View Deep Compatibility Report
      </Button>
    );
  }

  if (status?.unlocked && status?.user_completed && !status?.partner_completed) {
    return (
      <div className={compact ? "text-center p-3 bg-blue-50 rounded-lg" : "p-4 bg-blue-50 rounded-lg border border-blue-200"}>
        <p className="text-sm text-blue-900 font-medium">
          ⏳ Waiting for your partner to complete the assessment
        </p>
        {!compact && (
          <p className="text-xs text-blue-700 mt-1">
            We'll notify you when the report is ready
          </p>
        )}
      </div>
    );
  }

  if (status?.unlocked && !status?.user_completed) {
    return (
      <Button 
        className="w-full" 
        onClick={() => window.location.href = `/deep/questionnaire?pair_id=${status.pair_id}`}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Complete Deep Assessment
      </Button>
    );
  }

  // Not unlocked - show unlock CTA based on tier
  if (userTier === 'elite') {
    return (
      <div className="space-y-2">
        <Button onClick={handleUnlock} disabled={loading} className="w-full">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Unlocking...</>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Explore Deeper Compatibility
            </>
          )}
        </Button>
        {!compact && (
          <p className="text-xs text-center text-muted-foreground">
            ✨ Included in your Elite subscription
          </p>
        )}
      </div>
    );
  } else if (userTier === 'premium') {
    return (
      <div className="space-y-2">
        <Button onClick={handleUnlock} disabled={loading} className="w-full">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Unlock Deeper Compatibility ₹999
            </>
          )}
        </Button>
        {!compact && (
          <p className="text-xs text-center text-muted-foreground">
            One-time payment for comprehensive 108-question analysis
          </p>
        )}
      </div>
    );
  } else {
    return (
      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={handleUnlock} disabled={loading}>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Explore Compatibility
        </Button>
        {!compact && (
          <p className="text-xs text-center text-muted-foreground">
            Available with Premium (₹999/pair) or Elite (unlimited)
          </p>
        )}
      </div>
    );
  }
};

export default DeepExplorationCTA;
