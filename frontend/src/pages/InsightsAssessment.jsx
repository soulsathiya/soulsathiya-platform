import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Loader2, X, CheckCircle2, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const GOLD        = '#D4A520';
const NAVY        = '#0C1323';
const CARD        = '#0F1A2E';

// ── Local storage helpers ──────────────────────────────────────────────────────
const LS_TOKEN    = 'insight_guest_token';
const LS_ANSWERS  = 'insight_answers';
const LS_SECTION  = 'insight_current_section';
const LS_QINDEX   = 'insight_current_question';
const LS_COMPLETED = 'insight_completed_sections';

function saveLocal(answers, sectionIdx, qIndex, completed) {
  try {
    localStorage.setItem(LS_ANSWERS, JSON.stringify(answers));
    localStorage.setItem(LS_SECTION, String(sectionIdx));
    localStorage.setItem(LS_QINDEX,  String(qIndex));
    localStorage.setItem(LS_COMPLETED, JSON.stringify(completed));
  } catch (_) {}
}

function loadLocal() {
  try {
    return {
      token:     localStorage.getItem(LS_TOKEN)    || null,
      answers:   JSON.parse(localStorage.getItem(LS_ANSWERS)   || '{}'),
      section:   parseInt(localStorage.getItem(LS_SECTION)  || '0', 10),
      qIndex:    parseInt(localStorage.getItem(LS_QINDEX)   || '0', 10),
      completed: JSON.parse(localStorage.getItem(LS_COMPLETED) || '[]'),
    };
  } catch (_) {
    return { token: null, answers: {}, section: 0, qIndex: 0, completed: [] };
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressBar({ sectionIdx, questionIdx, totalSections = 6, questionsPerSection = 18 }) {
  const sectionPct  = ((sectionIdx * questionsPerSection + questionIdx + 1) / (totalSections * questionsPerSection)) * 100;
  const levelColors = ['#D4A520','#B8860B','#C9982A','#A0780A','#D4A520','#B8860B'];

  return (
    <div style={{ padding: '14px 20px', background: 'rgba(15,26,46,0.8)', borderBottom: '1px solid rgba(212,165,32,0.12)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Section label row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < sectionIdx ? levelColors[i] : (i === sectionIdx ? 'rgba(212,165,32,0.2)' : 'rgba(255,255,255,0.06)'),
                border: i === sectionIdx ? `2px solid ${GOLD}` : '1px solid rgba(212,165,32,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: i < sectionIdx ? '#0C1323' : (i === sectionIdx ? GOLD : 'rgba(245,237,216,0.3)'),
                fontWeight: 700, transition: 'all 0.3s',
              }}>
                {i < sectionIdx ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: 'rgba(245,237,216,0.65)', fontFamily: 'sans-serif' }}>
            Q {questionIdx + 1}/18 · Level {sectionIdx + 1}/6
          </div>
        </div>
        {/* Overall progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${sectionPct}%`, background: `linear-gradient(90deg, ${GOLD}, #B8860B)`, borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
}


function XPBadge({ xp }) {
  return (
    <div style={{ position: 'fixed', top: 72, right: 20, background: 'rgba(15,26,46,0.9)', border: `1px solid ${GOLD}40`, borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 60, backdropFilter: 'blur(8px)', fontSize: 13, color: GOLD, fontWeight: 700, fontFamily: 'sans-serif' }}>
      <Zap size={13} fill={GOLD} />
      {xp} XP
    </div>
  );
}


function ScaleQuestion({ question, onAnswer, currentAnswer }) {
  const [hovered, setHovered] = useState(null);
  const current = currentAnswer ?? null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13, color: 'rgba(245,237,216,0.65)', fontFamily: 'sans-serif' }}>
        <span>{question.scale_labels?.[0] || '1 – Not at all'}</span>
        <span>{question.scale_labels?.[1] || '7 – Very much'}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5, 6, 7].map(v => {
          const isSelected = current === v;
          const isHovered  = hovered === v;
          return (
            <button
              key={v}
              onClick={() => onAnswer(v)}
              onMouseEnter={() => setHovered(v)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: 1,
                maxWidth: 62,
                aspectRatio: '1',
                background: isSelected ? `linear-gradient(135deg, ${GOLD}, #B8860B)` : (isHovered ? 'rgba(212,165,32,0.15)' : 'rgba(255,255,255,0.04)'),
                border: isSelected ? 'none' : `1px solid ${isHovered ? GOLD + '60' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10,
                color: isSelected ? '#0C1323' : (isHovered ? GOLD : 'rgba(245,237,216,0.7)'),
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                transform: isSelected ? 'scale(1.08)' : (isHovered ? 'scale(1.04)' : 'scale(1)'),
                boxShadow: isSelected ? `0 4px 16px rgba(212,165,32,0.4)` : 'none',
              }}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}


function ChoiceQuestion({ question, selectedChoices, onToggle, onNone, onConfirm }) {
  const letters = ['A', 'B', 'C', 'D'];
  const noneSelected = selectedChoices.includes('none');
  const hasSelection = selectedChoices.length > 0;

  return (
    <div>
      {/* Select-many hint */}
      <div style={{ fontSize: 12, color: 'rgba(245,237,216,0.45)', fontFamily: 'sans-serif', marginBottom: 14, textAlign: 'center', letterSpacing: '0.03em' }}>
        Select all that apply
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(question.options || []).map((opt, i) => {
          const letter = letters[i];
          const isSelected = selectedChoices.includes(letter);
          return (
            <button
              key={i}
              onClick={() => onToggle(letter)}
              disabled={noneSelected}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                background: isSelected ? 'rgba(212,165,32,0.13)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? GOLD + '70' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: 12,
                cursor: noneSelected ? 'not-allowed' : 'pointer',
                color: noneSelected && !isSelected ? 'rgba(245,237,216,0.35)' : (isSelected ? '#F5EDD8' : 'rgba(245,237,216,0.82)'),
                textAlign: 'left', fontSize: 15, lineHeight: 1.6,
                transition: 'all 0.15s',
                fontFamily: 'Georgia, serif',
                opacity: noneSelected && !isSelected ? 0.5 : 1,
                boxShadow: isSelected ? `0 0 0 1px ${GOLD}35` : 'none',
              }}
            >
              <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: 8,
                background: isSelected ? `linear-gradient(135deg, ${GOLD}, #B8860B)` : 'rgba(255,255,255,0.06)',
                border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isSelected ? 14 : 12, fontWeight: 700,
                color: isSelected ? '#0C1323' : 'rgba(245,237,216,0.55)',
                fontFamily: 'sans-serif', transition: 'all 0.15s',
              }}>
                {isSelected ? '✓' : letter}
              </div>
              {opt}
            </button>
          );
        })}

        {/* None of the above */}
        <button
          onClick={onNone}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px', marginTop: 4,
            background: noneSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: `1px dashed ${noneSelected ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.13)'}`,
            borderRadius: 12, cursor: 'pointer',
            color: noneSelected ? 'rgba(245,237,216,0.82)' : 'rgba(245,237,216,0.42)',
            textAlign: 'left', fontSize: 14,
            fontFamily: 'sans-serif', transition: 'all 0.15s',
          }}
        >
          <div style={{
            flexShrink: 0, width: 28, height: 28, borderRadius: 6,
            background: noneSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: noneSelected ? 'rgba(245,237,216,0.7)' : 'rgba(245,237,216,0.3)',
          }}>
            {noneSelected ? '✓' : '—'}
          </div>
          None of the above
        </button>
      </div>

      {/* Confirm button — appears once at least one option is selected */}
      {hasSelection && (
        <button
          onClick={onConfirm}
          style={{
            marginTop: 22, width: '100%',
            background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
            color: '#0C1323', fontWeight: 700, fontSize: 15,
            padding: '14px', borderRadius: 12, border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            boxShadow: `0 4px 18px rgba(212,165,32,0.3)`,
          }}
        >
          Continue <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}


function BinaryQuestion({ question, onAnswer, currentAnswer }) {
  const opts = question.options || ['Yes', 'Sometimes', 'No'];

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {opts.map(opt => {
        const isSelected = currentAnswer === opt;
        return (
          <button
            key={opt}
            onClick={() => onAnswer(opt)}
            style={{
              flex: '1 1 130px', maxWidth: 180,
              padding: '16px 20px',
              background: isSelected ? 'rgba(212,165,32,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isSelected ? GOLD + '70' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14, cursor: 'pointer',
              color: isSelected ? '#F5EDD8' : 'rgba(245,237,216,0.65)',
              fontSize: 16, fontWeight: isSelected ? 600 : 400,
              fontFamily: 'Georgia, serif',
              transition: 'all 0.15s',
              boxShadow: isSelected ? `0 0 0 1px ${GOLD}50` : 'none',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}


function SectionInsightOverlay({ insight, section, onContinue, isLast }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(12,19,35,0.92)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(10px)',
    }}>
      {/* Celebration particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 6, height: 6, borderRadius: '50%',
            background: i % 3 === 0 ? GOLD : (i % 3 === 1 ? '#fff' : '#B8860B'),
            left: `${8 + i * 8}%`,
            top: `${-10 + Math.sin(i) * 5}%`,
            animation: `fall ${1.5 + i * 0.15}s ease-in ${i * 0.1}s forwards`,
            opacity: 0,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        background: CARD, borderRadius: 24, maxWidth: 540, width: '100%',
        border: `1px solid ${GOLD}30`, overflow: 'hidden',
        animation: 'slideUp 0.4s ease',
        boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,165,32,0.1)`,
      }}>
        {/* Gold top stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

        <div style={{ padding: '36px 32px' }}>
          {/* Level badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ fontSize: 36 }}>{section?.icon}</div>
            <div>
              <div style={{ fontSize: 13, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                Level {section?.level} Complete  ✅
              </div>
              <div style={{ fontSize: 14, color: 'rgba(245,237,216,0.68)', fontFamily: 'sans-serif' }}>
                {section?.title}
              </div>
            </div>
            {/* Score pill */}
            <div style={{ marginLeft: 'auto', background: 'rgba(212,165,32,0.12)', border: `1px solid ${GOLD}40`, borderRadius: 20, padding: '6px 16px' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>{insight?.score}</span>
              <span style={{ fontSize: 12, color: 'rgba(245,237,216,0.5)', fontFamily: 'sans-serif' }}> /100</span>
            </div>
          </div>

          {/* Profile type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>{insight?.badge}</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 24, fontWeight: 700, color: '#F5EDD8', margin: 0 }}>
              {insight?.profile}
            </h2>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.85, color: 'rgba(245,237,216,0.88)', marginBottom: 24, fontStyle: 'italic' }}>
            "{insight?.summary}"
          </p>

          {/* Strength + Growth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 14px' }}>
              <div style={{ fontSize: 12, color: '#4ade80', fontFamily: 'sans-serif', letterSpacing: '0.08em', marginBottom: 8 }}>✦ YOUR STRENGTH</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(245,237,216,0.85)' }}>{insight?.strength}</div>
            </div>
            <div style={{ background: 'rgba(212,165,32,0.06)', border: '1px solid rgba(212,165,32,0.15)', borderRadius: 10, padding: '14px 14px' }}>
              <div style={{ fontSize: 12, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.08em', marginBottom: 8 }}>✦ GROWTH EDGE</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(245,237,216,0.85)' }}>{insight?.growth}</div>
            </div>
          </div>

          {/* XP earned */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,165,32,0.08)', borderRadius: 20, padding: '8px 20px', fontSize: 13, color: GOLD, fontFamily: 'sans-serif' }}>
              <Zap size={13} fill={GOLD} />
              +180 XP earned this level
            </div>
          </div>

          <button
            onClick={onContinue}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
              color: '#0C1323', fontWeight: 700, fontSize: 15,
              padding: '14px 24px', borderRadius: 12, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isLast ? (
              <>Unlock Your Full Report <span style={{ fontSize: 18 }}>🔓</span></>
            ) : (
              <>Continue to Level {(section?.level || 0) + 1} <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Main Assessment Component ──────────────────────────────────────────────────

export default function InsightsAssessment() {
  const navigate = useNavigate();

  const [sections,    setSections]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sectionIdx,  setSectionIdx]  = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers,     setAnswers]     = useState({});      // { "section_1": { "s1_q1": 5, ... } }
  const [completed,   setCompleted]   = useState([]);      // ["section_1", ...]
  const [guestToken,  setGuestToken]  = useState(null);
  const [showInsight, setShowInsight] = useState(false);
  const [miniInsight, setMiniInsight] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [xp,          setXp]          = useState(0);
  const [animating,   setAnimating]   = useState(false);
  const [multiChoiceSelected, setMultiChoiceSelected] = useState([]);   // for choice questions

  const cardRef = useRef(null);

  // ── Load questions + restore local progress ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/insights/questions`);
        setSections(data.sections || []);
      } catch {
        toast.error('Could not load questions. Please refresh.');
        setLoading(false);
        return;
      }

      // Restore local progress
      const local = loadLocal();
      if (local.token) {
        setGuestToken(local.token);
        setAnswers(local.answers   || {});
        setCompleted(local.completed || []);
        const si = Math.min(local.section || 0, 5);
        const qi = Math.min(local.qIndex  || 0, 17);
        setSectionIdx(si);
        setQuestionIdx(qi);
        setXp((local.completed?.length || 0) * 180 + qi * 10);
      } else {
        // Start new guest session
        try {
          const { data: gs } = await axios.post(`${BACKEND_URL}/api/insights/guest/start`);
          localStorage.setItem(LS_TOKEN, gs.temp_token);
          setGuestToken(gs.temp_token);
        } catch {
          // Offline — generate a local-only token
          const localToken = 'local_' + Date.now();
          localStorage.setItem(LS_TOKEN, localToken);
          setGuestToken(localToken);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const currentSection  = sections[sectionIdx];
  const currentQuestion = currentSection?.questions?.[questionIdx];
  const sectionAnswers  = answers[currentSection?.id] || {};
  const currentAnswer   = currentQuestion ? sectionAnswers[currentQuestion.id] : undefined;

  // ── Sync multiChoiceSelected when question changes ───────────────────────────
  useEffect(() => {
    if (currentQuestion?.type === 'choice') {
      const existing = sectionAnswers[currentQuestion.id];
      if (Array.isArray(existing)) setMultiChoiceSelected(existing);
      else if (typeof existing === 'string' && existing !== '') setMultiChoiceSelected([existing]);
      else setMultiChoiceSelected([]);
    } else {
      setMultiChoiceSelected([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIdx, sectionIdx]);

  // ── Handle an answer ────────────────────────────────────────────────────────
  const handleAnswer = useCallback(async (value) => {
    if (!currentQuestion || animating) return;

    const sectionId = currentSection.id;
    const qId       = currentQuestion.id;

    const newSectionAnswers = { ...sectionAnswers, [qId]: value };
    const newAnswers        = { ...answers, [sectionId]: newSectionAnswers };

    setAnswers(newAnswers);
    setXp(prev => prev + 10);

    const isLastQ = questionIdx === (currentSection.questions.length - 1);

    if (isLastQ) {
      // Save section to backend + fetch mini-insight
      setSaving(true);
      const newCompleted = completed.includes(sectionId) ? completed : [...completed, sectionId];
      setCompleted(newCompleted);
      saveLocal(newAnswers, sectionIdx, questionIdx, newCompleted);

      try {
        if (guestToken && !guestToken.startsWith('local_')) {
          await axios.post(
            `${BACKEND_URL}/api/insights/guest/answers/${sectionId}`,
            { temp_token: guestToken, answers: newSectionAnswers, current_question: questionIdx },
          );
          const { data: ins } = await axios.get(
            `${BACKEND_URL}/api/insights/guest/section/${sectionId}/insight?token=${guestToken}`,
          );
          setMiniInsight(ins);
        } else {
          // Offline fallback — compute simple score locally
          const vals = Object.values(newSectionAnswers);
          const score = Math.round(
            vals.reduce((acc, v) => {
              if (typeof v === 'number') return acc + ((v - 1) / 6);
              const m = { A: 1, B: 0.67, C: 0.33, D: 0, Yes: 1, Maybe: 0.5, Sometimes: 0.5, No: 0, 'Working on it': 0.5 };
              return acc + (m[v] ?? 0.5);
            }, 0) / vals.length * 100
          );
          setMiniInsight({ score, profile: 'Analysis Complete', badge: currentSection.icon, summary: 'Your answers for this level have been recorded. Complete all 6 levels to unlock your full report.', strength: 'You\'ve completed this level.', growth: 'Keep going — your full profile awaits.' });
        }
      } catch {
        setMiniInsight({ score: 70, profile: 'Level Complete', badge: currentSection.icon, summary: 'Answers saved. Keep going to complete all 6 levels.', strength: 'Great progress.', growth: 'Continue to the next level.' });
      } finally {
        setSaving(false);
        setShowInsight(true);
      }
    } else {
      // Advance to next question with animation
      setAnimating(true);
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(-20px)';
        cardRef.current.style.opacity   = '0';
      }
      setTimeout(() => {
        setQuestionIdx(prev => prev + 1);
        saveLocal(newAnswers, sectionIdx, questionIdx + 1, completed);
        if (cardRef.current) {
          cardRef.current.style.transform = 'translateX(20px)';
          setTimeout(() => {
            if (cardRef.current) {
              cardRef.current.style.transition = 'transform 0.2s, opacity 0.2s';
              cardRef.current.style.transform  = 'translateX(0)';
              cardRef.current.style.opacity    = '1';
            }
            setAnimating(false);
          }, 20);
        } else {
          setAnimating(false);
        }
      }, 150);
    }
  }, [currentQuestion, currentSection, sectionAnswers, answers, completed, questionIdx, sectionIdx, guestToken, animating]);

  // ── Multi-select handlers ────────────────────────────────────────────────────
  const handleChoiceToggle = useCallback((letter) => {
    setMultiChoiceSelected(prev => {
      if (prev.includes(letter)) return prev.filter(l => l !== letter);
      return [...prev.filter(l => l !== 'none'), letter];
    });
  }, []);

  const handleChoiceNone = useCallback(() => {
    setMultiChoiceSelected(prev => prev.includes('none') ? [] : ['none']);
  }, []);

  const handleChoiceConfirm = useCallback(() => {
    if (multiChoiceSelected.length === 0) return;
    // Send "none" string, single letter string, or multi-letter array
    let value;
    if (multiChoiceSelected.includes('none')) value = 'none';
    else if (multiChoiceSelected.length === 1) value = multiChoiceSelected[0];
    else value = multiChoiceSelected;
    handleAnswer(value);
  }, [multiChoiceSelected, handleAnswer]);

  // ── Continue to next section ─────────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    setShowInsight(false);
    setMiniInsight(null);
    const isLastSection = sectionIdx === sections.length - 1;
    if (isLastSection) {
      // All done — go to unlock page
      navigate('/insights/unlock');
      return;
    }
    const nextIdx = sectionIdx + 1;
    setSectionIdx(nextIdx);
    setQuestionIdx(0);
    saveLocal(answers, nextIdx, 0, completed);
  }, [sectionIdx, sections, answers, completed, navigate]);

  // ── Navigation back ──────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (questionIdx > 0) {
      setQuestionIdx(prev => prev - 1);
    } else if (sectionIdx > 0) {
      setSectionIdx(prev => prev - 1);
      setQuestionIdx(17);
    }
  }, [questionIdx, sectionIdx]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={28} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'rgba(245,237,216,0.5)', fontFamily: 'Georgia, serif', fontSize: 16 }}>Preparing your journey…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentSection || !currentQuestion) {
    return (
      <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#F5EDD8' }}>
          <p style={{ fontFamily: 'Georgia', fontSize: 18, marginBottom: 16 }}>Something went wrong loading questions.</p>
          <button onClick={() => window.location.reload()} style={{ background: GOLD, color: NAVY, border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
        </div>
      </div>
    );
  }

  const isLastSection = sectionIdx === sections.length - 1;

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: '#F5EDD8', fontFamily: 'Georgia, serif' }}>

      {/* Sticky progress bar */}
      <ProgressBar sectionIdx={sectionIdx} questionIdx={questionIdx} />

      {/* XP Badge */}
      <XPBadge xp={xp} />

      {/* Exit button */}
      <button
        onClick={() => navigate('/insights')}
        title="Exit assessment"
        style={{ position: 'fixed', top: 72, left: 20, background: 'rgba(15,26,46,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', color: 'rgba(245,237,216,0.5)', fontSize: 12, fontFamily: 'sans-serif', zIndex: 60, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <X size={12} /> Exit
      </button>

      {/* Section header */}
      <div style={{ textAlign: 'center', padding: '48px 24px 32px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>{currentSection.icon}</div>
        <div style={{ fontSize: 13, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Level {currentSection.level} · {currentSection.title}
        </div>
        <div style={{ fontSize: 15, color: 'rgba(245,237,216,0.65)', fontFamily: 'sans-serif' }}>
          {currentSection.subtitle}
        </div>
      </div>

      {/* Question card */}
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '0 24px 120px' }}>
        <div
          ref={cardRef}
          style={{
            background: CARD,
            border: '1px solid rgba(212,165,32,0.15)',
            borderRadius: 20,
            padding: '36px 32px',
            transition: 'transform 0.15s, opacity 0.15s',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Gold top line */}
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}60, transparent)` }} />

          {/* Question number */}
          <div style={{ fontSize: 12, color: 'rgba(212,165,32,0.75)', fontFamily: 'sans-serif', letterSpacing: '0.08em', marginBottom: 18 }}>
            QUESTION {questionIdx + 1} OF 18
          </div>

          {/* Question text */}
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(18px, 3vw, 24px)',
            fontWeight: 600, lineHeight: 1.5,
            color: '#F5EDD8',
            marginBottom: 32,
          }}>
            {currentQuestion.text}
          </h2>

          {/* Answer input by type */}
          {currentQuestion.type === 'scale' && (
            <ScaleQuestion question={currentQuestion} onAnswer={handleAnswer} currentAnswer={currentAnswer} />
          )}
          {currentQuestion.type === 'choice' && (
            <ChoiceQuestion
              question={currentQuestion}
              selectedChoices={multiChoiceSelected}
              onToggle={handleChoiceToggle}
              onNone={handleChoiceNone}
              onConfirm={handleChoiceConfirm}
            />
          )}
          {currentQuestion.type === 'binary' && (
            <BinaryQuestion question={currentQuestion} onAnswer={handleAnswer} currentAnswer={currentAnswer} />
          )}

          {/* Saving indicator */}
          {saving && (
            <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(245,237,216,0.4)', fontFamily: 'sans-serif' }}>
              <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Saving…
            </div>
          )}
        </div>

        {/* Navigation row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '0 4px' }}>
          <button
            onClick={handleBack}
            disabled={sectionIdx === 0 && questionIdx === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', cursor: (sectionIdx === 0 && questionIdx === 0) ? 'not-allowed' : 'pointer', color: 'rgba(245,237,216,0.4)', fontSize: 13, fontFamily: 'sans-serif', opacity: (sectionIdx === 0 && questionIdx === 0) ? 0.3 : 1 }}
          >
            <ChevronLeft size={14} /> Back
          </button>

          {/* Answered indicator */}
          {(currentQuestion?.type === 'choice'
            ? multiChoiceSelected.length > 0
            : currentAnswer !== undefined) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4ade80', fontFamily: 'sans-serif' }}>
              <CheckCircle2 size={13} />
              {currentQuestion?.type === 'choice' && multiChoiceSelected.length > 1
                ? `${multiChoiceSelected.filter(v => v !== 'none').length} selected`
                : 'Answered'}
            </div>
          )}

          {/* Skip for scale (requires explicit next) */}
          {currentQuestion.type === 'scale' && currentAnswer !== undefined && (
            <button
              onClick={() => handleAnswer(currentAnswer)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(212,165,32,0.12)', border: `1px solid ${GOLD}40`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: GOLD, fontSize: 13, fontFamily: 'sans-serif' }}
            >
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Progress microcopy */}
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'rgba(245,237,216,0.5)', fontFamily: 'sans-serif' }}>
          {completed.length} of 6 levels complete · {Math.round((sectionIdx * 18 + questionIdx + 1) / 108 * 100)}% of your journey
        </div>
      </div>

      {/* Section insight overlay */}
      {showInsight && miniInsight && (
        <SectionInsightOverlay
          insight={miniInsight}
          section={currentSection}
          onContinue={handleContinue}
          isLast={isLastSection}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
