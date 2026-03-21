/**
 * InsightsUnlock.jsx
 * ──────────────────
 * Shown after all 6 sections are complete.
 * States:
 *   1. All complete — show summary + LOGIN WALL (if not logged in)
 *   2. Logged in  → show payment (₹999)
 *   3. Paid       → navigate to /insights/report
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Lock, Loader2, CheckCircle2, ArrowRight, Sparkles, Mail, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const GOLD   = '#D4A520';
const NAVY   = '#0C1323';
const CARD   = '#0F1A2E';

const LS_TOKEN = 'insight_guest_token';

const SECTION_LABELS = [
  { level: 1, icon: '❤️', title: 'Emotional Foundation' },
  { level: 2, icon: '🌟', title: 'Values & Life Vision' },
  { level: 3, icon: '💬', title: 'Communication & Connection' },
  { level: 4, icon: '🔄', title: 'Relationship Patterns' },
  { level: 5, icon: '☀️', title: 'Daily Life & Lifestyle' },
  { level: 6, icon: '🚀', title: 'Growth & Future' },
];

const REPORT_FEATURES = [
  'Overall Relationship Intelligence Score (0–100)',
  'Detailed profile across all 6 dimensions',
  'Your top 3 strengths in relationships',
  '3 areas with the most room to grow',
  'What you need most in a partner or relationship',
  '6 personalised insights to act on',
  'Downloadable personal report',
];

export default function InsightsUnlock() {
  const navigate = useNavigate();

  const [authState,    setAuthState]    = useState('loading');   // 'loading' | 'guest' | 'logged_in'
  const [currentUser,  setCurrentUser]  = useState(null);
  const [payStatus,    setPayStatus]    = useState('idle');      // 'idle' | 'loading' | 'paying' | 'success'
  const [guestToken,   setGuestToken]   = useState(null);
  const [converting,   setConverting]   = useState(false);

  // Login form state
  const [loginStep,    setLoginStep]    = useState('email');     // 'email' | 'otp'
  const [email,        setEmail]        = useState('');
  const [otp,          setOtp]          = useState('');
  const [loggingIn,    setLoggingIn]    = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);      // seconds remaining

  // ── Check auth ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(LS_TOKEN) || null;
    setGuestToken(token);

    axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true })
      .then(({ data }) => {
        setCurrentUser(data);
        setAuthState('logged_in');
      })
      .catch(() => {
        setAuthState('guest');
      });
  }, []);

  // ── Convert guest data + check if report already paid ───────────────────────
  useEffect(() => {
    if (authState !== 'logged_in') return;

    // If user logged in via regular login (not OTP), convert guest data
    const token = localStorage.getItem(LS_TOKEN);
    if (token && !token.startsWith('local_')) {
      axios.post(
        `${BACKEND_URL}/api/insights/convert-guest`,
        { temp_token: token },
        { withCredentials: true }
      ).then(() => {
        localStorage.removeItem(LS_TOKEN);
      }).catch(() => {});
    }

    axios.get(`${BACKEND_URL}/api/insights/my-status`, { withCredentials: true })
      .then(({ data }) => {
        if (data.report_unlocked) setPayStatus('success');
      })
      .catch(() => {});
  }, [authState]);

  // ── Resend cooldown timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Handle login (email + OTP via existing auth) ─────────────────────────────
  const handleSendOtp = useCallback(async (isResend = false) => {
    if (!email.trim()) { toast.error('Please enter your email.'); return; }
    setLoggingIn(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/send-otp`,
        { email: email.trim().toLowerCase() },
        { withCredentials: true }
      );
      toast.success(isResend ? 'New OTP sent to your email.' : 'OTP sent to your email.');
      // Dev fallback: backend returns dev_otp when RESEND key is not configured
      if (data?.dev_otp) {
        toast.info(`Dev mode — OTP: ${data.dev_otp}`, { duration: 30000 });
      }
      setOtp('');
      setResendCooldown(30);  // 30-second cooldown before next resend
      setLoginStep('otp');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to send OTP.';
      toast.error(typeof msg === 'string' ? msg : 'Failed to send OTP. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp.trim()) { toast.error('Please enter the OTP.'); return; }
    setLoggingIn(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/verify-otp`,
        { email: email.trim().toLowerCase(), otp: otp.trim() },
        { withCredentials: true }
      );
      setCurrentUser(data.user || data);
      toast.success('Welcome back!');

      // Convert guest session if we have a token
      if (guestToken && !guestToken.startsWith('local_')) {
        setConverting(true);
        try {
          await axios.post(
            `${BACKEND_URL}/api/insights/convert-guest`,
            { temp_token: guestToken },
            { withCredentials: true }
          );
          toast.success('Your progress has been saved to your account.');
        } catch (convErr) {
          const d = convErr?.response?.data?.detail;
          if (typeof d === 'string' && d.includes('Already linked')) {
            // fine
          } else {
            toast.error('Could not migrate progress. Please contact support.');
          }
        } finally {
          setConverting(false);
        }
      }
      setAuthState('logged_in');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map(e => e.msg || e.message || JSON.stringify(e)).join(' · ')
          : 'Invalid OTP. Please try again.';
      toast.error(msg);
    } finally {
      setLoggingIn(false);
    }
  }, [email, otp, guestToken]);

  // ── Payment flow ─────────────────────────────────────────────────────────────
  const handlePay = useCallback(async () => {
    setPayStatus('loading');
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/insights/payment`,
        {},
        { withCredentials: true }
      );

      if (data.already_paid) {
        setPayStatus('success');
        return;
      }

      const { order } = data;

      if (order.is_dummy) {
        // Dummy mode — simulate
        setPayStatus('paying');
        toast.info('Dev mode: simulating payment…');
        await new Promise(r => setTimeout(r, 1500));
        await axios.post(
          `${BACKEND_URL}/api/insights/verify-payment`,
          {
            razorpay_order_id:   order.id,
            razorpay_payment_id: `pay_dummy_${Date.now()}`,
            razorpay_signature:  null,
          },
          { withCredentials: true }
        );
        setPayStatus('success');
        toast.success('Report unlocked! 🎉');
        return;
      }

      // Real Razorpay
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh and try again.');
        setPayStatus('idle');
        return;
      }

      const rzp = new window.Razorpay({
        key:         order.razorpay_key_id,
        amount:      order.amount,
        currency:    order.currency,
        order_id:    order.id,
        name:        'SoulSathiya',
        description: 'Relationship Intelligence Report',
        image:       `${window.location.origin}/logo.png`,
        handler: async (response) => {
          setPayStatus('paying');
          try {
            await axios.post(
              `${BACKEND_URL}/api/insights/verify-payment`,
              {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              },
              { withCredentials: true }
            );
            setPayStatus('success');
            toast.success('Report unlocked! 🎉');
          } catch {
            toast.error('Payment verification failed. Please contact support.');
            setPayStatus('idle');
          }
        },
        modal: { ondismiss: () => setPayStatus('idle') },
        theme: { color: GOLD },
        prefill: {
          email: currentUser?.email || email,
          name:  currentUser?.full_name || '',
        },
      });
      rzp.open();
      setPayStatus('paying');

    } catch (err) {
      const msg = err?.response?.data?.detail || 'Could not initiate payment.';
      toast.error(typeof msg === 'string' ? msg : 'Payment initiation failed.');
      setPayStatus('idle');
    }
  }, [currentUser, email]);

  // ── Redirect to report once paid ─────────────────────────────────────────────
  useEffect(() => {
    if (payStatus === 'success') {
      const t = setTimeout(() => navigate('/insights/report'), 2200);
      return () => clearTimeout(t);
    }
  }, [payStatus, navigate]);

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (authState === 'loading' || converting) {
    return (
      <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={28} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'rgba(245,237,216,0.5)', fontFamily: 'Georgia, serif', fontSize: 16 }}>
          {converting ? 'Saving your progress…' : 'Loading…'}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (payStatus === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 36, fontWeight: 700, color: '#F5EDD8', margin: 0 }}>
          Your Report is Ready
        </h1>
        <p style={{ color: 'rgba(245,237,216,0.6)', fontSize: 16, maxWidth: 400 }}>
          Taking you to your Relationship Intelligence Report…
        </p>
        <Loader2 size={20} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: '#F5EDD8', fontFamily: 'Georgia, serif', overflowX: 'hidden' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid rgba(212,165,32,0.12)' }}>
        <a href="/insights" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="SoulSathiya" style={{ width: 28, height: 28 }} onError={e => { e.target.style.display = 'none'; }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#F5EDD8' }}>
            Soul<span style={{ color: GOLD }}>Sathiya</span>
          </span>
        </a>
        {authState === 'logged_in' && (
          <div style={{ fontSize: 13, color: 'rgba(245,237,216,0.5)', fontFamily: 'sans-serif' }}>
            {currentUser?.full_name || currentUser?.email || 'Welcome back'}
          </div>
        )}
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

          {/* Left: Achievement summary */}
          <div>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,165,32,0.1)', border: '1px solid rgba(212,165,32,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24, fontSize: 13, color: GOLD, fontFamily: 'sans-serif' }}>
              <Sparkles size={13} />
              All 6 Dimensions Complete
            </div>

            <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
              Your Relationship<br />
              <span style={{ color: GOLD }}>Intelligence Report</span><br />
              is ready.
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(245,237,216,0.7)', marginBottom: 32, maxWidth: 420 }}>
              You've explored all six dimensions of how you connect and relate. Unlock your full personalised report with a one-time payment.
            </p>

            {/* Completed levels */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Levels Completed
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SECTION_LABELS.map(s => (
                  <div key={s.level} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(212,165,32,0.05)', border: '1px solid rgba(212,165,32,0.12)', borderRadius: 10 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontSize: 14, flex: 1 }}>{s.title}</span>
                    <CheckCircle2 size={16} color="#4ade80" />
                  </div>
                ))}
              </div>
            </div>

            {/* What's in the report */}
            <div style={{ background: CARD, border: '1px solid rgba(212,165,32,0.12)', borderRadius: 14, padding: '24px 20px' }}>
              <div style={{ fontSize: 12, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Your Report Includes
              </div>
              {REPORT_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 13, color: 'rgba(245,237,216,0.75)', lineHeight: 1.5 }}>
                  <span style={{ color: GOLD, flexShrink: 0, marginTop: 2 }}>✦</span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login wall or Payment */}
          <div>
            {authState === 'guest' ? (
              /* ── LOGIN WALL ── */
              <div style={{ background: CARD, border: `1px solid ${GOLD}30`, borderRadius: 20, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(212,165,32,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={20} color={GOLD} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 2 }}>One last step</div>
                    <div style={{ fontSize: 13, color: 'rgba(245,237,216,0.5)', fontFamily: 'sans-serif' }}>Sign in to unlock your full report</div>
                  </div>
                </div>

                <p style={{ fontSize: 14, color: 'rgba(245,237,216,0.65)', lineHeight: 1.7, marginBottom: 28 }}>
                  Enter your email to create your account and secure your results. Your assessment data will be automatically saved.
                </p>

                {loginStep === 'email' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'rgba(245,237,216,0.5)', fontFamily: 'sans-serif', marginBottom: 8 }}>
                      EMAIL ADDRESS
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !loggingIn && handleSendOtp()}
                        placeholder="you@example.com"
                        style={{
                          flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 10, padding: '12px 14px', color: '#F5EDD8', fontSize: 15,
                          fontFamily: 'sans-serif', outline: 'none',
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSendOtp}
                        disabled={loggingIn}
                        style={{
                          background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                          color: '#0C1323', border: 'none', borderRadius: 10,
                          padding: '12px 18px', cursor: loggingIn ? 'not-allowed' : 'pointer',
                          fontWeight: 700, fontSize: 13, fontFamily: 'sans-serif',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {loggingIn ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Mail size={14} /> Send OTP</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 12, color: 'rgba(245,237,216,0.5)', fontFamily: 'sans-serif', marginBottom: 8 }}>
                        OTP SENT TO {email.toUpperCase()}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="\d*"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 10, padding: '12px 14px', color: '#F5EDD8', fontSize: 18,
                          fontFamily: 'sans-serif', outline: 'none', letterSpacing: '0.2em', textAlign: 'center', boxSizing: 'border-box',
                        }}
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={loggingIn}
                      style={{
                        width: '100%',
                        background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                        color: '#0C1323', border: 'none', borderRadius: 10,
                        padding: '14px', cursor: loggingIn ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: 15, fontFamily: 'sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      {loggingIn ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <>Verify & Continue <ArrowRight size={15} /></>}
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setLoginStep('email'); setOtp(''); }}
                        style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px', cursor: 'pointer', color: 'rgba(245,237,216,0.5)', fontSize: 13, fontFamily: 'sans-serif' }}
                      >
                        Change email
                      </button>
                      <button
                        onClick={() => handleSendOtp(true)}
                        disabled={loggingIn || resendCooldown > 0}
                        style={{
                          flex: 1, background: 'transparent',
                          border: `1px solid ${resendCooldown > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(212,165,32,0.35)'}`,
                          borderRadius: 10, padding: '10px',
                          cursor: (loggingIn || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                          color: resendCooldown > 0 ? 'rgba(245,237,216,0.3)' : GOLD,
                          fontSize: 13, fontFamily: 'sans-serif',
                          transition: 'all 0.2s',
                        }}
                      >
                        {loggingIn ? '…' : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(245,237,216,0.35)', fontFamily: 'sans-serif', textAlign: 'center' }}>
                    Already have an account?{' '}
                    <a href="/login" style={{ color: GOLD, textDecoration: 'none' }}>Sign in here</a>
                    {' '}· Your progress will be saved automatically.
                  </span>
                </div>

                {/* Trust badges */}
                <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['🔒 Private & secure', '✦ No spam', '✦ 1-click to report'].map(t => (
                    <span key={t} style={{ fontSize: 11, color: 'rgba(245,237,216,0.35)', fontFamily: 'sans-serif' }}>{t}</span>
                  ))}
                </div>
              </div>
            ) : (
              /* ── PAYMENT ── */
              <div style={{ background: CARD, border: `1px solid ${GOLD}30`, borderRadius: 20, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🔓</div>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
                    Unlock Your Full Report
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(245,237,216,0.6)', margin: 0, fontFamily: 'sans-serif' }}>
                    One-time payment · No subscription required
                  </p>
                </div>

                {/* Pricing */}
                <div style={{ background: 'rgba(212,165,32,0.07)', border: `1px solid ${GOLD}25`, borderRadius: 14, padding: '24px', textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: GOLD, fontFamily: 'sans-serif' }}>₹</span>
                    <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 56, fontWeight: 700, color: GOLD, lineHeight: 1 }}>999</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(245,237,216,0.5)', fontFamily: 'sans-serif' }}>
                    Your SoulSathiya Relationship Intelligence Report
                  </div>
                </div>

                {/* What's included (compact) */}
                <div style={{ marginBottom: 28 }}>
                  {REPORT_FEATURES.slice(0, 4).map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: 'rgba(245,237,216,0.7)', fontFamily: 'sans-serif' }}>
                      <CheckCircle2 size={13} color="#4ade80" style={{ flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: 'rgba(245,237,216,0.35)', fontFamily: 'sans-serif', marginTop: 4, paddingLeft: 21 }}>
                    + {REPORT_FEATURES.length - 4} more insights…
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  disabled={payStatus === 'loading' || payStatus === 'paying'}
                  style={{
                    width: '100%',
                    background: (payStatus === 'loading' || payStatus === 'paying')
                      ? 'rgba(212,165,32,0.4)' : `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                    color: '#0C1323', fontWeight: 700, fontSize: 16,
                    padding: '16px', borderRadius: 12, border: 'none',
                    cursor: (payStatus === 'loading' || payStatus === 'paying') ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 6px 24px rgba(212,165,32,0.3)',
                    marginBottom: 14,
                  }}
                >
                  {payStatus === 'loading' || payStatus === 'paying' ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                  ) : (
                    <>Unlock Report for ₹999 <ArrowRight size={15} /></>
                  )}
                </button>

                {/* Trust row */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                  {['🔒 Secure payment', '✦ Razorpay protected', '✦ Instant access'].map(t => (
                    <span key={t} style={{ fontSize: 11, color: 'rgba(245,237,216,0.35)', fontFamily: 'sans-serif' }}>{t}</span>
                  ))}
                </div>

                {/* Already have an account link */}
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  <a href="/insights/report" style={{ fontSize: 12, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = GOLD}
                    onMouseLeave={e => e.target.style.color = 'rgba(245,237,216,0.4)'}
                  >
                    Already paid? View your report →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
