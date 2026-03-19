import React from 'react';
import { FileText } from 'lucide-react';

// ── Auto-generate a narrative personality summary ─────────────────────────────
const generateSummary = (user, profileData, age) => {
  const name       = user?.full_name?.split(' ')[0] || 'This individual';
  const occupation = profileData?.occupation;
  const city       = profileData?.city;
  const religion   = profileData?.religion;
  const diet       = profileData?.diet?.toLowerCase();
  const hobbies    = profileData?.hobbies || [];
  const edu        = profileData?.education_level;
  const ms         = profileData?.marital_status?.toLowerCase().replace(/\s+/g, '_');

  // Trait descriptors
  const traits = [];
  if (diet === 'vegetarian' || diet === 'vegan') traits.push('grounded and mindful');
  else traits.push('open-minded and adaptable');
  if (religion) traits.push('values-driven');
  if (hobbies.length > 1) traits.push('passionately curious');

  const traitStr = traits.length >= 2
    ? traits.slice(0, 2).join(' yet ')
    : traits[0] || 'thoughtful and sincere';

  // Intent
  const intentMap = {
    never_married: 'seeking a meaningful first partnership',
    divorced:      'ready for a new chapter with clarity and purpose',
    widowed:       'choosing hope and openness once more',
    separated:     'moving forward with self-awareness and intent',
  };
  const intent = intentMap[ms] || 'looking for a genuine lifelong connection';

  // Build sentence
  const parts = [];

  if (occupation && age) {
    parts.push(`A ${occupation.toLowerCase()} at ${age}, ${name} blends ambition with emotional maturity.`);
  } else if (occupation) {
    parts.push(`A ${occupation.toLowerCase()}, ${name} brings both professional clarity and emotional depth to relationships.`);
  } else {
    parts.push(`${name} is a ${traitStr} individual who values authenticity above all.`);
  }

  if (religion || hobbies.length > 0) {
    const anchor = religion ? `deeply rooted in ${religion.toLowerCase()} values` : 'fuelled by curiosity and personal passions';
    parts.push(`${anchor === parts[0] ? 'They are' : name + ' is'} ${anchor}.`);
  }

  parts.push(`${intent.charAt(0).toUpperCase() + intent.slice(1)} — built on trust, growth, and genuine companionship.`);

  return parts.join(' ');
};

// ── Component ─────────────────────────────────────────────────────────────────
const PersonalitySummary = ({ user, profileData, age }) => {
  const summary = generateSummary(user, profileData, age);

  return (
    <div
      className="rounded-2xl p-6 mb-6 border border-primary/15 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1929 0%, #0c1323 100%)' }}
    >
      {/* Gold glow */}
      <div
        className="absolute bottom-0 left-0 w-56 h-32 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, #D4A520 0%, transparent 70%)' }}
      />

      <div className="relative flex items-start gap-3">
        <FileText className="w-4 h-4 text-primary/70 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary/50 font-semibold mb-2">
            AI Personality Profile
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalitySummary;
