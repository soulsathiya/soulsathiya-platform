/**
 * VerifiedBadge — shows the right badge based on kyc_status + kyc_method.
 *
 * Usage:
 *   <VerifiedBadge kycStatus="approved" kycMethod="digilocker" size="sm" />
 *
 * Sizes: "xs" | "sm" | "md" (default "sm")
 * Variants: tooltip shown on hover
 */
import React, { useState } from 'react';
import { CheckCircle, Shield } from 'lucide-react';

const SIZE = {
  xs: { icon: 'w-3.5 h-3.5', text: 'text-xs', px: 'px-1.5 py-0.5', gap: 'gap-1'   },
  sm: { icon: 'w-4 h-4',     text: 'text-xs', px: 'px-2   py-1',   gap: 'gap-1.5' },
  md: { icon: 'w-5 h-5',     text: 'text-sm', px: 'px-3   py-1.5', gap: 'gap-2'   },
};

export default function VerifiedBadge({
  kycStatus,
  kycMethod,
  size = 'sm',
  className = '',
}) {
  const [tip, setTip] = useState(false);
  const s = SIZE[size] || SIZE.sm;

  if (kycStatus !== 'approved') return null;

  const isGovt = kycMethod === 'digilocker';

  return (
    <div className={`relative inline-block ${className}`}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      {isGovt ? (
        /* ── Government Verified (DigiLocker) — gold/green glow ── */
        <span className={`
          inline-flex items-center ${s.gap} ${s.px} rounded-full font-bold ${s.text}
          bg-gradient-to-r from-yellow-500/20 to-emerald-500/20
          border border-yellow-500/40
          text-yellow-300
          shadow-[0_0_10px_rgba(212,175,55,0.35)]
        `}>
          <Shield className={`${s.icon} text-yellow-400`} />
          Government Verified ✅
        </span>
      ) : (
        /* ── Identity Verified (manual) — blue/emerald ── */
        <span className={`
          inline-flex items-center ${s.gap} ${s.px} rounded-full font-semibold ${s.text}
          bg-emerald-500/15 border border-emerald-500/35 text-emerald-400
        `}>
          <CheckCircle className={`${s.icon}`} />
          Identity Verified ✔
        </span>
      )}

      {/* Tooltip */}
      {tip && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
          bg-slate-800 border border-slate-700 text-white text-xs
          rounded-lg px-3 py-2 whitespace-nowrap shadow-xl pointer-events-none
        ">
          {isGovt
            ? 'This profile is government-verified via DigiLocker'
            : 'This profile has completed identity verification'
          }
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

/**
 * VerifiedDot — minimal badge for profile cards (just an icon + small label)
 * Useful for tight spaces like match cards, chat headers, etc.
 */
export function VerifiedDot({ kycStatus, kycMethod, className = '' }) {
  const [tip, setTip] = useState(false);
  if (kycStatus !== 'approved') return null;
  const isGovt = kycMethod === 'digilocker';

  return (
    <div className={`relative inline-block ${className}`}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      {isGovt ? (
        <span className="
          inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
          bg-gradient-to-r from-yellow-500/25 to-emerald-500/25
          border border-yellow-500/45 text-yellow-300 text-[10px] font-bold
          shadow-[0_0_8px_rgba(212,175,55,0.3)]
        ">
          <Shield className="w-3 h-3" />🏛️
        </span>
      ) : (
        <span className="
          inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
          bg-emerald-500/15 border border-emerald-500/30
          text-emerald-400 text-[10px] font-semibold
        ">
          <CheckCircle className="w-3 h-3" />✔
        </span>
      )}

      {tip && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50
          bg-slate-800 border border-slate-700 text-white text-xs
          rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl pointer-events-none
        ">
          {isGovt ? 'Government Verified' : 'Identity Verified'}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}
