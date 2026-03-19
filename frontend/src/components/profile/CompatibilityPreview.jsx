import React from 'react';
import { CheckCircle2, AlertTriangle, Users } from 'lucide-react';

// ── Derive compatibility signals ──────────────────────────────────────────────
const deriveCompatibility = (profileData) => {
  const best    = [];
  const caution = [];

  // Best match signals
  if (profileData?.religion) {
    best.push({ icon: '🏡', text: 'Family-oriented, values-driven partners' });
  }
  if (profileData?.diet === 'vegetarian' || profileData?.diet === 'vegan') {
    best.push({ icon: '🌿', text: 'Health-conscious, mindful individuals' });
  }
  if (profileData?.hobbies?.length > 1) {
    best.push({ icon: '✨', text: 'Curious, growth-oriented people' });
  }
  if (profileData?.occupation) {
    best.push({ icon: '🎯', text: 'Ambitious, career-aware partners' });
  }
  best.push({ icon: '💬', text: 'Emotionally expressive communicators' });

  // Caution signals
  caution.push({ icon: '⚡', text: 'Highly dominant or controlling personalities' });
  caution.push({ icon: '🔇', text: 'Partners with low emotional availability' });

  if (profileData?.smoking === 'no' || profileData?.smoking === 'never') {
    caution.push({ icon: '🌀', text: 'Significantly different lifestyle habits' });
  }
  if (profileData?.religion) {
    caution.push({ icon: '🧭', text: 'Partners who dismiss family traditions' });
  } else {
    caution.push({ icon: '🧭', text: 'Inflexible or overly rigid personalities' });
  }

  return {
    best:    best.slice(0, 3),
    caution: caution.slice(0, 3),
  };
};

// ── Column ────────────────────────────────────────────────────────────────────
const Column = ({ title, items, type }) => {
  const isGood = type === 'best';
  return (
    <div className={`flex-1 rounded-xl p-4 border ${
      isGood
        ? 'bg-emerald-950/30 border-emerald-800/30'
        : 'bg-amber-950/30 border-amber-800/30'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {isGood
          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        }
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          isGood ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          {title}
        </span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="flex-shrink-0 text-base leading-none mt-px">{item.icon}</span>
            <span className="leading-snug">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const CompatibilityPreview = ({ profileData, firstName }) => {
  const { best, caution } = deriveCompatibility(profileData);

  return (
    <div className="card-surface rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-base font-semibold text-foreground">
          Who {firstName || 'They'} Match Best With
        </h2>
      </div>
      <p className="text-xs text-muted-foreground/50 mb-4">
        Based on personality &amp; relationship signals — not a guarantee
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Column title="Best Match With" items={best}   type="best"    />
        <Column title="Watch Out For"   items={caution} type="caution" />
      </div>
    </div>
  );
};

export default CompatibilityPreview;
