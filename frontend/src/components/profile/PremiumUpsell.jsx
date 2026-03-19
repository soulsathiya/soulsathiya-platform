import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Check, Sparkles, ArrowRight } from 'lucide-react';

const FEATURES = [
  'Full psychological compatibility breakdown',
  'Relationship strengths & friction points',
  'Communication style analysis',
  'Long-term alignment score',
  'Conflict resolution insights',
  'Love language compatibility map',
];

const PremiumUpsell = ({ targetName }) => (
  <div className="relative rounded-2xl overflow-hidden mb-6 border border-primary/20">
    {/* Background gradient */}
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(135deg, #0c1323 0%, #1a1208 100%)' }}
    />
    <div
      className="absolute inset-0 opacity-15"
      style={{ background: 'radial-gradient(ellipse at 70% 30%, #D4A520 0%, transparent 60%)' }}
    />

    <div className="relative px-6 py-8">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-semibold uppercase tracking-wider">Premium Report</span>
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            Unlock Your Full Compatibility Report
            {targetName && <span className="text-primary"> with {targetName}</span>}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Deep psychological insights to help you decide with clarity and confidence.
          </p>
        </div>
      </div>

      {/* Blurred preview strip */}
      <div className="relative rounded-xl overflow-hidden mb-5 border border-white/10">
        <div className="px-4 py-3 space-y-2 select-none">
          {['Emotional compatibility: 87%', 'Core values alignment: 91%', 'Long-term potential: High'].map((line, i) => (
            <div key={i} className="h-4 bg-white/10 rounded-full" style={{ width: `${65 + i * 10}%` }} />
          ))}
        </div>
        <div className="absolute inset-0 backdrop-blur-sm bg-background/60 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary/50 mr-2" />
          <span className="text-sm text-muted-foreground">Unlock to reveal</span>
        </div>
      </div>

      {/* Feature checklist */}
      <ul className="space-y-2 mb-6">
        {FEATURES.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link to="/insights">
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-xl shadow-primary/20">
          Unlock Full Report — ₹999
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>

      <p className="text-xs text-muted-foreground/50 mt-3">
        One-time payment · No subscription · Instant access
      </p>
    </div>
  </div>
);

export default PremiumUpsell;
