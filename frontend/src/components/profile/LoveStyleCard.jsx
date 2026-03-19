import React from 'react';
import { Heart } from 'lucide-react';

// ── Derive love style description ─────────────────────────────────────────────
const deriveLoveStyle = (profileData) => {
  if (!profileData) return null;

  const signals = new Set();
  if (profileData.diet === 'vegetarian' || profileData.diet === 'vegan') signals.add('mindful');
  if (profileData.hobbies?.length > 1)                                   signals.add('expressive');
  if (profileData.religion)                                               signals.add('grounded');
  if (profileData.smoking === 'no' || profileData.smoking === 'never')   signals.add('intentional');
  if (profileData.marital_status === 'never_married')                    signals.add('hopeful');
  if (profileData.occupation)                                             signals.add('driven');

  // Match signal combination → love style description
  if (signals.has('expressive') && signals.has('mindful')) {
    return {
      headline: 'Through shared experiences and genuine presence',
      body: 'Shows love through quality time, meaningful shared moments, and quiet acts of care. Values emotional depth over grand gestures — showing up consistently is how they say "I love you."',
    };
  }
  if (signals.has('grounded') && signals.has('intentional')) {
    return {
      headline: 'Through loyalty, consistency, and quiet commitment',
      body: 'Demonstrates love through reliability and steady presence. Won\'t make a scene, but will always show up. Long-term security and family closeness shape how they express affection.',
    };
  }
  if (signals.has('driven') && signals.has('hopeful')) {
    return {
      headline: 'Through encouragement, ambition, and emotional support',
      body: 'Expresses love by pushing their partner to grow and celebrating every milestone together. Sees the relationship as a joint mission — two people building something meaningful side by side.',
    };
  }
  if (signals.has('mindful') && signals.has('grounded')) {
    return {
      headline: 'Through calm, steady, and rooted affection',
      body: 'Shows care through consistency, presence, and practical support rather than grand gestures. Their love is quiet but deep — felt in the day-to-day details that most people miss.',
    };
  }
  // Default
  return {
    headline: 'Through presence, trust, and thoughtful conversation',
    body: 'Expresses love through emotional honesty and genuine attention. Believes that being truly seen and understood is the foundation of any great relationship.',
  };
};

// ── Component ─────────────────────────────────────────────────────────────────
const LoveStyleCard = ({ profileData, firstName }) => {
  const style = deriveLoveStyle(profileData);
  if (!style) return null;

  return (
    <div
      className="rounded-2xl p-6 mb-6 border border-pink-900/30 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a0d13 0%, #0c1323 100%)' }}
    >
      {/* Decorative glow */}
      <div
        className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, #f43f5e 0%, transparent 70%)' }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
          <h2 className="font-heading text-base font-semibold text-foreground">
            How {firstName || 'This Person'} Loves
          </h2>
        </div>

        <p className="text-sm font-semibold text-pink-300/80 mb-2 italic">
          "{style.headline}"
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {style.body}
        </p>
      </div>
    </div>
  );
};

export default LoveStyleCard;
