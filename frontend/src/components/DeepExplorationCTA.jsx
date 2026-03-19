/**
 * DeepExplorationCTA
 *
 * Unified CTA for the Relationship Intelligence Report (₹999).
 *
 * Access modes handled:
 *  elite          → free unlock, unlimited
 *  free_premium   → first report this month is free
 *  payment_required → Razorpay modal (or dummy flow when keys are not live)
 *  upgrade_required → show upgrade modal → /subscription
 *  already_unlocked → go straight to questionnaire / report
 *
 * Rich waiting UX includes:
 *  - Progress tracker (You ✅ / Partner ⏳)
 *  - 7-day expiry countdown
 *  - Remind Partner (24 h cooldown, max 3 reminders, remaining count shown)
 *  - Copy Invite Link (clipboard)
 *  - Expired state → Invite same or different partner
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Lock, Crown, Loader2, Clock, Bell,
  ArrowRight, CheckCircle2, Copy, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Tier-aware messaging shown BEFORE the user clicks unlock ────────────────
const PLAN_LABELS = {
  elite:   { text: 'Unlimited reports included',         color: 'text-purple-400' },
  premium: { text: 'You have 1 free report this month',  color: 'text-primary'    },
  free:    { text: 'Upgrade to unlock this feature',     color: 'text-muted-foreground' },
};

const DeepExplorationCTA = ({
  partnerId,
  userTier   = 'free',   // 'free' | 'premium' | 'elite'
  compact    = false,
  onStatusChange,
}) => {
  const navigate = useNavigate();

  const [loading,      setLoading]      = useState(false);
  const [reminding,    setReminding]    = useState(false);
  const [copyingLink,  setCopyingLink]  = useState(false);
  const [status,       setStatus]       = useState(null);   // from GET /api/reports/status
  const [upgradeModal, setUpgradeModal] = useState(false);

  // ── Fetch current pair status ─────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    if (!partnerId) return;
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/reports/status/${partnerId}`,
        { withCredentials: true },
      );
      setStatus(data);
      if (onStatusChange) onStatusChange(data);
    } catch (err) {
      console.error('Failed to check report status:', err);
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
      if (err?.response?.status === 403) {
        setUpgradeModal(true);
        return;
      }
      const detail = err?.response?.data?.detail;
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
      checkStatus();  // refresh can_remind + remaining_reminders
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 429) {
        const msg = typeof detail === 'object' ? detail?.message : detail;
        toast.warning(msg || 'Please wait before sending another reminder.');
      } else {
        const msg = typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Failed to send reminder.';
        toast.error(msg);
      }
    } finally {
      setReminding(false);
    }
  }, [status, checkStatus]);

  // ── Copy invite link ──────────────────────────────────────────────────────
  const handleCopyLink = useCallback(async () => {
    const link = status?.invite_link;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopyingLink(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopyingLink(false), 2500);
    } catch {
      toast.error(`Copy manually: ${link}`);
    }
  }, [status]);

  // ── Reuse expired pair (same or new partner) ──────────────────────────────
  const handleReuse = useCallback(async (pairId, newPartnerId) => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/reports/reuse/${pairId}/${newPartnerId}`,
        {},
        { withCredentials: true },
      );

      if (data.unlocked) {
        toast.success(data.message || 'New report unlocked!');
        checkStatus();
        return;
      }

      if (data.type === 'payment_required') {
        const { order, pair_id: newPairId } = data;
        if (order.is_dummy) {
          await runDummyPayment(order, newPairId);
        } else {
          openRazorpayModal(order, newPairId);
        }
      }

    } catch (err) {
      if (err?.response?.status === 403) {
        setUpgradeModal(true);
        return;
      }
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === 'object' ? detail?.message || JSON.stringify(detail)
        : detail || err?.message || 'Failed to start new report.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [checkStatus, openRazorpayModal, runDummyPayment]);


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
        View SoulSathiya Compatibility Intelligence Report
      </Button>
    );
  }

  // ── 2. Pair expired — invite again or choose another match ───────────────
  if (status?.is_expired) {
    return (
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300">
              Partner invitation expired
            </p>
            {!compact && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Your partner didn't complete their assessment within 7 days. You can invite them again or choose a different match.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Button
            size="sm"
            className="w-full bg-primary/90 hover:bg-primary text-black"
            onClick={() => handleReuse(status.pair_id, partnerId)}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Processing…</>
              : <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Invite Same Partner Again</>
            }
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/30 hover:bg-primary/10 text-sm"
            onClick={() => navigate('/matches')}
          >
            <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
            Invite Another Match
          </Button>
        </div>
      </div>
    );
  }

  // ── 3. User done, waiting for partner ────────────────────────────────────
  if (status?.unlocked && status?.user_completed && !status?.partner_completed) {
    const { days_until_expiry, can_remind, remaining_reminders, reminders_sent } = status;

    const remindLabel = () => {
      if (reminding) return null;
      if (reminders_sent >= 3) return 'Max reminders sent';
      if (!can_remind && reminders_sent > 0) return 'Remind again in 24h';
      if (remaining_reminders < 3) return `Remind Partner (${remaining_reminders} left)`;
      return 'Remind Partner';
    };

    return (
      <div className={compact
        ? 'space-y-3'
        : 'space-y-4 p-4 rounded-xl border border-primary/20 bg-primary/5'
      }>

        {/* Header */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm font-semibold text-foreground">
            Waiting for your partner
          </p>
        </div>

        {/* Progress grid */}
        {!compact && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-xs font-semibold text-green-400">You</span>
              <span className="text-xs text-muted-foreground">Completed ✅</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-card border border-border text-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Partner</span>
              <span className="text-xs text-muted-foreground">Pending ⏳</span>
            </div>
          </div>
        )}

        {/* Expiry warning */}
        {days_until_expiry !== null && !compact && (
          <div className={`flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5 ${
            days_until_expiry <= 1
              ? 'text-red-400 bg-red-500/10'
              : days_until_expiry <= 3
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-muted-foreground'
          }`}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {days_until_expiry === 0
              ? 'Invite expires today — remind your partner now!'
              : days_until_expiry === 1
              ? 'Invite expires tomorrow — remind your partner!'
              : `Invite expires in ${days_until_expiry} days`}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/60 text-sm"
            onClick={handleRemind}
            disabled={reminding || !can_remind}
          >
            {reminding
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Sending…</>
              : <><Bell className="w-3.5 h-3.5 mr-1.5" />{remindLabel()}</>
            }
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={handleCopyLink}
            disabled={!status?.invite_link}
          >
            {copyingLink
              ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-400" />Link Copied!</>
              : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy Invite Link</>
            }
          </Button>
        </div>

        {/* Microcopy */}
        {!compact && (
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            You've unlocked this for both of you ❤️<br />
            Great relationships are built with understanding.
          </p>
        )}
      </div>
    );
  }

  // ── 4. Pair unlocked but user hasn't started yet ──────────────────────────
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

  // ── 5. Upgrade required modal ─────────────────────────────────────────────
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
            onClick={() => setUpgradeModal(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ── 6. Not yet unlocked — plan-based CTA ─────────────────────────────────
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
          <><Sparkles className="w-4 h-4 mr-2" />Unlock SoulSathiya Compatibility Intelligence Report</>
        ) : userTier === 'premium' ? (
          <><Lock className="w-4 h-4 mr-2" />Unlock SoulSathiya Compatibility Intelligence Report</>
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
