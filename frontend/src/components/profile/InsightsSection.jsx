import React from 'react';
import { Brain, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

// Derive pseudo-scores from profile data (0–100)
const deriveInsights = (profileData) => {
  if (!profileData) return [];

  let emotional = 60;
  let conflict   = 55;
  let loveLang   = 65;
  let attachment = 58;

  // Adjust based on available signals
  if (profileData.diet === 'vegetarian' || profileData.diet === 'vegan') emotional += 10;
  if (profileData.smoking === 'no' || profileData.smoking === 'never') emotional += 8;
  if (profileData.hobbies?.length > 2) loveLang += 12;
  if (profileData.religion) attachment += 8;
  if (profileData.marital_status === 'never_married') conflict += 10;

  // Clamp to 0–100
  const clamp = v => Math.min(100, Math.max(0, v));

  return [
    {
      label: 'Emotional Strength',
      score: clamp(emotional),
      description: 'Ability to connect and express feelings',
      color: 'from-emerald-500 to-teal-400',
    },
    {
      label: 'Conflict Resolution',
      score: clamp(conflict),
      description: 'Approach to handling disagreements',
      color: 'from-sky-500 to-blue-400',
    },
    {
      label: 'Love Language Expression',
      score: clamp(loveLang),
      description: 'How affection and care is communicated',
      color: 'from-pink-500 to-rose-400',
    },
    {
      label: 'Attachment Security',
      score: clamp(attachment),
      description: 'Stability in forming emotional bonds',
      color: 'from-violet-500 to-purple-400',
    },
  ];
};

const ScoreBar = ({ label, score, description, color, blurred }) => (
  <div className={blurred ? 'select-none' : ''}>
    <div className="flex items-center justify-between mb-1">
      <span className={`text-sm font-medium ${blurred ? 'blur-sm text-muted-foreground' : 'text-foreground'}`}>
        {label}
      </span>
      <span className={`text-xs font-semibold tabular-nums ${blurred ? 'blur-sm text-muted-foreground' : 'text-primary'}`}>
        {score}%
      </span>
    </div>
    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} ${blurred ? 'blur-sm' : ''}`}
        style={{ width: `${score}%`, transition: 'width 1s ease-out' }}
      />
    </div>
    <p className={`text-xs ${blurred ? 'blur-sm text-muted-foreground/40' : 'text-muted-foreground/60'}`}>
      {description}
    </p>
  </div>
);

const InsightsSection = ({ profileData, isPremiumUnlocked }) => {
  const insights = deriveInsights(profileData);
  const blurred = !isPremiumUnlocked;

  return (
    <div className="card-surface rounded-2xl p-6 mb-6 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-base font-semibold text-foreground">
          SoulSathiya Insights
        </h2>
        {blurred && (
          <span className="ml-auto flex items-center gap-1 text-xs text-primary/70">
            <Lock className="w-3 h-3" /> Premium
          </span>
        )}
      </div>

      <div className="space-y-5">
        {insights.map(item => (
          <ScoreBar key={item.label} {...item} blurred={blurred} />
        ))}
      </div>

      {/* Unlock overlay */}
      {blurred && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-2xl">
          <Lock className="w-8 h-8 text-primary/50 mb-2" />
          <p className="text-sm text-muted-foreground text-center mb-3 max-w-xs">
            Unlock the full psychological breakdown with a Compatibility Report
          </p>
          <Link to="/insights">
            <button className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              Unlock for ₹999
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default InsightsSection;
