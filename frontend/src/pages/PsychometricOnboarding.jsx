import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, ArrowLeft, ArrowRight, Sparkles, Star, TrendingUp, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Stage definitions ─────────────────────────────────────────────────────────
const STAGES = [
  {
    name:    'Emotional Foundation',
    domain:  'emotional_style',
    start: 0, end: 6,
    emoji:   '💛',
    desc:    'Explore how you feel and connect emotionally',
    color:   '#F59E0B',
    dimKey:  'Emotional Maturity',
    insights: {
      high: ['You show deep emotional self-awareness', 'You naturally create warmth and safety in relationships'],
      mid:  ['You value authentic emotional expression', 'You\'re developing strong emotional resilience'],
      low:  ['You approach emotions with thoughtful care', 'You\'re on a meaningful personal growth journey'],
    },
  },
  {
    name:    'Core Personality',
    domain:  'personality',
    start: 6, end: 12,
    emoji:   '🌟',
    desc:    'Uncover the traits that define how you connect',
    color:   '#8B5CF6',
    dimKey:  'Communication',
    insights: {
      high: ['You have a clear and confident sense of self', 'Your authenticity draws genuine, deep connections'],
      mid:  ['You bring a thoughtful balance to every partnership', 'You communicate with care and real intention'],
      low:  ['You\'re discovering your unique relationship identity', 'Growth in self-expression will open new doors'],
    },
  },
  {
    name:    'Trust & Security',
    domain:  'values',
    start: 12, end: 18,
    emoji:   '🛡️',
    desc:    'Understand how you build trust and feel secure',
    color:   '#10B981',
    dimKey:  'Life Stability',
    insights: {
      high: ['You value stability and long-term intentional planning', 'Trust is the bedrock of how you love'],
      mid:  ['You approach commitment with thoughtful care', 'You balance security with personal freedom beautifully'],
      low:  ['You are thoughtfully building your foundation of trust', 'Your honesty is your greatest relationship superpower'],
    },
  },
  {
    name:    'Life Alignment',
    domain:  'trust_attachment',
    start: 18, end: 23,
    emoji:   '🧭',
    desc:    'Discover how your life vision aligns with a partner',
    color:   '#3B82F6',
    dimKey:  'Conflict Handling',
    insights: {
      high: ['You navigate disagreements with admirable maturity', 'You seek deep understanding over simply being right'],
      mid:  ['You\'re developing constructive ways to handle conflict', 'You value resolution and always move forward'],
      low:  ['You prefer harmony and peace above all else', 'You\'re learning to express your needs with confidence'],
    },
  },
  {
    name:    'Growth & Adaptability',
    domain:  'lifestyle',
    start: 23, end: 29,
    emoji:   '🌱',
    desc:    'See how you evolve and adapt within relationships',
    color:   '#14B8A6',
    dimKey:  'Life Stability',
    insights: {
      high: ['You embrace growth as a shared couple journey', 'Your adaptability is one of your greatest relationship gifts'],
      mid:  ['You balance stability with a beautiful openness to change', 'You value growth while honouring your roots'],
      low:  ['You treasure consistency and deep reliability', 'Your steady, grounded nature brings real security to partnerships'],
    },
  },
  {
    name:    'Commitment & Expectations',
    domain:  'growth_mindset',
    start: 29, end: 32,
    emoji:   '💍',
    desc:    'Clarify what commitment and readiness means to you',
    color:   '#F43F5E',
    dimKey:  'Commitment',
    insights: {
      high: ['You are deeply and genuinely ready for commitment', 'You bring real intention and purpose to your relationships'],
      mid:  ['You are thoughtfully preparing for true partnership', 'Your realistic expectations create lasting, honest bonds'],
      low:  ['You approach commitment with beautiful care and caution', 'You value quality and depth over speed in relationships'],
    },
  },
  {
    name:    'Marriage & Vision',
    domain:  'marriage_expectations',
    start: 32, end: 36,
    emoji:   '🏡',
    desc:    'Paint the picture of the life partnership you envision',
    color:   '#D4AF37',
    dimKey:  'Commitment',
    insights: {
      high: ['Your relationship vision is clear, vivid and inspiring', 'You bring powerful intention to building a life together'],
      mid:  ['You have a thoughtful, evolving vision for your future', 'You\'re building your dream partnership intentionally'],
      low:  ['You\'re open to lovingly shaping your vision over time', 'Your beautiful flexibility will help you build something lasting'],
    },
  },
];

// ── Readiness score engine ────────────────────────────────────────────────────
const DIM_WEIGHTS = {
  'Emotional Maturity': 0.25,
  'Communication':      0.20,
  'Life Stability':     0.20,
  'Conflict Handling':  0.20,
  'Commitment':         0.15,
};

function calcReadiness(responses, questions) {
  const buckets = { 'Emotional Maturity': [], 'Communication': [], 'Life Stability': [], 'Conflict Handling': [], 'Commitment': [] };
  STAGES.forEach(stage => {
    for (let i = stage.start; i < stage.end; i++) {
      const q = questions[i];
      if (!q) continue;
      const val = responses[q.question_id];
      if (val !== undefined) buckets[stage.dimKey].push(val);
    }
  });

  const dimScores = {};
  Object.entries(buckets).forEach(([dim, vals]) => {
    if (!vals.length) { dimScores[dim] = 50; return; }
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    dimScores[dim] = Math.round(((avg - 1) / 4) * 100);
  });

  const overall = Math.min(100, Math.max(0, Math.round(
    Object.entries(dimScores).reduce((sum, [k, v]) => sum + v * (DIM_WEIGHTS[k] || 0), 0)
  )));
  return { overall, dimScores };
}

function getStageInsights(stage, responses, questions) {
  const vals = questions.slice(stage.start, stage.end)
    .map(q => responses[q.question_id]).filter(v => v !== undefined);
  if (!vals.length) return stage.insights.mid;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return avg >= 3.8 ? stage.insights.high : avg >= 2.5 ? stage.insights.mid : stage.insights.low;
}

function getStrengthsGrowth(dimScores) {
  const strengthMap = {
    'Emotional Maturity': 'Strong emotional self-awareness and deep empathy',
    'Communication':      'Clear, authentic and heartfelt communication style',
    'Life Stability':     'Grounded values and a clear, purposeful life direction',
    'Conflict Handling':  'Mature, calm approach to navigating disagreements',
    'Commitment':         'Deep readiness for meaningful, lasting commitment',
  };
  const growthMap = {
    'Emotional Maturity': 'Deepening emotional vulnerability in close partnerships',
    'Communication':      'Building openness and directness in intimate moments',
    'Life Stability':     'Clarifying long-term life and relationship direction',
    'Conflict Handling':  'Developing constructive, empathetic conflict resolution',
    'Commitment':         'Exploring and crystallising your vision for partnership',
  };
  const sorted = Object.entries(dimScores).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.filter(([, v]) => v >= 55).slice(0, 3).map(([k]) => strengthMap[k]).filter(Boolean);
  const growth    = sorted.filter(([, v]) => v < 65).reverse().slice(0, 3).map(([k]) => growthMap[k]).filter(Boolean);
  return {
    strengths: strengths.length ? strengths : ['Well-balanced readiness across all dimensions'],
    growth:    growth.length    ? growth    : ['Continue nurturing your relationship self-awareness'],
  };
}

function scoreLabel(n) {
  // Qualitative badges only — no numeric score shown to user
  if (n >= 85) return { label: 'Exceptionally Self-Aware',  color: '#10B981' };
  if (n >= 70) return { label: 'Strong Self-Awareness',     color: '#3B82F6' };
  if (n >= 55) return { label: 'Growing Self-Awareness',    color: '#F59E0B' };
  return             { label: 'Beginning Your Journey',     color: '#8B5CF6' };
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Top stage stepper */
function StageStepper({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const stage = STAGES[i];
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background:  done ? '#D4AF37' : active ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                border:      `2px solid ${done ? '#D4AF37' : active ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`,
                color:       done ? '#000' : active ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                transform:   active ? 'scale(1.15)' : 'scale(1)',
              }}
              title={stage.name}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : stage.emoji || i + 1}
            </div>
            {i < total - 1 && (
              <div className="w-5 h-px transition-all duration-500" style={{ background: done ? '#D4AF37' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Option button card */
function OptionCard({ option, index, selected, onClick }) {
  const isSelected = selected === index + 1;
  return (
    <button
      type="button"
      onClick={() => onClick(index + 1)}
      className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 group"
      style={{
        background:    isSelected ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
        borderColor:   isSelected ? 'rgba(212,175,55,0.7)'  : 'rgba(255,255,255,0.08)',
        boxShadow:     isSelected ? '0 0 16px rgba(212,175,55,0.15)' : 'none',
        transform:     isSelected ? 'translateX(4px)' : 'translateX(0)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-200"
          style={{
            background:  isSelected ? '#D4AF37' : 'rgba(255,255,255,0.07)',
            color:       isSelected ? '#000'    : 'rgba(255,255,255,0.4)',
            border:      `1.5px solid ${isSelected ? '#D4AF37' : 'rgba(255,255,255,0.15)'}`,
          }}
        >
          {isSelected ? <Check className="w-3.5 h-3.5" /> : index + 1}
        </div>
        <span
          className="text-sm leading-snug transition-colors duration-200"
          style={{ color: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)' }}
        >
          {option}
        </span>
      </div>
    </button>
  );
}

/** Micro-feedback card shown after completing a section */
function MicroFeedback({ stage, insights, onContinue, isLast }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C1323] to-[#0F1A2E] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center space-y-8"
        style={{ animation: 'fadeScaleIn 0.4s ease-out' }}>

        {/* Stage emoji glow */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{ background: `${stage.color}20`, border: `2px solid ${stage.color}40`, boxShadow: `0 0 32px ${stage.color}25` }}
          >
            {stage.emoji}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: stage.color }}>
            {stage.name} — Complete
          </p>
          <h2 className="font-heading text-2xl font-bold text-white">
            Here's what we learned about you
          </h2>
        </div>

        {/* Insight chips */}
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3.5 rounded-xl text-left"
              style={{
                background:  `${stage.color}10`,
                border:      `1px solid ${stage.color}25`,
                animation:   `fadeScaleIn 0.4s ease-out ${0.1 + i * 0.1}s both`,
              }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${stage.color}30` }}>
                <Sparkles className="w-3 h-3" style={{ color: stage.color }} />
              </div>
              <p className="text-sm text-white/85 font-medium">{insight}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC5A)', color: '#000' }}
        >
          {isLast ? 'See My Compatibility Profile' : `Continue to ${STAGES[STAGES.indexOf(stage) + 1]?.name || 'Next Stage'}`}
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-white/25">
          {isLast ? 'Building your compatibility profile…' : `${STAGES.length - STAGES.indexOf(stage) - 1} stage${STAGES.length - STAGES.indexOf(stage) - 1 !== 1 ? 's' : ''} remaining`}
        </p>
      </div>
    </div>
  );
}

/** Animated score counter */
function ScoreCounter({ target }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{display}</>;
}

/** Circular badge ring — shows qualitative label instead of numeric score */
function ScoreRing({ score, size = 180 }) {
  const r   = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ;  // full ring — celebratory, not judgmental
  const { color, label } = scoreLabel(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={14} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray 1.8s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <span className="text-3xl">&#10003;</span>
        <span className="text-xs font-bold text-white/70 mt-1 text-center leading-tight">{label}</span>
      </div>
    </div>
  );
}

/** Dim bar for dimension scores — shows qualitative label, not numeric % */
function DimBar({ label, score, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(score), 200); return () => clearTimeout(t); }, [score]);
  const dimLabel = score >= 75 ? 'Strong' : score >= 55 ? 'Developing' : 'Emerging';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/65 font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>{dimLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }}
        />
      </div>
    </div>
  );
}

/** Final result screen */
function ResultScreen({ score, dimScores, onDashboard }) {
  const { label, color } = scoreLabel(score);
  const { strengths, growth } = getStrengthsGrowth(dimScores);
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);

  const dimLabels = {
    'Emotional Maturity': 'Emotional Maturity',
    'Communication':      'Communication',
    'Life Stability':     'Life Stability',
    'Conflict Handling':  'Conflict Handling',
    'Commitment':         'Commitment Readiness',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C1323] via-[#0F1A2E] to-[#0C1323] flex items-center justify-center px-4 py-12">
      <div
        className="max-w-2xl w-full space-y-8"
        style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <Star className="w-3.5 h-3.5 fill-yellow-400" /> SoulSathiya Relationship Intelligence
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">Your Compatibility Profile is Live!</h1>
          <p className="text-white/45 text-sm">Here's what we learned about you across 7 relationship dimensions</p>
        </div>

        {/* Score card */}
        <div
          className="rounded-2xl p-8 text-center space-y-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${color}35`, boxShadow: `0 0 48px ${color}12` }}
        >
          <div className="flex justify-center">
            <ScoreRing score={score} size={200} />
          </div>
          <div>
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm mb-2"
              style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
            >
              <TrendingUp className="w-4 h-4" />
              {label}
            </div>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Your compatibility profile is now active. SoulSathiya will use these insights to find your most compatible matches.
            </p>
          </div>

          {/* Dimension breakdown */}
          <div className="space-y-3 pt-2 border-t border-white/6">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest text-left">Dimension Breakdown</p>
            {Object.entries(dimScores).map(([dim, s]) => (
              <DimBar key={dim} label={dimLabels[dim] || dim} score={s} color={color} />
            ))}
          </div>
        </div>

        {/* Strengths & Growth grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              </div>
              <p className="text-sm font-bold text-emerald-400">Your Strengths</p>
            </div>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Growth areas */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-sm font-bold text-yellow-400">Growth Areas</p>
            </div>
            <ul className="space-y-2">
              {growth.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                  <ChevronRight className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <button
            onClick={onDashboard}
            className="w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 mx-auto transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC5A)', color: '#000' }}
          >
            <Sparkles className="w-4 h-4" />
            Explore Your Compatible Matches
          </button>
          <p className="text-xs text-white/25">Your compatibility profile is now active and will improve your matches</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const PsychometricOnboarding = () => {
  const navigate     = useNavigate();
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions,  setQuestions]  = useState([]);
  const [responses,  setResponses]  = useState({});
  const [stage,      setStage]      = useState(0);
  // 'quiz' | 'feedback' | 'result'
  const [view,       setView]       = useState('quiz');
  const [result,     setResult]     = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/psychometric/questions`, { withCredentials: true });
        setQuestions(data.questions || []);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
        else toast.error('Failed to load questionnaire. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const currentStage = STAGES[stage];
  const stageQs      = questions.slice(currentStage.start, currentStage.end);
  const isComplete   = stageQs.every(q => responses[q.question_id] !== undefined);
  const totalAnswered = Object.keys(responses).length;
  const pct           = Math.round((totalAnswered / 36) * 100);

  const handleSelect = (qId, val) => {
    setResponses(prev => ({ ...prev, [qId]: val }));
  };

  const scrollTop = () => { topRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const handleNext = () => {
    if (!isComplete) { toast.error('Please answer all questions before continuing.'); return; }
    scrollTop();
    setView('feedback');
  };

  const handleFeedbackContinue = () => {
    scrollTop();
    if (stage < STAGES.length - 1) {
      setStage(s => s + 1);
      setView('quiz');
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (stage > 0) { setStage(s => s - 1); scrollTop(); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { overall, dimScores } = calcReadiness(responses, questions);
    try {
      const formatted = Object.entries(responses).map(([question_id, response]) => ({ question_id, response }));
      await axios.post(`${BACKEND_URL}/api/psychometric/submit`, { responses: formatted }, { withCredentials: true });
      setResult({ overall, dimScores });
      setView('result');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error((Array.isArray(detail) ? detail[0]?.msg : detail) || 'Submission failed. Please retry.');
      setView('quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || submitting) {
    return (
      <div className="min-h-screen bg-[#0C1323] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
        <p className="text-white/40 text-sm animate-pulse">
          {submitting ? 'Building your compatibility profile…' : 'Loading your journey…'}
        </p>
      </div>
    );
  }

  // ── Micro-feedback ────────────────────────────────────────────────────────
  if (view === 'feedback') {
    const insights = getStageInsights(currentStage, responses, questions);
    return (
      <MicroFeedback
        stage={currentStage}
        insights={insights}
        onContinue={handleFeedbackContinue}
        isLast={stage === STAGES.length - 1}
      />
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (view === 'result' && result) {
    return <ResultScreen score={result.overall} dimScores={result.dimScores} onDashboard={() => navigate('/matches?new=true')} />;
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  return (
    <div ref={topRef} className="min-h-screen bg-gradient-to-b from-[#0C1323] to-[#0F1A2E] px-4 py-10">
      <div className="container mx-auto max-w-2xl">

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
          <span className="text-xl font-heading font-bold text-white">
            Soul<span style={{ color: '#D4AF37' }}>Sathiya</span>
          </span>
        </div>

        {/* ── Progress header ──────────────────────────────────────────── */}
        <div className="text-center mb-8 space-y-4">
          <StageStepper current={stage} total={STAGES.length} />

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: currentStage.color }}>
              Stage {stage + 1} of {STAGES.length} &nbsp;•&nbsp; {pct}% Complete
            </p>
            <h1 className="font-heading text-2xl font-bold text-white">{currentStage.name}</h1>
            <p className="text-sm text-white/45">{currentStage.desc}</p>
          </div>

          {/* Progress bar */}
          <div className="max-w-sm mx-auto">
            <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, #D4AF37aa, #D4AF37)` }}
              />
            </div>
            <p className="text-xs text-white/25 mt-2">
              You're building your relationship intelligence profile
            </p>
          </div>
        </div>

        {/* ── Questions card ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-6 space-y-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border:     `1px solid ${currentStage.color}20`,
            boxShadow:  `0 0 40px ${currentStage.color}08`,
          }}
        >
          {/* Stage badge */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/6">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${currentStage.color}18`, border: `1px solid ${currentStage.color}30` }}
            >
              {currentStage.emoji}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{currentStage.name}</p>
              <p className="text-xs text-white/35">{stageQs.length} questions</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs font-semibold text-white/30 bg-white/5 px-3 py-1 rounded-full">
                {stageQs.filter(q => responses[q.question_id] !== undefined).length}/{stageQs.length} answered
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-8">
            {stageQs.map((q, qi) => {
              const answered = responses[q.question_id] !== undefined;
              return (
                <div key={q.question_id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-all duration-200"
                      style={{
                        background:   answered ? `${currentStage.color}30` : 'rgba(255,255,255,0.06)',
                        color:        answered ? currentStage.color         : 'rgba(255,255,255,0.3)',
                        border:       `1.5px solid ${answered ? currentStage.color + '50' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      {answered ? <Check className="w-3.5 h-3.5" /> : qi + 1}
                    </div>
                    <p className="text-sm font-medium text-white/85 leading-relaxed pt-0.5">
                      {q.question_text}
                    </p>
                  </div>
                  <div className="ml-9 space-y-2">
                    {q.options.map((opt, oi) => (
                      <OptionCard
                        key={oi}
                        option={opt}
                        index={oi}
                        selected={responses[q.question_id]}
                        onClick={val => handleSelect(q.question_id, val)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={stage === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2 text-xs text-white/25">
            {stage + 1} / {STAGES.length}
          </div>

          <button
            onClick={handleNext}
            disabled={!isComplete}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: isComplete ? 'linear-gradient(90deg,#D4AF37,#F0CC5A)' : 'rgba(212,175,55,0.15)',
              color:      isComplete ? '#000' : 'rgba(212,175,55,0.5)',
            }}
          >
            {stage === STAGES.length - 1 ? 'Complete Journey' : 'Next Stage'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Bottom hint ───────────────────────────────────────────────── */}
        {!isComplete && (
          <p className="text-center text-xs text-white/20 mt-4">
            Answer all {stageQs.length} questions above to continue
          </p>
        )}
      </div>

      {/* ── CSS animations (injected once) ───────────────────────────────── */}
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PsychometricOnboarding;
