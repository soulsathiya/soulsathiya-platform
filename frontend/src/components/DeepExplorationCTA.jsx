/**
 * DeepExplorationCTA
 *
 * Unified CTA for the Relationship Intelligence Report (₹999).
 *
 * Access modes handled:
 *  elite          → free unlock, unlimited
 *  free_premium   → first report this month is free
 *  payment_required → Razorpay modal (or dummy flow when keys are not live)
 *  upgrade_required → redirect to /subscription
 *  already_unlocked → go straight to questionnaire / report
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Crown, Loader2, Clock, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Tier-aware messaging shown BEFORE the user clicks unlock ────────────────
const PLAN_LABELS = {
  elite:    { text: 'Unlimited reports included',          color: 'text-purple-400' },
  premium:  { text: 'You have 1 free report this month',   color: 'text-primary'    },
  free:     { text: 'Upgrade to unlock this feature',      color: 'text-muted-foreground' },
};

const DeepExplorationCTA = ({
  partnerId,
  userTier   = 'free',   // 'free' | 'premium' | 'elite'
  compact    = false,
  onStatusChange,
}) => {
  const navigate = useNavigate();

  const [loading,       setLoading]       = useState(false);
  const [reminding,     setReminding]     = useState(false);
  const [status,        setStatus]        = useState(null);   // from GET /api/deep/status
  const [upgradeModal,  setUpgradeModal]  = useState(false);

  // ── Fetch current pair status ─────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    if (!partnerId) return;
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/deep/status/${partnerId}`,
        { withCredentials: true },
      );
      setStatus(data);
      if (onStatusChange) onStatusChange(data);
    } catch (err) {
      console.error('Failed to check deep status:', err);
    }
  }, [partnerId, onStatusChange]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // ── Handle Razorpay modal (production flow) ───────────────────────────────
  const openRazorpayModal = useCallback((order, pairId) => {
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded — please refresh and try again.');
      return;
    }
    const rzp = new window.Razorpay({
      key:         order.razorpay_key_id,
      amount:      order.amount,
      currency:    order.currency,
      order_id:    order.id,
      name:        'SoulSathiya',
      description: 'Relationship Intelligence Report',
      image:       window.location.origin + '/logo.png',
      theme:       { color: '#D4A520' },
      handler: async (response) => {
        try {
          await axios.post(
            `${BACKEND_URL}/api/reports/verify-payment`,
            {
              pair_id:             pairId,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            },
            { withCredentials: true },
          );
          toast.success('Payment confirmed! Report unlocked.');
          checkStatus();
        } catch {
          toast.error('Payment verification failed. Contact support@soulsathiya.com');
        }
      },
    });
    rzp.open();
  }, [checkStatus]);

  // ── Dummy payment flow (when Razorpay keys are not yet live) ─────────────
  const runDummyPayment = useCallback(async (order, pairId) => {
    toast.info('Dev mode: simulating payment…');
    try {
      await axios.post(
        `${BACKEND_URL}/api/reports/verify-payment`,
        {
          pair_id:             pairId,
          razorpay_order_id:   order.id,
          razorpay_payment_id: `pay_dummy_${Date.now()}`,
          razorpay_signature:  null,
        },
        { withCredentials: true },
      );
      toast.success('Dummy payment accepted! Report unlocked.');
      checkStatus();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Dummy payment failed.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, [checkStatus]);

  // ── Main unlock handler ───────────────────────────────────────────────────
  const handleUnlock = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/reports/unlock/${partnerId}`,
        {},
        { withCredentials: true },
      );

      if (data.unlocked || data.type === 'already_unlocked') {
        // Elite / free_premium / already_unlocked → status refreshed, UI updates
        toast.success(data.message || 'Report unlocked!');
        checkStatus();
        return;
      }

      if (data.type === 'payment_required') {
        const { order, pair_id: pairId } = data;
        if (order.is_dummy) {
          await runDummyPayment(order, pairId);
        } else {
          openRazorpayModal(order, pairId);
        }
        return;
      }

    } catch (err) {
      const detail = err?.response?.data?.detail;

      // 403 → upgrade required
      if (err?.response?.status === 403) {
        setUpgradeModal(true);
        return;
      }

      const msg =
        typeof detail === 'object' ? detail?.message || JSON.stringify(detail)
        : detail || err?.message || 'Failed to unlock report.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [partnerId, checkStatus, openRazorpayModal, runDummyPayment]);

  // ── Remind partner ────────────────────────────────────────────────────────
  const handleRemind = useCallback(async () => {
    if (!status?.pair_id) return;
    setReminding(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/reports/remind-partner/${status.pair_id}`,
        {},
        { withCredentials: true },
      );
      toast.success(data.message || 'Reminder sent to your partner.');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to send reminder.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setReminding(false);
    }
  }, [status]);


  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER — state machine
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. Report fully ready ─────────────────────────────────────────────────
  if (status?.unlocked && status?.both_completed) {
    return (
      <Button
        className="w-full bg-gradient-to-r from-primary to-yellow-600 hover:opacity-90"
        onClick={() => navigate(`/deep/report/${status.pair_id}`)}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        View Relationship Intelligence Report
      </Button>
    );
  }

  // ── 2. User done, waiting for partner ────────────────────────────────────
  if (status?.unlocked && status?.user_completed && !status?.partner_completed) {
    return (
      <div className={compact
        ? 'space-y-2'
        : 'space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5'
      }>
        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Waiting for your partner to complete their assessment
            </p>
            {!compact && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                You'll be notified as soon as they finish. The report generates automatically.
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/60 text-sm"
          onClick={handleRemind}
          disabled={reminding}
        >
          {reminding
            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Sending…</>
            : <><Bell className="w-3.5 h-3.5 mr-1.5" />Remind Partner</>
          }
        </Button>
      </div>
    );
  }

  // ── 3. Pair unlocked but user hasn't started yet ──────────────────────────
  if (status?.unlocked && !status?.user_completed) {
    return (
      <div className="space-y-2">
        {status?.partner_completed && !compact && (
          <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Your partner has completed their assessment. Your turn!
          </div>
        )}
        <Button
          className="w-full"
          onClick={() => navigate(`/deep/questionnaire?pair_id=${status.pair_id}`)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {status?.user_started ? 'Continue Assessment' : 'Start Assessment'}
        </Button>
        {!compact && (
          <p className="text-xs text-center text-muted-foreground">
            108 questions across 6 relationship dimensions
          </p>
        )}
      </div>
    );
  }

  // ── 4. Upgrade required modal ─────────────────────────────────────────────
  if (upgradeModal) {
    return (
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 text-center">
        <Crown className="w-6 h-6 text-amber-400 mx-auto" />
        <p className="text-sm font-semibold text-foreground">Premium Required</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Upgrade to Premium to access Relationship Intelligence Reports, or unlock one for ₹999.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => navigate('/subscription')}
          >
            Upgrade Plan <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => { setUpgradeModal(false); }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ── 5. Not yet unlocked — plan-based CTA ─────────────────────────────────
  const planLabel = PLAN_LABELS[userTier] || PLAN_LABELS.free;

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        variant={userTier === 'free' ? 'outline' : 'default'}
        onClick={handleUnlock}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
        ) : userTier === 'elite' ? (
          <><Sparkles className="w-4 h-4 mr-2" />Unlock Relationship Intelligence Report</>
        ) : userTier === 'premium' ? (
          <><Lock className="w-4 h-4 mr-2" />Unlock Relationship Intelligence Report</>
        ) : (
          <><Crown className="w-4 h-4 mr-2" />Upgrade to Unlock Report</>
        )}
      </Button>

      {!compact && (
        <p className={`text-xs text-center ${planLabel.color}`}>
          {userTier === 'premium'
            ? '1 free report/month included · ₹999 per additional report'
            : userTier === 'elite'
            ? '✨ Unlimited reports included in your Elite plan'
            : 'Available on Premium (1 free/month) · ₹999 per report'}
        </p>
      )}
    </div>
  );
};

export default DeepExplorationCTA;
