import React from 'react';
import { ShieldCheck, User, GraduationCap, BadgeDollarSign, ExternalLink } from 'lucide-react';

const Badge = ({ icon: Icon, label, verified, note }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
    verified
      ? 'border-green-700/40 bg-green-900/20'
      : 'border-border/30 bg-white/[0.02] opacity-50'
  }`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
      verified ? 'bg-green-900/50' : 'bg-white/5'
    }`}>
      <Icon className={`w-4 h-4 ${verified ? 'text-green-400' : 'text-muted-foreground'}`} />
    </div>
    <div>
      <p className={`text-xs font-semibold ${verified ? 'text-green-400' : 'text-muted-foreground'}`}>
        {label}
      </p>
      <p className="text-[10px] text-muted-foreground/50">
        {verified ? 'Verified' : (note || 'Pending verification')}
      </p>
    </div>
    {verified && <ShieldCheck className="w-4 h-4 text-green-500 ml-auto" />}
  </div>
);

// ── LinkedIn "Professional Profile Linked" badge ──────────────────────────────
const LinkedInBadge = ({ url }) => {
  if (!url) return null;
  // Ensure URL has protocol
  const href = url.startsWith('http') ? url : `https://${url}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/25 bg-primary/[0.06] hover:bg-primary/[0.12] transition-all duration-200 group cursor-pointer"
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/15">
        <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary">Professional Profile Linked</p>
        <p className="text-[10px] text-muted-foreground/50">View on LinkedIn</p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors ml-auto" />
    </a>
  );
};

const TrustBadges = ({ user, profileData }) => {
  const hasLinkedIn = !!profileData?.linkedin_url;

  const badges = [
    {
      icon: User,
      label: 'Profile Verified',
      verified: !!user?.is_verified,
    },
    {
      icon: ShieldCheck,
      label: 'Identity Verified',
      verified: !!user?.is_verified,
      note: 'ID not yet submitted',
    },
    {
      icon: GraduationCap,
      label: 'Education Verified',
      verified: !!(profileData?.education_level && profileData?.education_details),
      note: 'Documents not uploaded',
    },
    {
      icon: BadgeDollarSign,
      label: 'Income Verified',
      verified: false,
      note: 'Self-declared',
    },
  ];

  return (
    <div className="card-surface rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-base font-semibold text-foreground">Trust & Verification</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {badges.map(b => <Badge key={b.label} {...b} />)}
      </div>

      {/* LinkedIn professional profile — shown only when linked */}
      {hasLinkedIn && (
        <div className="mt-3">
          <LinkedInBadge url={profileData.linkedin_url} />
        </div>
      )}
    </div>
  );
};

export default TrustBadges;
