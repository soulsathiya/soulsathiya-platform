import React from 'react';
import { Quote } from 'lucide-react';

const PLACEHOLDERS = [
  "Looking for someone who laughs at the same things and values quiet evenings as much as adventures.",
  "I believe the best relationships are built on friendship, trust, and shared values.",
  "Seeking a partner who inspires growth and feels like home.",
];

const getPlaceholder = (name) => {
  if (!name) return PLACEHOLDERS[0];
  return PLACEHOLDERS[name.charCodeAt(0) % PLACEHOLDERS.length];
};

const UserVoice = ({ bio, userName }) => {
  const text = bio?.trim() || getPlaceholder(userName);
  const isPlaceholder = !bio?.trim();

  return (
    <div className="card-surface rounded-2xl p-6 mb-6 relative overflow-hidden">
      {/* Decorative quote mark */}
      <div
        className="absolute top-3 right-5 text-primary/10 font-heading font-bold select-none pointer-events-none"
        style={{ fontSize: '7rem', lineHeight: 1 }}
      >
        "
      </div>

      <div className="flex items-start gap-3 relative">
        <Quote className="w-5 h-5 text-primary/60 flex-shrink-0 mt-0.5" />
        <div>
          <p className={`text-sm leading-relaxed ${isPlaceholder ? 'text-muted-foreground/50 italic' : 'text-foreground/85'}`}>
            {text}
          </p>
          {!isPlaceholder && (
            <p className="text-xs text-muted-foreground/50 mt-2">— {userName?.split(' ')[0]}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserVoice;
