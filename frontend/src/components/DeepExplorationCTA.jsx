import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lock, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DeepExplorationCTA = ({ partnerId, userTier = 'free', compact = false }) => {
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
    } catch (error) {
      console.error('Failed to check deep status:', error);
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
        // Trigger Razorpay payment
        toast.info('Payment integration coming soon');
      } else {
        toast.error('Please upgrade to Premium or Elite to access Deep Exploration');
      }
    } catch (error) {
      if (error.response?.status === 402) {
        toast.info('Payment required: ₹999');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to unlock');
      }
    } finally {
      setLoading(false);
    }
  };

  if (status?.unlocked && status?.both_completed) {
    return (
      <Button variant="outline" className="w-full" onClick={() => window.location.href = `/deep/report/${status.pair_id}`}>
        <Sparkles className="w-4 h-4 mr-2" />
        View Deep Compatibility Report
      </Button>
    );
  }

  if (status?.unlocked && status?.user_completed && !status?.partner_completed) {
    return (
      <div className={compact ? "text-center" : "p-4 bg-blue-50 rounded-lg"}>
        <p className="text-sm text-blue-900">
          Waiting for your partner to complete the deep compatibility assessment
        </p>
      </div>
    );
  }

  if (status?.unlocked && !status?.user_completed) {
    return (
      <Button className="w-full" onClick={() => window.location.href = '/deep/questionnaire'}>
        <Sparkles className="w-4 h-4 mr-2" />
        Complete Deep Assessment
      </Button>
    );
  }

  // Not unlocked - show unlock CTA
  if (userTier === 'elite') {
    return (
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
    );
  } else if (userTier === 'premium') {
    return (
      <div className="space-y-2">
        <Button onClick={handleUnlock} disabled={loading} variant="outline" className="w-full">
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
            One-time payment for comprehensive pair analysis
          </p>
        )}
      </div>
    );
  } else {
    return (
      <Button variant="outline" className="w-full" onClick={() => window.location.href = '/subscription'}>
        <Crown className="w-4 h-4 mr-2" />
        Upgrade to Explore Compatibility
      </Button>
    );
  }
};

export default DeepExplorationCTA;
