import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

// ── Trait derivation ──────────────────────────────────────────────────────────
const deriveTraits = (profileData) => {
  const traits = [];

  // Emotional Style — diet signals
  const dietTraits = {
    vegetarian: {
      tag: 'Emotional Style', title: 'Mindful & Grounded',
      explanation: 'Approaches relationships with calm intentionality. Values inner peace and avoids unnecessary drama.',
      color: 'border-emerald-700/40 bg-emerald-900/25 text-emerald-400',
      dot: 'bg-emerald-400',
    },
    non_vegetarian: {
      tag: 'Emotional Style', title: 'Open & Adaptable',
      explanation: 'Adjusts easily in relationships and values harmony over ego. Rarely rigid about preferences.',
      color: 'border-blue-700/40 bg-blue-900/25 text-blue-400',
      dot: 'bg-blue-400',
    },
    vegan: {
      tag: 'Emotional Style', title: 'Value-Driven',
      explanation: 'Strong personal convictions guide decision-making. Seeks a partner who respects and shares core beliefs.',
      color: 'border-teal-700/40 bg-teal-900/25 text-teal-400',
      dot: 'bg-teal-400',
    },
    jain: {
      tag: 'Emotional Style', title: 'Deeply Principled',
      explanation: 'Lives by a clear moral compass. Brings discipline and thoughtfulness to every relationship decision.',
      color: 'border-violet-700/40 bg-violet-900/25 text-violet-400',
      dot: 'bg-violet-400',
    },
  };
  const diet = profileData?.diet?.toLowerCase();
  if (diet && dietTraits[diet]) traits.push(dietTraits[diet]);

  // Communication — smoking/lifestyle
  if (profileData?.smoking === 'no' || profileData?.smoking === 'never') {
    traits.push({
      tag: 'Communication', title: 'Clear Communicator',
      explanation: 'Prefers honest, direct conversations. Resolves misunderstandings with patience and clarity.',
      color: 'border-sky-700/40 bg-sky-900/25 text-sky-400',
      dot: 'bg-sky-400',
    });
  } else {
    traits.push({
      tag: 'Communication', title: 'Direct & Honest',
      explanation: 'Prefers clarity and transparency over indirect communication. Values authenticity in conversations.',
      color: 'border-sky-700/40 bg-sky-900/25 text-sky-400',
      dot: 'bg-sky-400',
    });
  }

  // Relationship Intent — marital status
  const intentMap = {
    never_married: {
      tag: 'Relationship Intent', title: 'Ready for First Love',
      explanation: 'Approaching this chapter with genuine excitement and optimism. No baggage — only openness.',
      color: 'border-pink-700/40 bg-pink-900/25 text-pink-400',
      dot: 'bg-pink-400',
    },
    divorced: {
      tag: 'Relationship Intent', title: 'Wiser & Open Again',
      explanation: 'Brings lived experience and emotional clarity. Knows what they want and why.',
      color: 'border-rose-700/40 bg-rose-900/25 text-rose-400',
      dot: 'bg-rose-400',
    },
    widowed: {
      tag: 'Relationship Intent', title: 'Hopeful & Courageous',
      explanation: 'Choosing hope over loss. Brings deep capacity for love and emotional strength.',
      color: 'border-amber-700/40 bg-amber-900/25 text-amber-400',
      dot: 'bg-amber-400',
    },
    separated: {
      tag: 'Relationship Intent', title: 'Moving Forward',
      explanation: 'Embracing a fresh start with clarity and self-awareness. Focused on building something real.',
      color: 'border-orange-700/40 bg-orange-900/25 text-orange-400',
      dot: 'bg-orange-400',
    },
  };
  const ms = profileData?.marital_status?.toLowerCase().replace(/\s+/g, '_');
  if (ms && intentMap[ms]) traits.push(intentMap[ms]);

  // Core Values — religion
  if (profileData?.religion) {
    traits.push({
      tag: 'Core Values', title: 'Faith & Family First',
      explanation: 'Family bonds and cultural roots are non-negotiable anchors. Brings stability and long-term thinking.',
      color: 'border-yellow-700/40 bg-yellow-900/25 text-yellow-400',
      dot: 'bg-yellow-400',
    });
  }

  // Personality — hobbies
  if (profileData?.hobbies?.length > 0) {
    traits.push({
      tag: 'Personality', title: 'Passionate & Curious',
      explanation: 'Has active interests outside of work. Brings energy, stories, and enthusiasm to the relationship.',
      color: 'border-purple-700/40 bg-purple-900/25 text-purple-400',
      dot: 'bg-purple-400',
    });
  }

  return traits;
};

// ── Chip ─────────────────────────────────────────────────────────────────────
const Chip = ({ trait, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col px-3 py-2.5 rounded-xl border text-left
      transition-all duration-200 cursor-pointer
      hover:scale-[1.03] hover:shadow-lg
      ${trait.color}
      ${isActive ? 'ring-2 ring-offset-1 ring-offset-background ring-white/20 scale-[1.03]' : ''}
    `}
  >
    <span className="text-[10px] uppercase tracking-widest opacity-60 mb-0.5 flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${trait.dot}`} />
      {trait.tag}
    </span>
    <span className="text-xs font-semibold">{trait.title}</span>
  </button>
);

// ── Expanded detail ───────────────────────────────────────────────────────────
const TraitDetail = ({ trait, onClose }) => (
  <div
    className={`
      rounded-xl border p-4 mt-1 animate-in slide-in-from-top-2 duration-200
      ${trait.color}
    `}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold mb-1">{trait.title}</p>
        <p className="text-xs leading-relaxed opacity-80">{trait.explanation}</p>
      </div>
      <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const PersonalitySnapshot = ({ profileData }) => {
  const [activeIdx, setActiveIdx] = useState(null);
  const traits = deriveTraits(profileData);

  if (!traits.length) return null;

  const toggleTrait = (idx) => setActiveIdx(prev => (prev === idx ? null : idx));

  return (
    <div className="card-surface rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-base font-semibold text-foreground">Personality Snapshot</h2>
      </div>
      <p className="text-xs text-muted-foreground/50 mb-4">Tap any trait to understand it deeper</p>

      <div className="flex flex-wrap gap-2">
        {traits.map((trait, i) => (
          <Chip
            key={trait.title}
            trait={trait}
            isActive={activeIdx === i}
            onClick={() => toggleTrait(i)}
          />
        ))}
      </div>

      {/* Expanded detail panel */}
      {activeIdx !== null && traits[activeIdx] && (
        <TraitDetail
          trait={traits[activeIdx]}
          onClose={() => setActiveIdx(null)}
        />
      )}
    </div>
  );
};

export default PersonalitySnapshot;
