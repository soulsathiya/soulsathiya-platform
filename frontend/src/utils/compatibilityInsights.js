/**
 * Human-readable compatibility insights for each dimension.
 * Used across MatchCard, LandingPage preview, DemoDeepReport, and DeepReportView.
 *
 * Each dimension has three tiers:
 *   strong   — score >= 80
 *   moderate — score 60–79
 *   growth   — score < 60
 *
 * Rules enforced:
 *  - No two dimensions share the same sentence structure or key phrase
 *  - "communication" and "communication_style" are deliberately distinct
 *  - Growth tier avoids the overused "X differ — worth exploring" pattern
 *  - Intimacy text focuses on closeness/presence, not emotional language (that belongs to emotional_alignment)
 */

const DIMENSION_INSIGHTS = {

  emotional_alignment: {
    strong:   "You both feel safe expressing your inner world to each other — a rare and deeply sustaining quality in a relationship.",
    moderate: "There's genuine emotional warmth between you, though you may process and express feelings at a different pace.",
    growth:   "You experience and show emotions quite differently — creating space for each other's inner world will take time and deliberate care.",
  },

  life_goals: {
    strong:   "Your visions for the future point in the same direction — where you want to live, what you want to build, and who you want to become.",
    moderate: "Your ambitions and priorities largely overlap, with a few long-term choices that will need honest conversation as things unfold.",
    growth:   "You're heading toward different futures in some important ways — the sooner you talk about it, the stronger your foundation will be.",
  },

  // Focused on approach/style — how each person prefers to communicate
  communication_style: {
    strong:   "You communicate in ways that feel natural to each other — warm, direct, and easy to understand without much translation.",
    moderate: "Your communication approaches have enough in common to work well, with some fine-tuning needed in emotionally charged moments.",
    growth:   "Your preferred ways of communicating diverge — one of you may need space to process while the other seeks immediate dialogue.",
  },

  // Focused on everyday exchange — listening, expressing, feeling heard
  communication: {
    strong:   "You express yourselves in ways the other genuinely receives — creating a quiet sense of being truly heard and understood.",
    moderate: "Your day-to-day exchanges flow well, with occasional moments that may need a little more care and clarity.",
    growth:   "Feeling truly heard may take effort for both of you — learning each other's language will be one of your most important early investments.",
  },

  conflict_resolution: {
    strong:   "When disagreements arise, you both move toward resolution rather than away from it — a sign of real emotional maturity and mutual respect.",
    moderate: "You handle most friction constructively, though under pressure one of you may withdraw while the other pushes forward.",
    growth:   "Your instincts in conflict pull in opposite directions — naming this early and building shared ground rules will protect your relationship.",
  },

  family_values: {
    strong:   "You picture home and family in remarkably similar ways — the rituals, the roles, and the roots that matter most to each of you.",
    moderate: "Your family values run parallel, with some differences in how tradition and expectations translate into day-to-day life.",
    growth:   "Your visions for family life diverge in meaningful ways — these conversations are worth having early, before they become sources of friction.",
  },

  // Focused on physical closeness, presence, and connection rhythm — not emotional safety
  intimacy: {
    strong:   "You're drawn to the same kind of closeness — the warmth, the presence, and the unspoken comfort of feeling truly at home with someone.",
    moderate: "Your needs for closeness and affection are broadly in sync, with some differences in timing or expression that you'll find your own rhythm for.",
    growth:   "Your needs for physical and emotional closeness differ noticeably — patience and honest conversation will help you find a shared language for this.",
  },

  // Focused on role expectations, responsibilities, household norms
  expectations: {
    strong:   "What you each expect from a partner — in roles, in effort, in daily life — lines up closely, which removes a major source of silent friction.",
    moderate: "You're aligned on most of what matters, though some expectations around roles and responsibilities will need clear, ongoing conversation.",
    growth:   "Your expectations of what a relationship looks like in practice differ significantly — bringing these to the surface early is essential.",
  },

  attachment: {
    strong:   "Both of you bring a secure, open presence to this relationship — you're unlikely to play games with each other's need for closeness or space.",
    moderate: "Your attachment patterns are compatible at the core, though you may have different thresholds for reassurance and independence.",
    growth:   "One of you may need more reassurance while the other values independence — recognising this without judgment is the first step to real trust.",
  },

  lifestyle: {
    strong:   "Your daily rhythms, habits, and pace of life fit together naturally — you're unlikely to exhaust or frustrate each other just by being yourselves.",
    moderate: "Your lifestyles are broadly in step, with some routines and preferences that will evolve as you build a shared life.",
    growth:   "Your day-to-day lives run at different speeds and in different directions — building shared structure will require genuine compromise from both sides.",
  },

  values: {
    strong:   "What you stand for and what you won't compromise on are closely aligned — you're likely to find the other's instincts feel right, not foreign.",
    moderate: "Your foundational values point in the same direction, with some differences in how strongly or practically each of you applies them.",
    growth:   "Your core values diverge in ways that will surface in real decisions — understanding where the other is coming from will take patience and genuine curiosity.",
  },

};

// Fallback for backend dimension keys not listed above
// Deliberately human and empathetic — not mechanical
const GENERIC_INSIGHTS = {
  strong:   "This is a quiet point of natural connection between you — a small but sustaining thread that holds well under pressure.",
  moderate: "You're more alike here than different. With a little openness, this can become one of your strongest shared foundations.",
  growth:   "You see this area of life differently — approaching that with curiosity rather than judgment will make all the difference.",
};

/**
 * Returns a short human-readable insight string for a given dimension and score.
 * @param {string} dimension - Dimension key (spaces or underscores, any case)
 * @param {number} score - 0–100
 * @returns {string}
 */
export const getDimensionInsight = (dimension, score) => {
  const key = dimension.toLowerCase().replace(/\s+/g, '_');
  const tier = score >= 80 ? 'strong' : score >= 60 ? 'moderate' : 'growth';
  const map = DIMENSION_INSIGHTS[key] || GENERIC_INSIGHTS;
  return map[tier] || GENERIC_INSIGHTS[tier];
};

/**
 * Returns a short overall compatibility sentence based on total score.
 * Used in MatchCard and radar chart preview.
 * @param {number} score - 0–100
 * @returns {string}
 */
export const getOverallInsight = (score) => {
  if (score >= 88) return "A deeply natural fit — aligned in values, emotion, and the way you each picture a life well lived.";
  if (score >= 78) return "Strong compatibility across the dimensions that matter most for a relationship that lasts.";
  if (score >= 65) return "Meaningful common ground, with a few areas that will grow stronger as you get to know each other.";
  return "Connection is possible here — but it will ask both of you to understand and meet each other with real intention.";
};
