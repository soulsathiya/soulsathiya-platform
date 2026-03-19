import React from 'react';
import { Sparkles } from 'lucide-react';

// Derive personality chips from profile data
const deriveChips = (profileData) => {
  const chips = [];

  // Emotional Style — from diet/lifestyle signals
  const dietMap = {
    vegetarian:     { label: 'Mindful & Grounded',  color: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40' },
    non_vegetarian: { label: 'Open & Adaptable',    color: 'bg-blue-900/40 text-blue-400 border-blue-700/40' },
    vegan:          { label: 'Value-Driven',         color: 'bg-teal-900/40 text-teal-400 border-teal-700/40' },
    jain:           { label: 'Deeply Principled',   color: 'bg-violet-900/40 text-violet-400 border-violet-700/40' },
  };
  const dietStyle = profileData?.diet ? dietMap[profileData.diet?.toLowerCase()] : null;
  if (dietStyle) chips.push({ label: dietStyle.label, tag: 'Emotional Style', color: dietStyle.color });

  // Communication Style — from smoking / lifestyle
  if (profileData?.smoking === 'no' || profileData?.smoking === 'never') {
    chips.push({ label: 'Clear Communicator', tag: 'Communication', color: 'bg-sky-900/40 text-sky-400 border-sky-700/40' });
  } else {
    chips.push({ label: 'Direct & Honest', tag: 'Communication', color: 'bg-sky-900/40 text-sky-400 border-sky-700/40' });
  }

  // Relationship Intent — from marital status
  const intentMap = {
    never_married:  { label: 'Ready for First Love',   color: 'bg-pink-900/40 text-pink-400 border-pink-700/40' },
    divorced:       { label: 'Wiser & Open Again',     color: 'bg-rose-900/40 text-rose-400 border-rose-700/40' },
    widowed:        { label: 'Hopeful & Courageous',   color: 'bg-amber-900/40 text-amber-400 border-amber-700/40' },
    separated:      { label: 'Moving Forward',         color: 'bg-orange-900/40 text-orange-400 border-orange-700/40' },
  };
  const ms = profileData?.marital_status?.toLowerCase().replace(' ', '_');
  if (ms && intentMap[ms]) {
    chips.push({ ...intentMap[ms], tag: 'Relationship Intent' });
  }

  // Core Values — from religion
  if (profileData?.religion) {
    chips.push({ label: 'Faith & Family First', tag: 'Core Values', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40' });
  }

  // Hobby-derived chip
  if (profileData?.hobbies?.length > 0) {
    chips.push({ label: 'Passionate & Curious', tag: 'Personality', color: 'bg-purple-900/40 text-purple-400 border-purple-700/40' });
  }

  return chips;
};

const PersonalitySnapshot = ({ profileData }) => {
  const chips = deriveChips(profileData);

  if (!chips.length) return null;

  return (
    <div className="card-surface rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-base font-semibold text-foreground">Personality Snapshot</h2>
        <span className="text-xs text-muted-foreground/60 ml-auto">AI-derived from profile</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((chip, i) => (
          <div key={i} className={`flex flex-col px-3 py-2 rounded-xl border text-xs ${chip.color}`}>
            <span className="text-[10px] uppercase tracking-widest opacity-60 mb-0.5">{chip.tag}</span>
            <span className="font-semibold">{chip.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalitySnapshot;
