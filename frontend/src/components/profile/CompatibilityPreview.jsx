import React from 'react';
import { CheckCircle2, AlertTriangle, Users } from 'lucide-react';

// ── Derive compatibility signals ──────────────────────────────────────────────
const deriveCompatibility = (profileData) => {
  const best    = [];
  const caution = [];

  // Best match signals
  best.push({ icon: '🏡', text: 'Family-oriented, values-driven individuals' });
  if (profileData?.diet === 'vegetarian' || profileData?.diet === 'vegan') {
    best.push({ icon: '🌿', text: 'Health-conscious, lifestyle-aligned partners' });
  }
  if (profileData?.hobbies?.length > 1) {
    best.push({ icon: '✨', text: 'Curious, growth-oriented communicators' });
  }
  if (profileData?.occupation) {
    best.push({ icon: '🎯', text: 'Purpose-driven, career-aware partners' });
  }
  best.push({ icon: '💬', text: 'Emotionally expressive and open communicators' });

  // Compatibility differences — framed as dynamics, not judgements
  caution.push({ icon: '⚡', text: 'Highly dominant or controlling communication styles' });
  caution.push({ icon: '🔇', text: 'Partners who prefer limited emotional expression' });

  if (profileData?.smoking === 'no' || profileData?.smoking === 'never') {
    caution.push({ icon: '🌀', text: 'Very different day-to-day lifestyle rhythms' });
  }
  caution.push({ icon: '🧭', text: 'Those who are resistant to long-term planning or commitment' });

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
        <Column title="Best Match With"               items={best}    type="best"    />
        <Column title="May Experience Differences With" items={caution} type="caution" />
      </div>

      {/* Trust disclaimer */}
      <p className="text-[11px] text-muted-foreground/40 mt-4 leading-relaxed border-t border-border/20 pt-3">
        These insights are based on behavioral and emotional patterns — intended as guidance, not definitive conclusions.
      </p>
    </div>
  );
};

export default CompatibilityPreview;
