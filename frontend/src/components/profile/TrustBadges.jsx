import React from 'react';
import { ShieldCheck, User, GraduationCap, BadgeDollarSign } from 'lucide-react';

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

const TrustBadges = ({ user, profileData }) => {
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
    </div>
  );
};

export default TrustBadges;
