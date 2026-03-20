import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOLD  = '#D4A520';
const NAVY  = '#0C1323';
const CARD  = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(212,165,32,0.18)';

export default function CompatibilityInvitePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [pairInfo,   setPairInfo]   = useState(null);
  const [myStatus,   setMyStatus]   = useState(null);
  const [accepting,  setAccepting]  = useState(false);
  const [accepted,   setAccepted]   = useState(false);
  const [pairId,     setPairId]     = useState(null);
  const [error,      setError]      = useState('');
  const [authError,  setAuthError]  = useState(false);

  useEffect(() => { init(); }, [inviteToken]);

  const init = async () => {
    try {
      // Fetch public pair info (no auth needed)
      const pairRes = await axios.get(
        `${BACKEND_URL}/api/insights/compatibility/pair/${inviteToken}`
      );
      setPairInfo(pairRes.data);

      // Try to fetch logged-in user's insight status
      try {
        const statusRes = await axios.get(
          `${BACKEND_URL}/api/insights/my-status`,
          { withCredentials: true }
        );
        setMyStatus(statusRes.data);
      } catch {
        setAuthError(true); // not logged in
      }
    } catch (e) {
      setError('This invitation link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/insights/compatibility/accept/${inviteToken}`,
        {},
        { withCredentials: true }
      );
      setAccepted(true);
      setPairId(res.data.pair_id);
    } catch (e) {
      const msg = e.response?.data?.detail || 'Failed to accept invitation.';
      setError(msg);
    } finally {
      setAccepting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={36} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const initiatorFirst = pairInfo?.initiator_name?.split(' ')[0] || 'Your partner';

  // ── Error state ─────────────────────────────────────────────────────────
  if (error && !pairInfo) return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
        <AlertCircle size={48} color="#f87171" style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Invitation Not Found</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>{error}</div>
        <Link to="/insights" style={{ color: GOLD, fontSize: 14 }}>← Take the Relationship Assessment</Link>
      </div>
    </div>
  );

  // ── Already accepted ────────────────────────────────────────────────────
  if (accepted && pairId) return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        maxWidth: 460, width: '100%', textAlign: 'center',
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '40px 32px',
      }}>
        <CheckCircle2 size={52} color="#4ade80" style={{ marginBottom: 16 }} />
        <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Invitation Accepted!</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          You and {initiatorFirst} are now paired. Either of you can unlock the
          Compatibility Intelligence Report for ₹799 — one payment gives you both full access.
        </div>
        <button
          onClick={() => navigate(`/insights/compatibility/report/${pairId}`)}
          style={{
            background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
            color: NAVY, border: 'none', borderRadius: 12,
            padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
          }}>
          Unlock Compatibility Report <ArrowRight size={16} />
        </button>
        <div>
          <Link to="/insights/report" style={{ color: 'rgba(212,165,32,0.6)', fontSize: 13 }}>
            View my individual report first
          </Link>
        </div>
      </div>
    </div>
  );

  const hasReport = myStatus?.payment_status === 'paid';

  // ── Already accepted (status from pair) ─────────────────────────────────
  if (pairInfo?.status === 'both_ready' || pairInfo?.status === 'paid') return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        maxWidth: 460, width: '100%', textAlign: 'center',
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '40px 32px',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💞</div>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 20, marginBottom: 10 }}>You're Already Paired</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          This invitation has already been accepted.
          {pairInfo.status === 'paid' ? ' Your Compatibility Intelligence Report is ready.' : ' You can now unlock your Compatibility Intelligence Report.'}
        </div>
        <Link to="/insights/report">
          <button style={{
            background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
            color: NAVY, border: 'none', borderRadius: 12,
            padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>Go to My Report</button>
        </Link>
      </div>
    </div>
  );

  // ── Main invite page ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 500, width: '100%' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <Heart size={20} color={GOLD} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 18 }}>
              Soul<span style={{ color: GOLD }}>Sathiya</span>
            </span>
          </div>
          <div style={{ color: 'rgba(212,165,32,0.6)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Compatibility Intelligence
          </div>
        </div>

        {/* Invite card */}
        <div style={{
          background: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 20, padding: '36px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>💌</div>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 21, marginBottom: 10 }}>
            {initiatorFirst} wants to explore your compatibility
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>
            {initiatorFirst} has completed the 108-question Relationship Intelligence Assessment
            and is inviting you to do the same — so together you can unlock a
            <strong style={{ color: 'rgba(255,255,255,0.9)' }}> Compatibility Intelligence Report</strong> based
            on both your answers.
          </div>

          {/* How it works */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '18px 20px', marginBottom: 28, textAlign: 'left',
          }}>
            <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 14 }}>How it works</div>
            {[
              { step: '1', text: 'You complete the 108-question Relationship Intelligence Assessment (₹999)' },
              { step: '2', text: 'Accept this invitation — linking your reports together' },
              { step: '3', text: 'Either of you pays ₹799 to unlock the Compatibility Intelligence Report' },
              { step: '4', text: 'Both of you get full access — together' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(212,165,32,0.15)', border: `1px solid ${BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: GOLD, fontSize: 11, fontWeight: 700,
                }}>{step}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>{text}</div>
              </div>
            ))}
          </div>

          {/* Action */}
          {authError ? (
            /* Not logged in */
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 16 }}>
                You'll need to complete your own assessment and log in to accept this invitation.
              </div>
              <Link to="/insights">
                <button style={{
                  background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                  color: NAVY, border: 'none', borderRadius: 12,
                  padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  width: '100%', marginBottom: 12,
                }}>
                  Take the Assessment First
                </button>
              </Link>
              <Link to={`/login?redirect=/insights/compatibility/accept/${inviteToken}`}>
                <button style={{
                  background: 'transparent', border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: '100%',
                }}>
                  Already have an account? Log in
                </button>
              </Link>
            </div>
          ) : !hasReport ? (
            /* Logged in but no paid report */
            <div>
              <div style={{
                background: 'rgba(212,165,32,0.08)', border: `1px solid ${BORDER}`,
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6,
              }}>
                To accept this invitation, you need to first complete and unlock your own
                Relationship Intelligence Report (₹999). Then come back and accept.
              </div>
              <Link to="/insights">
                <button style={{
                  background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                  color: NAVY, border: 'none', borderRadius: 12,
                  padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  width: '100%',
                }}>
                  Start My Assessment <ArrowRight size={15} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }} />
                </button>
              </Link>
            </div>
          ) : (
            /* Ready to accept */
            <div>
              <div style={{
                background: 'rgba(22,101,52,0.15)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 20,
                color: '#4ade80', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle2 size={15} /> Your Relationship Intelligence Report is ready — you can accept now.
              </div>
              {error && (
                <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>
              )}
              <button onClick={handleAccept} disabled={accepting}
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                  color: NAVY, border: 'none', borderRadius: 12,
                  padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  width: '100%', opacity: accepting ? 0.7 : 1,
                }}>
                {accepting ? 'Accepting…' : `Accept & Pair with ${initiatorFirst}`}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: 'rgba(212,165,32,0.5)', fontSize: 12 }}>
            Learn more about SoulSathiya
          </Link>
        </div>
      </div>
    </div>
  );
}
