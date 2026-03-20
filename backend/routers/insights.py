"""
Relationship Insights Router — Guest-first 108-question assessment
=================================================================
Endpoints
  GET  /api/insights/questions                  — full question bank (public)
  POST /api/insights/guest/start                — create guest session
  POST /api/insights/guest/answers/{section_id} — save a section's answers
  GET  /api/insights/guest/progress             — resume progress (?token=)
  GET  /api/insights/guest/section/{section_id}/insight — mini-insight
  POST /api/insights/convert-guest              — migrate guest → user (auth)
  POST /api/insights/payment                    — create Razorpay order (auth)
  POST /api/insights/verify-payment             — confirm payment (auth)
  GET  /api/insights/report                     — full report (auth + paid)
  GET  /api/insights/admin/analytics            — admin stats (admin)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any
import uuid
import os
import logging

from dependencies import get_current_user, db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["insights"])

# ── Config ─────────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID     = os.environ.get("RAZORPAY_KEY_ID",     "rzp_test_dummy")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
FRONTEND_URL        = os.environ.get("FRONTEND_URL",        "https://soulsathiya.com")
REPORT_PRICE_PAISE  = 99900   # ₹999
GUEST_TTL_DAYS      = 30      # guest sessions expire after 30 days
SECTIONS_COUNT      = 6
QUESTIONS_PER_SECTION = 18


def _is_dummy_mode() -> bool:
    return not RAZORPAY_KEY_SECRET or RAZORPAY_KEY_ID.startswith("rzp_test_dummy")


# ═══════════════════════════════════════════════════════════════════════════════
#  QUESTION BANK  (108 questions across 6 sections, 18 per section)
# ═══════════════════════════════════════════════════════════════════════════════

SECTIONS_META = [
    {
        "id": "section_1",
        "title": "Emotional Foundation",
        "subtitle": "Discover how you feel, connect, and heal",
        "level": 1,
        "icon": "❤️",
        "color": "#D4A520",
    },
    {
        "id": "section_2",
        "title": "Values & Life Vision",
        "subtitle": "What truly matters to you and where you're headed",
        "level": 2,
        "icon": "🌟",
        "color": "#B8860B",
    },
    {
        "id": "section_3",
        "title": "Communication & Connection",
        "subtitle": "How you speak, listen, and love",
        "level": 3,
        "icon": "💬",
        "color": "#C9982A",
    },
    {
        "id": "section_4",
        "title": "Relationship Patterns",
        "subtitle": "Your history, habits, and healing",
        "level": 4,
        "icon": "🔄",
        "color": "#A0780A",
    },
    {
        "id": "section_5",
        "title": "Daily Life & Lifestyle",
        "subtitle": "How you live and what you need every day",
        "level": 5,
        "icon": "☀️",
        "color": "#D4A520",
    },
    {
        "id": "section_6",
        "title": "Growth & Future",
        "subtitle": "Your dreams, vision, and who you're becoming",
        "level": 6,
        "icon": "🚀",
        "color": "#B8860B",
    },
]

_Q = {
    "section_1": [
        {"id": "s1_q1",  "text": "I can identify and name my emotions clearly when I need to", "type": "scale",  "scale_labels": ["Rarely", "Always"]},
        {"id": "s1_q2",  "text": "When I'm emotionally overwhelmed, I typically...", "type": "choice", "options": ["Withdraw and process alone", "Talk to someone close", "Distract myself with activities", "Express my feelings directly"]},
        {"id": "s1_q3",  "text": "I feel comfortable being emotionally vulnerable with a partner", "type": "scale",  "scale_labels": ["Very uncomfortable", "Very comfortable"]},
        {"id": "s1_q4",  "text": "My primary emotional need in a relationship is...", "type": "choice", "options": ["Security and stability", "Freedom and personal space", "Deep intimacy and closeness", "Appreciation and admiration"]},
        {"id": "s1_q5",  "text": "I recover from emotional hurt or disappointment relatively quickly", "type": "scale",  "scale_labels": ["Takes me very long", "Recover quickly"]},
        {"id": "s1_q6",  "text": "Do you find it easy to express affection openly?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
        {"id": "s1_q7",  "text": "I can stay calm and present when my partner is emotionally upset", "type": "scale",  "scale_labels": ["Very challenging", "Comes naturally"]},
        {"id": "s1_q8",  "text": "When my partner needs emotional support, I naturally...", "type": "choice", "options": ["Listen quietly and hold space", "Offer practical solutions", "Validate their feelings deeply", "Give them space and time"]},
        {"id": "s1_q9",  "text": "I carry emotional residue from past relationships into new ones", "type": "scale",  "scale_labels": ["A great deal", "Very little"]},
        {"id": "s1_q10", "text": "My attachment style feels closest to...", "type": "choice", "options": ["Secure — comfortable with closeness and autonomy", "Anxious — I worry about being abandoned or losing love", "Avoidant — I value independence and pull back when close", "Mixed — I'm still evolving and discovering"]},
        {"id": "s1_q11", "text": "I express gratitude and appreciation to people I love", "type": "scale",  "scale_labels": ["Rarely", "Daily"]},
        {"id": "s1_q12", "text": "Do you tend to prioritise your partner's emotional needs over your own?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
        {"id": "s1_q13", "text": "I can hold my partner's emotions without taking them personally", "type": "scale",  "scale_labels": ["Very difficult", "Comes naturally"]},
        {"id": "s1_q14", "text": "After a conflict, I feel healed when...", "type": "choice", "options": ["We fully resolve it before sleeping", "I've had quiet time to process alone", "We apologise and move on together", "We acknowledge it and give each other space"]},
        {"id": "s1_q15", "text": "I trust my emotional instincts and inner knowing", "type": "scale",  "scale_labels": ["Rarely", "Always"]},
        {"id": "s1_q16", "text": "Do you feel emotionally safe enough to show your weaknesses to a partner?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
        {"id": "s1_q17", "text": "I feel whole and emotionally complete within myself", "type": "scale",  "scale_labels": ["Feel incomplete", "Feel very complete"]},
        {"id": "s1_q18", "text": "My emotional energy in relationships tends to be...", "type": "choice", "options": ["Giving and nurturing", "Balanced — I give and receive equally", "Receiving and appreciating", "Intensely passionate and deeply invested"]},
    ],
    "section_2": [
        {"id": "s2_q1",  "text": "My most important life priority right now is...", "type": "choice", "options": ["Career and financial success", "Deep relationships and family", "Personal growth and rich experiences", "Spiritual growth and inner peace"]},
        {"id": "s2_q2",  "text": "I have a clear and exciting vision for my life in the next 5 years", "type": "scale",  "scale_labels": ["No clear vision", "Crystal clear"]},
        {"id": "s2_q3",  "text": "My relationship with religion or spirituality is...", "type": "choice", "options": ["Deeply devout — central to my identity", "Spiritual but not strictly religious", "Respectful of others but personally private", "Not a significant part of my life"]},
        {"id": "s2_q4",  "text": "I believe marriage is a lifelong commitment in all circumstances", "type": "scale",  "scale_labels": ["Strongly disagree", "Strongly agree"]},
        {"id": "s2_q5",  "text": "When it comes to having children, I...", "type": "choice", "options": ["Definitely want children", "Am open to it but not strongly attached", "Would prefer not to have children", "Already have children and feel complete"]},
        {"id": "s2_q6",  "text": "Financial stability is a top requirement I have for a life partner", "type": "scale",  "scale_labels": ["Not important", "Absolutely essential"]},
        {"id": "s2_q7",  "text": "Would you relocate cities or countries for the right relationship?", "type": "binary", "options": ["Yes", "Maybe", "No"]},
        {"id": "s2_q8",  "text": "My relationship with my family of origin is...", "type": "choice", "options": ["Very close — they're central to my decisions", "Warm but with healthy boundaries", "Complicated — I'm actively working on it", "Distant — I live my own independent life"]},
        {"id": "s2_q9",  "text": "I value intellectual connection as much as physical attraction", "type": "scale",  "scale_labels": ["Physical connection first", "Intellectual connection first"]},
        {"id": "s2_q10", "text": "My ideal home environment is...", "type": "choice", "options": ["City life — vibrant, social, and connected", "Small-town warmth — community and deep roots", "Nature and quiet — outdoors and peaceful living", "Anywhere — I'm flexible and adventurous"]},
        {"id": "s2_q11", "text": "I expect my partner to fully share my core values", "type": "scale",  "scale_labels": ["Not necessary", "Absolutely essential"]},
        {"id": "s2_q12", "text": "Do you believe in soulmates or divinely guided partnerships?", "type": "binary", "options": ["Yes", "Maybe", "No"]},
        {"id": "s2_q13", "text": "My relationship with money is best described as...", "type": "choice", "options": ["Security-focused — I save and plan carefully", "Freedom-focused — I spend on meaningful experiences", "Ambition-focused — I invest and grow wealth", "Needs-based — I manage as I go"]},
        {"id": "s2_q14", "text": "Cultural and family background compatibility matters to me in a partner", "type": "scale",  "scale_labels": ["Not important", "Very important"]},
        {"id": "s2_q15", "text": "Would you be open to inter-caste or interfaith marriage?", "type": "binary", "options": ["Yes", "Open to discussion", "No"]},
        {"id": "s2_q16", "text": "I have clear clarity about the kind of relationship I'm genuinely seeking", "type": "scale",  "scale_labels": ["Very uncertain", "Crystal clear"]},
        {"id": "s2_q17", "text": "My work-life philosophy is...", "type": "choice", "options": ["Work hard now to create long-term freedom", "Both equally important — neither dominates", "My work is my passion and purpose", "Family and relationships always come first"]},
        {"id": "s2_q18", "text": "My deeper life purpose feels closest to...", "type": "choice", "options": ["Creating impact and leaving a meaningful legacy", "Building a beautiful, loving family and home", "Achieving mastery in my craft or calling", "Experiencing deep connection and joy every day"]},
    ],
    "section_3": [
        {"id": "s3_q1",  "text": "My primary love language is...", "type": "choice", "options": ["Words of Affirmation", "Quality Time", "Acts of Service", "Physical Touch"]},
        {"id": "s3_q2",  "text": "I express my needs clearly and directly to my partner", "type": "scale",  "scale_labels": ["Very indirectly", "Very directly"]},
        {"id": "s3_q3",  "text": "During an argument, I tend to...", "type": "choice", "options": ["Stay calm and focus only on the issue", "Get emotional and need to step away", "Try to win and make my point clearly", "Go quiet or completely shut down"]},
        {"id": "s3_q4",  "text": "I actively listen without interrupting or planning my response", "type": "scale",  "scale_labels": ["Rarely", "Always"]},
        {"id": "s3_q5",  "text": "Do you believe complete honesty is always better than protecting feelings?", "type": "binary", "options": ["Yes", "Depends", "No"]},
        {"id": "s3_q6",  "text": "I naturally show love by...", "type": "choice", "options": ["Saying 'I love you' and giving genuine compliments", "Planning thoughtful moments and being fully present", "Doing things and taking active care of my partner", "Hugging, holding, and physical closeness"]},
        {"id": "s3_q7",  "text": "I can ask for what I need without fear of rejection", "type": "scale",  "scale_labels": ["Very fearful", "Very comfortable"]},
        {"id": "s3_q8",  "text": "The communication pattern I most want to avoid is...", "type": "choice", "options": ["Silent treatment and emotional withdrawal", "Explosive anger and hurtful words", "Passive aggression and indirect hinting", "Over-justifying and needing constant approval"]},
        {"id": "s3_q9",  "text": "I'm comfortable discussing difficult topics like money, intimacy, and the future", "type": "scale",  "scale_labels": ["Very uncomfortable", "Very comfortable"]},
        {"id": "s3_q10", "text": "Do you naturally pick up on unspoken emotional cues from a partner?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
        {"id": "s3_q11", "text": "After a difficult conversation, I feel resolved when...", "type": "choice", "options": ["Everything is clear and settled between us", "I've had quiet time to reflect and process", "My partner proactively checks in on me with warmth", "We reconnect with affection and lightness"]},
        {"id": "s3_q12", "text": "I make regular time for deep, meaningful conversations with my partner", "type": "scale",  "scale_labels": ["Rarely prioritise this", "Always prioritise this"]},
        {"id": "s3_q13", "text": "My communication style is best described as...", "type": "choice", "options": ["Direct and assertive", "Thoughtful and deliberate", "Warm and emotionally expressive", "Logical and analytical"]},
        {"id": "s3_q14", "text": "I find it natural to apologise and genuinely take responsibility in conflict", "type": "scale",  "scale_labels": ["Very hard for me", "Comes naturally"]},
        {"id": "s3_q15", "text": "Do you believe humour and playfulness are essential ingredients in love?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
        {"id": "s3_q16", "text": "When my partner shares a problem, my first instinct is to...", "type": "choice", "options": ["Fix it — give advice and practical solutions", "Validate it — acknowledge their feelings first", "Understand it — ask thoughtful, curious questions", "Lighten it — bring warmth, humour, and relief"]},
        {"id": "s3_q17", "text": "I can maintain my own viewpoint while genuinely honouring my partner's", "type": "scale",  "scale_labels": ["I tend to give in", "Healthy, clear balance"]},
        {"id": "s3_q18", "text": "The communication quality I most value in a partner is...", "type": "choice", "options": ["Honesty — even when it's hard to hear", "Gentleness — always kind in delivery", "Clarity — direct and easy to understand", "Depth — willing to explore real conversations"]},
    ],
    "section_4": [
        {"id": "s4_q1",  "text": "My previous relationships ended primarily because of...", "type": "choice", "options": ["Incompatible life goals or core values", "Emotional unavailability — theirs or mine", "External circumstances (family, distance, timing)", "Trust violations or betrayal"]},
        {"id": "s4_q2",  "text": "I have done meaningful inner work on healing from past relationships", "type": "scale",  "scale_labels": ["Very little healing", "Deeply healed"]},
        {"id": "s4_q3",  "text": "Do you carry unresolved feelings for someone from your past?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
        {"id": "s4_q4",  "text": "My personal boundaries in relationships are...", "type": "choice", "options": ["Clear and communicated openly", "Flexible depending on the level of trust", "Unclear — I'm still learning where I stand", "Strong but occasionally inflexible"]},
        {"id": "s4_q5",  "text": "I can love someone deeply while still maintaining my own sense of self", "type": "scale",  "scale_labels": ["I tend to lose myself", "I maintain myself fully"]},
        {"id": "s4_q6",  "text": "In past relationships, I was often...", "type": "choice", "options": ["The caretaker — always nurturing and giving", "The independent one — needing my space", "The romantic — deeply idealistic and invested", "The grounded one — stable and practical"]},
        {"id": "s4_q7",  "text": "I trust my own ability to choose a genuinely healthy partner", "type": "scale",  "scale_labels": ["I question my choices", "I trust myself fully"]},
        {"id": "s4_q8",  "text": "Have you ever stayed in a relationship longer than felt right?", "type": "binary", "options": ["Yes", "Once", "No"]},
        {"id": "s4_q9",  "text": "The pattern I most want to transform in my next relationship is...", "type": "choice", "options": ["People-pleasing to avoid conflict", "Emotional distance or unavailability", "Gravitating toward emotionally unavailable partners", "Moving too fast before building a true foundation"]},
        {"id": "s4_q10", "text": "I feel genuinely ready for a serious, committed relationship now", "type": "scale",  "scale_labels": ["Not ready yet", "Completely ready"]},
        {"id": "s4_q11", "text": "Jealousy in a relationship is something...", "type": "choice", "options": ["I understand and can manage with clarity", "I'm actively working through and healing", "That rarely affects me in any significant way", "I struggle with at times"]},
        {"id": "s4_q12", "text": "I maintain meaningful friendships even when in a romantic relationship", "type": "scale",  "scale_labels": ["I tend to merge fully", "I maintain friendships naturally"]},
        {"id": "s4_q13", "text": "Do you believe past trauma shapes how we love?", "type": "binary", "options": ["Yes", "Partly", "No"]},
        {"id": "s4_q14", "text": "My relationship with vulnerability is...", "type": "choice", "options": ["I embrace it — vulnerability deepens connection", "I'm learning to be more open over time", "I protect myself — vulnerability feels too risky", "I'm selectively open when trust is very deep"]},
        {"id": "s4_q15", "text": "I understand my own contribution to past relationships not working", "type": "scale",  "scale_labels": ["I tend to blame others", "Complete self-clarity"]},
        {"id": "s4_q16", "text": "My relationship deal-breakers include...", "type": "choice", "options": ["Dishonesty, lying, or any form of cheating", "Emotional unavailability or shutting down completely", "Fundamentally incompatible values or life goals", "Disrespect or contempt for who I am"]},
        {"id": "s4_q17", "text": "I am emotionally available and genuinely ready to be present for love now", "type": "scale",  "scale_labels": ["Not available currently", "Fully available and ready"]},
        {"id": "s4_q18", "text": "Do you regularly reflect on your own patterns and behaviours in love?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
    ],
    "section_5": [
        {"id": "s5_q1",  "text": "My ideal weekend looks like...", "type": "choice", "options": ["Social and active — people, energy, adventure", "Home and cosy — rest, depth, and simplicity", "Outdoors and movement — hiking, travel, nature", "Mixed — I follow my energy and mood"]},
        {"id": "s5_q2",  "text": "Physical health and wellness are a priority in my daily life", "type": "scale",  "scale_labels": ["Not a priority", "Central to my life"]},
        {"id": "s5_q3",  "text": "Do you enjoy cooking as an act of care and connection?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
        {"id": "s5_q4",  "text": "My natural energy and sleep rhythm is...", "type": "choice", "options": ["Early riser — most alive in the morning", "Night person — creative energy after midnight", "Flexible — adapts easily to life demands", "Still finding my ideal rhythm and routine"]},
        {"id": "s5_q5",  "text": "I need personal space and alone time, even in deeply loving relationships", "type": "scale",  "scale_labels": ["Don't need much", "Need a great deal"]},
        {"id": "s5_q6",  "text": "My social nature is best described as...", "type": "choice", "options": ["Extrovert — energised deeply by being with people", "Introvert — recharged by solitude and quiet", "Ambivert — it genuinely depends on my day", "Selectively social — deep connections with a few"]},
        {"id": "s5_q7",  "text": "I'm comfortable with my partner maintaining close friendships with others", "type": "scale",  "scale_labels": ["Not comfortable", "Fully comfortable"]},
        {"id": "s5_q8",  "text": "Do you follow a specific dietary practice (vegetarian, vegan, etc.)?", "type": "binary", "options": ["Yes, strictly", "Mostly", "No"]},
        {"id": "s5_q9",  "text": "When it comes to travel, I...", "type": "choice", "options": ["Travel frequently — it's truly how I live", "Enjoy annual holidays and occasional trips", "Love local exploration — beauty is everywhere", "Prefer the depth and comfort of a home base"]},
        {"id": "s5_q10", "text": "I maintain a consistent spiritual, meditation, or mindfulness practice", "type": "scale",  "scale_labels": ["Never", "Daily"]},
        {"id": "s5_q11", "text": "Pets and animals in the home are...", "type": "choice", "options": ["Essential — I have or deeply want pets", "Lovely but not a personal requirement", "Neutral — I can comfortably adapt either way", "Preferably not — allergies or strong preference"]},
        {"id": "s5_q12", "text": "I feel settled and stable in my current financial situation", "type": "scale",  "scale_labels": ["Very stressed and uncertain", "Stable and confident"]},
        {"id": "s5_q13", "text": "Do you enjoy hosting gatherings and creating warmth for others at home?", "type": "binary", "options": ["Yes", "Sometimes", "No"]},
        {"id": "s5_q14", "text": "My relationship with technology and social media is...", "type": "choice", "options": ["Minimal — I prefer real-world depth and presence", "Primarily professional — mainly a work tool", "Regular part of my daily rhythms and life", "Deeply integrated — content, community, connection"]},
        {"id": "s5_q15", "text": "I consistently invest time in my own learning and personal development", "type": "scale",  "scale_labels": ["Rarely", "Consistently"]},
        {"id": "s5_q16", "text": "Family traditions, festivals, and rituals are important to me", "type": "choice", "options": ["Central — I love celebrations and family gatherings", "Important but I hold them with flexibility", "I respect them without being personally invested", "I prefer creating my own intimate traditions"]},
        {"id": "s5_q17", "text": "I adapt well and stay grounded when my plans change unexpectedly", "type": "scale",  "scale_labels": ["I struggle with change", "Very adaptive and grounded"]},
        {"id": "s5_q18", "text": "Do you want to live close to your family after you are married?", "type": "binary", "options": ["Yes", "Maybe", "No"]},
    ],
    "section_6": [
        {"id": "s6_q1",  "text": "The relationship I am building toward feels like...", "type": "choice", "options": ["Partnership — two equals growing forward together", "Soulmate — deeply destined and spiritually guided", "Family — building a life, home, and lasting legacy", "Adventure — exploring the entire world together"]},
        {"id": "s6_q2",  "text": "I believe I can love someone completely and still keep growing as myself", "type": "scale",  "scale_labels": ["I doubt this", "Absolutely"]},
        {"id": "s6_q3",  "text": "Are you actively investing in becoming a better version of yourself?", "type": "binary", "options": ["Yes", "Working on it", "Not yet"]},
        {"id": "s6_q4",  "text": "The quality I most want to cultivate for my next relationship is...", "type": "choice", "options": ["Greater emotional openness and softness", "Clearer communication and authentic self-expression", "Stronger self-worth and healthy boundaries", "More patience, acceptance, and genuine trust"]},
        {"id": "s6_q5",  "text": "I feel genuinely excited and open about the relationship chapter ahead of me", "type": "scale",  "scale_labels": ["Not excited", "Deeply excited"]},
        {"id": "s6_q6",  "text": "My vision for family and home life is...", "type": "choice", "options": ["Extended and warm — children and family close by", "Intimate — partner and one or two children", "Child-free but richly loving and deeply connected", "Open and unwritten — I'll follow life's lead"]},
        {"id": "s6_q7",  "text": "I'm willing to do the consistent inner work that great love requires", "type": "scale",  "scale_labels": ["Not yet", "Fully committed"]},
        {"id": "s6_q8",  "text": "Would you consider couples therapy as a proactive investment — not just in crisis?", "type": "binary", "options": ["Yes", "Maybe", "No"]},
        {"id": "s6_q9",  "text": "The legacy I want my relationship to leave is...", "type": "choice", "options": ["An example of enduring, devoted love", "A family overflowing with warmth and laughter", "Two people who helped each other become whole", "A partnership that genuinely transformed both our worlds"]},
        {"id": "s6_q10", "text": "I can navigate disagreement and difficult seasons without abandoning the relationship", "type": "scale",  "scale_labels": ["I pull away when it's hard", "I stay committed through everything"]},
        {"id": "s6_q11", "text": "My relationship with change and personal evolution is...", "type": "choice", "options": ["I embrace change — it's how I know I'm alive", "I accept change slowly but I always get there", "I seek stability and consistent, reliable ground", "I resist initially but ultimately I grow and expand"]},
        {"id": "s6_q12", "text": "A partner who actively brings out the best in me is...", "type": "scale",  "scale_labels": ["A nice bonus", "Absolutely essential"]},
        {"id": "s6_q13", "text": "Do you believe your most meaningful relationship is still ahead of you?", "type": "binary", "options": ["Yes", "I hope so", "Not sure"]},
        {"id": "s6_q14", "text": "I see my relationship in 10 years as...", "type": "choice", "options": ["Deeply intimate and passionately alive", "Peacefully rooted and beautifully stable", "Still evolving and joyfully discovering together", "Wherever love and growth have taken us both"]},
        {"id": "s6_q15", "text": "I feel ready to fully commit to one person without holding any part of myself back", "type": "scale",  "scale_labels": ["Not ready", "Ready right now"]},
        {"id": "s6_q16", "text": "Above all, what I most need from a partner is...", "type": "choice", "options": ["Unconditional acceptance and emotional safety", "Intellectual and spiritual stimulation", "Physical and emotional passion and aliveness", "Loyalty, reliability, and unwavering consistency"]},
        {"id": "s6_q17", "text": "I trust that love will meet me at the right time and in the right form", "type": "scale",  "scale_labels": ["I worry about this", "Complete, peaceful trust"]},
        {"id": "s6_q18", "text": "Are you ready to begin the most meaningful relationship chapter of your life?", "type": "binary", "options": ["Yes", "Almost", "Not yet"]},
    ],
}

SECTIONS_FULL = [
    {**meta, "questions": _Q[meta["id"]]}
    for meta in SECTIONS_META
]

VALID_SECTION_IDS = {m["id"] for m in SECTIONS_META}


# ═══════════════════════════════════════════════════════════════════════════════
#  MINI-INSIGHT TEMPLATES  (3 tiers per section)
# ═══════════════════════════════════════════════════════════════════════════════

SECTION_INSIGHTS = {
    "section_1": {
        "high": {
            "profile": "Emotionally Secure",
            "badge": "💛",
            "headline": "You lead with emotional intelligence and deep presence.",
            "summary": "You demonstrate strong emotional self-awareness and the capacity to connect authentically. Your ability to identify, express, and hold your emotions means you bring a rich inner presence to relationships. Partners naturally feel seen and emotionally safe with you.",
            "strength": "You can be emotionally available without losing yourself — a rare and magnetic quality.",
            "growth": "Continue deepening your capacity to hold space for a partner's emotional world, especially when it differs from yours.",
        },
        "medium": {
            "profile": "Emotionally Evolving",
            "badge": "🌱",
            "headline": "You're on a genuine and meaningful emotional journey.",
            "summary": "You have real emotional awareness developing within you — your willingness to explore your inner world is the foundation that everything lasting is built on. You have moments of deep connection and moments of emotional distance, and you're learning to close that gap.",
            "strength": "Your self-awareness and honesty about your emotional patterns is more valuable than most people realise.",
            "growth": "Your most powerful next step is learning to sit with discomfort before reacting — this single shift will transform your relationships.",
        },
        "low": {
            "profile": "Emotionally Awakening",
            "badge": "🌅",
            "headline": "Your emotional world holds depth that is still being uncovered.",
            "summary": "This is a powerful threshold — the beginning of an inward journey that will transform how you love. Many people live entire lifetimes without asking the questions you're asking right now. The very fact that you're here says something important about who you are.",
            "strength": "You have honesty and courage — the two most important ingredients for emotional growth.",
            "growth": "Begin a simple daily check-in: 'What am I feeling, and why?' This practice, done consistently, will open worlds within you.",
        },
    },
    "section_2": {
        "high": {
            "profile": "Purpose-Led",
            "badge": "🌟",
            "headline": "You live with clarity about what matters and where you're headed.",
            "summary": "Your strong sense of values and life vision is deeply magnetic. It draws the right people and opportunities into your world and gives your relationships real direction and meaning. You know who you are and what you're building.",
            "strength": "Your clarity acts as a filter — it protects you from relationships that would drain you and draws those that will elevate you.",
            "growth": "Continue examining how your values show up in your daily choices, not just your aspirations.",
        },
        "medium": {
            "profile": "Values Discovering",
            "badge": "🧭",
            "headline": "You're actively clarifying the values that will guide your best life.",
            "summary": "You're in a meaningful phase of deeper self-discovery. You have strong instincts about what matters — your work now is to trust them more fully and articulate them with greater confidence.",
            "strength": "Your open-mindedness allows you to grow and refine your values rather than staying rigidly fixed in old ones.",
            "growth": "Write down your three non-negotiable values. When you can name them clearly, you can honour them consistently.",
        },
        "low": {
            "profile": "Vision Seeking",
            "badge": "🔭",
            "headline": "You're at the exciting threshold of discovering what truly guides you.",
            "summary": "This exploration phase is not a deficit — it's an invitation. The relationships that will serve you most deeply may actually be the ones that help you crystallise who you are and what you're genuinely building.",
            "strength": "Your openness and lack of rigid expectations creates space for something truly unexpected and beautiful.",
            "growth": "Ask yourself: 'What kind of person do I want to be in 5 years?' Let that person guide your choices today.",
        },
    },
    "section_3": {
        "high": {
            "profile": "Conscious Communicator",
            "badge": "💬",
            "headline": "You express yourself with clarity and listen with genuine intention.",
            "summary": "This is one of the rarest and most valuable relationship gifts. Your partners feel heard, respected, and truly met. You have the capacity to navigate even difficult conversations with presence and care — and that creates the conditions for love that genuinely lasts.",
            "strength": "You create emotional safety through your words and your listening. This is the foundation of every enduring relationship.",
            "growth": "Your next edge is learning to communicate when you're at your most emotionally flooded — practice 'pausing to return' rather than reacting.",
        },
        "medium": {
            "profile": "Growing Connector",
            "badge": "🌿",
            "headline": "You have real communication strengths and clear growing edges.",
            "summary": "You're actively developing your capacity to express and receive deeply. You have genuine strengths — and you're aware enough to know where you want to grow. That awareness is the most important thing.",
            "strength": "You're willing to look honestly at how you communicate — that self-honesty is what separates people who grow from those who stay stuck.",
            "growth": "Practice the 'feel, need, request' framework: 'I feel [emotion] because I need [need]. Could you [specific request]?' This one shift changes everything.",
        },
        "low": {
            "profile": "Communication Pioneer",
            "badge": "🌱",
            "headline": "You're building the foundations of authentic expression and deep listening.",
            "summary": "Many people never do the work you're choosing to do. Learning how you express, listen, and receive love is perhaps the highest-leverage investment you can make in your relationship future.",
            "strength": "Your honesty about where you are right now is the first and most important step in the journey.",
            "growth": "Begin by practising one thing: ask one genuine question a day and listen — really listen — to the full answer without planning your response.",
        },
    },
    "section_4": {
        "high": {
            "profile": "Pattern-Aware & Ready",
            "badge": "🦋",
            "headline": "You've done meaningful work on understanding how you love.",
            "summary": "You've examined your relationship history with honest eyes — what worked, what didn't, and what it revealed about you. This self-knowledge is rare and genuinely powerful. You step into your next relationship with the wisdom your past has given you.",
            "strength": "You're not running from your patterns — you're transforming them. That's the work that changes everything.",
            "growth": "The final frontier: can you hold your insights lightly enough that they don't become a story that limits what's possible for you?",
        },
        "medium": {
            "profile": "In Conscious Transition",
            "badge": "🌊",
            "headline": "You're in active and meaningful transition in how you love.",
            "summary": "You're examining old patterns, questioning old choices, and consciously deciding who you want to be in love. This is the most important relationship work there is — and you're doing it.",
            "strength": "The very fact that you're aware of your patterns means you're no longer fully at their mercy. Awareness is 50% of change.",
            "growth": "Find one old pattern you want to genuinely transform and commit to one new practice that counteracts it for 30 days.",
        },
        "low": {
            "profile": "Beginning the Journey",
            "badge": "🌅",
            "headline": "You're at the beginning of a profound inquiry into who you are in love.",
            "summary": "Most people never ask the questions you're asking. The willingness to look inward at your patterns, wounds, and choices is the beginning of a transformation that will change every relationship you have — starting with the one you have with yourself.",
            "strength": "Honesty and openness — you have both. That's more than most people bring to this work.",
            "growth": "Journal prompt: 'What is one pattern in love that I'd like to gently release?' Writing it makes it real.",
        },
    },
    "section_5": {
        "high": {
            "profile": "Lifestyle Clarity",
            "badge": "☀️",
            "headline": "You know how you want to live — and that is deeply attractive.",
            "summary": "This self-knowledge makes you an exceptional partner. You bring grounded presence and clear preferences to daily life, creating the kind of home environment and shared rhythms where love can thrive organically.",
            "strength": "You know your rhythms and non-negotiables. This prevents years of incompatibility creeping in through small daily frictions.",
            "growth": "Hold your preferences with some flexibility — the right partner may introduce you to a version of life that's even better than what you've imagined.",
        },
        "medium": {
            "profile": "Lifestyle in Flow",
            "badge": "🌿",
            "headline": "Your daily rhythms are balanced and adaptable.",
            "summary": "Your life has a beautiful quality — flexible enough to grow with someone, grounded enough to sustain depth. You bring adaptability and genuine presence to daily partnership. The person who shares your world will feel both free and held.",
            "strength": "Your adaptability means you can build a life with someone rather than needing your life to fit perfectly before love can enter.",
            "growth": "Clarify the two or three lifestyle elements that are truly non-negotiable for you, so you can communicate them with confidence.",
        },
        "low": {
            "profile": "Lifestyle Explorer",
            "badge": "🧭",
            "headline": "You're discovering the rhythms and rituals that suit you.",
            "summary": "This openness is a genuine gift — you're not locked into a fixed way of being. Your best daily life and lifestyle may actually be co-created with the right partner, shaped by what you discover together.",
            "strength": "Your willingness to explore and grow means you can adapt to what a relationship requires without forcing a partner into a predetermined mould.",
            "growth": "Spend one week intentionally noting what activities, environments, and rhythms leave you feeling most alive. These are clues to your ideal life.",
        },
    },
    "section_6": {
        "high": {
            "profile": "Future-Ready",
            "badge": "🚀",
            "headline": "You walk into your relationship future with clarity and genuine readiness.",
            "summary": "You know what you want, you've done the work, and you're building toward something real and lasting. The relationship ahead of you will match the quality of the person you've become. You are ready.",
            "strength": "Your readiness is not just willingness — it's preparedness. You've worked for this.",
            "growth": "Stay open to surprise. The love that's coming may exceed the version you've imagined.",
        },
        "medium": {
            "profile": "Growth-Oriented",
            "badge": "🌱",
            "headline": "You're actively cultivating the qualities that great love requires.",
            "summary": "Your commitment to growth is one of the most attractive things about you. The relationship ahead will be built on the foundation you're laying right now — and that foundation is real.",
            "strength": "You understand that love is not found — it's built. That understanding puts you ahead of most people.",
            "growth": "Name the one relationship quality you most want to embody, and practise it in every interaction — not just romantic ones.",
        },
        "low": {
            "profile": "Awakening to Possibility",
            "badge": "🌅",
            "headline": "Your most meaningful relationship chapter is just beginning to open.",
            "summary": "The questions you're sitting with, the clarity you're building — this is the work that transforms a life. You're at the beginning of something significant. Your future in love is not diminished — it's full of unwritten possibility.",
            "strength": "You came here. You answered 108 honest questions. That is not nothing — that is everything.",
            "growth": "The single most powerful thing you can do is choose one small act of love toward yourself today. From that, everything else grows.",
        },
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
#  SCORING HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _score_answer(value: Any) -> float:
    """Normalise any answer type to 0.0–1.0.

    Handles:
      - int/float  : scale questions (1–7)
      - str        : single choice letter (A/B/C/D), binary text, or "none"
      - list[str]  : multi-select choice (average of selected letter scores)
    """
    choice_map = {"A": 1.0, "B": 0.67, "C": 0.33, "D": 0.0}

    if isinstance(value, (int, float)):
        v = float(value)
        return max(0.0, min(1.0, (v - 1) / 6.0))   # scale 1–7 → 0–1

    if isinstance(value, list):
        # Multi-select: "none" alone = 0.15, else average the chosen letters
        if not value or value == ["none"]:
            return 0.15
        scores = [choice_map[v] for v in value if v in choice_map]
        return sum(scores) / len(scores) if scores else 0.5

    if isinstance(value, str):
        if value == "none":
            return 0.15
        if value in choice_map:
            return choice_map[value]
        binary_map = {
            "Yes": 1.0, "yes": 1.0,
            "Sometimes": 0.5, "Maybe": 0.5, "Depends": 0.5,
            "Partly": 0.5, "Once": 0.5, "Open to discussion": 0.5,
            "Working on it": 0.5, "Almost": 0.5, "I hope so": 0.5,
            "Mostly": 0.5,
            "No": 0.0, "no": 0.0, "Not yet": 0.0, "Not sure": 0.0,
        }
        return binary_map.get(value, 0.5)
    return 0.5


def _compute_section_score(answers: dict) -> float:
    """Returns 0.0–1.0 score for a section's answers dict."""
    if not answers:
        return 0.5
    values = [_score_answer(v) for v in answers.values()]
    return sum(values) / len(values)


def _get_mini_insight(section_id: str, score: float) -> dict:
    tier = "high" if score >= 0.65 else ("medium" if score >= 0.40 else "low")
    return {**SECTION_INSIGHTS[section_id][tier], "score": round(score * 100), "tier": tier}


_XP_PER_Q = 10
_XP_MAX   = 108 * _XP_PER_Q   # 1,080

_COMMITMENT_TIERS = [
    (0.93, "Deep Seeker",        "🔥", "You answered with rare depth and honesty. This level of self-reflection is the foundation of extraordinary relationships."),
    (0.80, "Committed Explorer", "⭐", "Your dedication to this journey speaks to how seriously you take relationship growth. That seriousness is a gift to your future partner."),
    (0.65, "Growing Seeker",     "🌱", "You brought real effort to this assessment. Every question you answered honestly is a step toward clearer self-knowledge."),
    (0.00, "Beginning Explorer", "🌅", "You've started the journey. Even a partial exploration creates valuable insight — consider revisiting and going deeper when you're ready."),
]

def _commitment_tier(xp: int) -> dict:
    pct = xp / _XP_MAX
    for threshold, label, badge, message in _COMMITMENT_TIERS:
        if pct >= threshold:
            return {"label": label, "badge": badge, "message": message, "pct": round(pct * 100)}
    return {"label": "Beginning Explorer", "badge": "🌅", "message": _COMMITMENT_TIERS[-1][3], "pct": round(pct * 100)}


def _percentile_label(score: int) -> str:
    """Return a contextual percentile label for a dimension or overall score."""
    if score >= 85:   return "Top 10% of respondents"
    if score >= 75:   return "Top 25% of respondents"
    if score >= 65:   return "Top 40% of respondents"
    if score >= 55:   return "Above average"
    if score >= 45:   return "Average range"
    return "Below average — significant room to grow"


def _detect_attachment_style(all_answers: dict) -> dict:
    """Detect attachment style from s1_q10, or infer from section_1 score."""
    s1_answers = all_answers.get("section_1", {})
    q10 = s1_answers.get("s1_q10")

    styles = {
        "A": {
            "name": "Secure",
            "emoji": "💚",
            "description": "You feel comfortable with both closeness and independence. You trust that love can be steady without needing constant reassurance.",
            "in_relationships": "You communicate needs clearly, repair conflict gracefully, and create a safe emotional space for your partner to be fully themselves.",
            "ideal_partner_trait": "Someone equally secure — or genuinely and actively working toward secure attachment.",
        },
        "B": {
            "name": "Anxious",
            "emoji": "💛",
            "description": "You love deeply and long for closeness, but can worry about whether you are truly valued. Your sensitivity is a profound relational gift when channelled well.",
            "in_relationships": "Learning to self-soothe before seeking reassurance will transform how you experience love. Your capacity to feel deeply is your superpower.",
            "ideal_partner_trait": "Someone consistent, communicative, and emotionally available — who never plays hot and cold and shows up reliably.",
        },
        "C": {
            "name": "Avoidant",
            "emoji": "💙",
            "description": "You value your independence deeply and may withdraw when relationships get too close. This is a learned protective response — not a character flaw.",
            "in_relationships": "Practising vulnerability in small, safe moments is your greatest growth edge. Intimacy and autonomy can genuinely coexist.",
            "ideal_partner_trait": "Someone who respects your need for space while staying emotionally open — without pressure or ultimatums.",
        },
        "D": {
            "name": "Evolving / Mixed",
            "emoji": "🌀",
            "description": "You are in active discovery of your attachment patterns. This awareness puts you ahead of most people, who never examine this layer of themselves at all.",
            "in_relationships": "Every relationship teaches you something new about how you love. Your openness to learning makes you a deeply rewarding and growing partner.",
            "ideal_partner_trait": "Someone patient, self-aware, and curious — who sees growth as a shared, lifelong journey rather than a destination.",
        },
    }

    if q10 in styles:
        return styles[q10]

    # Infer from section_1 score as fallback
    s1_score = _compute_section_score(s1_answers)
    if s1_score >= 0.75:
        return styles["A"]
    elif s1_score >= 0.50:
        return styles["D"]
    else:
        return styles["B"]


def _generate_inter_dimension_insights(section_scores: dict) -> list:
    """Generate 3 personalised cross-dimensional insights from score combinations."""
    insights = []

    emo  = section_scores.get("section_1", 0.5)
    val  = section_scores.get("section_2", 0.5)
    comm = section_scores.get("section_3", 0.5)
    pat  = section_scores.get("section_4", 0.5)
    life = section_scores.get("section_5", 0.5)
    fut  = section_scores.get("section_6", 0.5)

    # Insight 1: Emotional Foundation × Communication
    if emo >= 0.65 and comm >= 0.65:
        insights.append("🔗 Emotional Foundation × Communication: You feel deeply and can express those feelings with clarity — an exceptionally rare combination. Most people can do one or the other; you're building the capacity for both. This is the core engine of lasting intimacy.")
    elif emo >= 0.65 and comm < 0.55:
        insights.append("🔗 Emotional Foundation × Communication: You have a rich inner emotional world, but translating it into clear spoken language is your growth edge. Bridging the gap between what you feel and what you say will be one of your most transformational relationship investments.")
    elif emo < 0.55 and comm >= 0.65:
        insights.append("🔗 Emotional Foundation × Communication: Your communication skills are genuinely strong — you have the language. Now the work is deepening what you're communicating from. Pairing strong expression with deeper emotional self-awareness will take your relationships to an entirely new level.")
    else:
        insights.append("🔗 Emotional Foundation × Communication: Both your inner emotional world and its outward expression have meaningful room to develop. Working on these together is powerful — the sequence that works best is: go inward first (what am I feeling?), then outward (how do I express this?).")

    # Insight 2: Relationship Patterns × Growth & Future
    if pat >= 0.65 and fut >= 0.75:
        insights.append("🔗 Relationship Patterns × Growth & Future: You've examined how you've loved in the past and you're oriented toward a clear future — this balance is rare and genuinely powerful. You are neither trapped by history nor naive about what lies ahead. This is emotional maturity in action.")
    elif pat >= 0.65 and fut < 0.60:
        insights.append("🔗 Relationship Patterns × Growth & Future: You've done impressive work understanding your relationship history. Your next step is translating that self-knowledge into forward momentum. Consider this: what specifically are you building toward — not just what are you healing from?")
    elif pat < 0.55 and fut >= 0.75:
        insights.append("🔗 Relationship Patterns × Growth & Future: Your enthusiasm and readiness for the future is genuine and energising. Pairing it with a deeper examination of recurring relationship patterns will make that future far more durable — understanding the past is the best insurance going forward.")
    else:
        insights.append("🔗 Relationship Patterns × Growth & Future: Both dimensions have meaningful room to grow. The work of understanding how you've loved before directly feeds the clarity of where you're heading next. These two dimensions are deeply interdependent.")

    # Insight 3: Values & Life Vision × Daily Life & Lifestyle
    if val >= 0.65 and life >= 0.65:
        insights.append("🔗 Values & Lifestyle: Your clarity on both your values and your daily lifestyle preferences means you know not just what you believe in, but how you actually want to live. This alignment dramatically reduces the 'small friction' incompatibilities that quietly erode so many relationships over time.")
    elif val >= 0.65 and life < 0.55:
        insights.append("🔗 Values & Lifestyle: Your strong values clarity is a wonderful compass — now apply that same intentionality to your daily rhythms and lifestyle. The gap between your principles and your everyday habits is worth closing. How you spend each day is ultimately how you live your values.")
    elif val < 0.55 and life >= 0.65:
        insights.append("🔗 Values & Lifestyle: You know how you want to live day-to-day with real clarity. Pairing that with deeper reflection on your core values will give your lifestyle choices lasting meaning and direction. Right now the 'how' of life is clearer than the 'why'.")
    else:
        insights.append("🔗 Values & Lifestyle: Clarifying both your values and lifestyle preferences together is some of the most practical relationship preparation you can do. These two dimensions shape everything — from who you are attracted to, to how you navigate everyday life as a couple.")

    return insights


def _generate_expanded_partner_profile(section_scores: dict, attachment_style: dict) -> dict:
    """Generate a rich, multi-dimensional ideal partner profile."""
    emo  = section_scores.get("section_1", 0.5)
    val  = section_scores.get("section_2", 0.5)
    comm = section_scores.get("section_3", 0.5)
    pat  = section_scores.get("section_4", 0.5)
    life = section_scores.get("section_5", 0.5)
    fut  = section_scores.get("section_6", 0.5)

    if emo >= 0.65:
        emo_trait = "High emotional availability — someone who can meet you in depth and vulnerability without pulling away."
    elif emo >= 0.45:
        emo_trait = "Consistent emotional presence — reliable and warm, even if not always intensely expressive."
    else:
        emo_trait = "Patient emotional warmth — someone who creates safety gently, without pushing or demanding."

    if val >= 0.65:
        val_trait = "Strong values alignment — they don't need to be identical to yours, but the fundamentals must resonate deeply."
    else:
        val_trait = "Openness to building a shared value system together over time — curious and growth-oriented."

    if comm >= 0.65:
        comm_trait = "A skilled communicator who can hold difficult conversations with care, presence, and without retreating."
    else:
        comm_trait = "A patient communicator who creates space for you to express yourself fully and without judgment."

    if pat >= 0.65:
        pat_trait = "Someone who has done their own inner work and takes genuine responsibility for their patterns — not a fixer, but a fellow grower."
    else:
        pat_trait = "Self-aware, non-judgmental, and willing to grow alongside you — not perfect, but genuinely trying."

    if life >= 0.65:
        life_trait = "Daily life compatibility — similar rhythms, energy levels, and a shared sense of what a good day looks and feels like."
    else:
        life_trait = "Flexibility and adaptability in lifestyle — willing to co-create new rhythms rather than forcing a pre-existing mould."

    if fut >= 0.75:
        fut_trait = "A clear sense of direction — they know what they are building and why, and they are ready to build it with you."
    else:
        fut_trait = "Shared openness to growth and becoming — someone who values who you are each becoming, not just who you are today."

    summary = (
        f"Based on your {attachment_style['name']} attachment style and your full six-dimension profile, "
        f"your ideal partner brings {emo_trait.lower().rstrip('.')} "
        f"and shares {val_trait.lower().rstrip('.')}."
    )

    return {
        "summary": summary,
        "dimensions": [
            {"label": "Emotional",      "icon": "❤️",  "trait": emo_trait},
            {"label": "Values",         "icon": "🌟",  "trait": val_trait},
            {"label": "Communication",  "icon": "💬",  "trait": comm_trait},
            {"label": "Patterns",       "icon": "🔄",  "trait": pat_trait},
            {"label": "Lifestyle",      "icon": "☀️",  "trait": life_trait},
            {"label": "Future",         "icon": "🚀",  "trait": fut_trait},
        ],
    }


def _generate_score_specific_recommendations(
    section_scores: dict,
    section_profiles: list,
    attachment_style: dict,
) -> list:
    """Generate 6 recommendations tied directly to this user's scores and patterns."""

    weakest = sorted(section_profiles, key=lambda x: x["score"])

    dimension_recs = {
        "Emotional Foundation": (
            "Start a daily emotional check-in: each evening, name one emotion you felt today and trace it to its likely source. "
            "This 3-minute practice, done for 30 consecutive days, builds the emotional vocabulary that transforms how you connect."
        ),
        "Values & Life Vision": (
            "Write your personal values manifesto — 3 non-negotiable values and 3 aspirational ones. "
            "Review it monthly and honestly assess whether your recent choices reflect these values. The gap between stated and lived values is where growth lives."
        ),
        "Communication & Connection": (
            "Practise the 'feel, need, request' framework in one real conversation this week: "
            "'I feel [emotion]. I need [need]. Could you [specific request]?' "
            "This single framework, practised consistently, transforms relationship dialogue from reactive to intentional."
        ),
        "Relationship Patterns": (
            "Map your last 3 significant relationships: what initially attracted you, what worked, and what recurring theme or dynamic emerged each time. "
            "Patterns only become visible when you look across relationships — not just within them. Write it out."
        ),
        "Daily Life & Lifestyle": (
            "Write out your ideal week in specific detail — morning rituals, social energy, weekend pace, financial rhythms. "
            "Then honestly compare it to how you actually live now. "
            "This clarity exercise prevents years of lifestyle incompatibility from quietly eroding a promising relationship."
        ),
        "Growth & Future": (
            "Create a vivid, specific 'Relationship Vision': not just 'happy' — specific. "
            "What do weekday mornings look like? How do you handle disagreement? What does your home feel like? "
            "Specificity turns a wish into a direction."
        ),
    }

    recs = []

    # Rec 1: Weakest dimension — most targeted advice
    recs.append(dimension_recs.get(
        weakest[0]["title"],
        "Focus daily, intentional practice on your lowest-scoring dimension — even 10 minutes a day creates compound growth over 90 days."
    ))

    # Rec 2: Attachment style — personalised book/practice
    attachment_name = attachment_style.get("name", "")
    if attachment_name == "Anxious":
        recs.append(
            "Read 'Attached' by Levine & Heller, focusing closely on the Anxious Attachment chapter. "
            "Then identify your top 3 specific triggers — the situations that most activate your anxious patterns. "
            "Naming them precisely is 50% of rewiring them."
        )
    elif attachment_name == "Avoidant":
        recs.append(
            "Read 'Attached' by Levine & Heller, focusing on the Avoidant chapter. "
            "Then practise one deliberate act of vulnerability per week — sharing something real with someone safe. "
            "Small, consistent steps are how avoidant patterns are genuinely transformed."
        )
    elif attachment_name == "Secure":
        recs.append(
            "Your secure attachment is a real relational asset. "
            "Read 'The Relationship Cure' by John Gottman to deepen your ability to support partners "
            "who may carry different (and more challenging) attachment histories than your own."
        )
    else:
        recs.append(
            "Read 'Attached' by Levine & Heller to map your attachment patterns with greater precision. "
            "Understanding the Secure, Anxious, and Avoidant styles will clarify dynamics you may have sensed but not yet been able to name."
        )

    # Rec 3: Communication-specific (personalised by score)
    comm_score = section_scores.get("section_3", 0.5)
    if comm_score < 0.65:
        recs.append(
            "Invest in one communication skill this month: active listening without preparing your response. "
            "In your next 3 significant conversations, your only task is to understand — not to be understood. "
            "This single shift changes the quality of every relationship you have."
        )
    else:
        recs.append(
            "Your communication strength is a genuine gift to your relationships. "
            "Now deepen it under pressure: develop a personal 'pause signal' — a word or phrase that means "
            "'I need 20 minutes before I can discuss this well.' Using it consistently prevents the reactive moments that undo good communication."
        )

    # Rec 4: Second weakest dimension
    recs.append(dimension_recs.get(
        weakest[1]["title"],
        "Apply intentional daily practice to your second-lowest dimension — consistent small actions over 60 days will create measurable change."
    ))

    # Rec 5: Therapy / coaching (personalised by scores)
    emo_score = section_scores.get("section_1", 0.5)
    pat_score = section_scores.get("section_4", 0.5)
    if emo_score < 0.55 or pat_score < 0.55:
        recs.append(
            "Consider 6 sessions with a therapist who specialises in attachment and relationship patterns. "
            "For your specific profile — where Emotional Foundation or Relationship Patterns show the most growth potential — "
            "this is the highest-ROI investment you can make in your relationship future."
        )
    else:
        recs.append(
            "Consider 3 sessions with a relationship-focused coach to convert this report's insights into specific, accountable goals. "
            "Even high scorers benefit enormously from a structured space for reflection and targeted practice."
        )

    # Rec 6: Reassessment with specific dimensions named
    recs.append(
        f"Retake this assessment in 6 months and track the movement in your '{weakest[0]['title']}' "
        f"and '{weakest[1]['title']}' scores specifically — these are your two highest-leverage dimensions right now. "
        f"Scores are not fixed. They reflect where you are, not who you are."
    )

    return recs


def _generate_full_report(all_answers: dict, user_name: str = "") -> dict:
    """Generate the complete, enriched ₹999 Relationship Intelligence Report."""
    section_scores = {}
    section_profiles = []
    total_score = 0.0

    for section in SECTIONS_META:
        sid = section["id"]
        answers = all_answers.get(sid, {})
        score = _compute_section_score(answers)
        section_scores[sid] = score
        total_score += score
        insight = _get_mini_insight(sid, score)
        score_int = round(score * 100)
        section_profiles.append({
            "section_id": sid,
            "title": section["title"],
            "icon": section["icon"],
            "level": section["level"],
            "score": score_int,
            "percentile": _percentile_label(score_int),
            "profile": insight["profile"],
            "badge": insight["badge"],
            "headline": insight["headline"],
            "summary": insight["summary"],
            "strength": insight["strength"],
            "growth": insight["growth"],
        })

    overall = round((total_score / SECTIONS_COUNT) * 100)

    # Sort by score for strengths / growth areas
    sorted_by_score = sorted(section_profiles, key=lambda x: x["score"], reverse=True)
    top3   = sorted_by_score[:3]
    bottom3 = sorted_by_score[-3:]

    # Synthesised strengths — include dimension title and score for context
    top_strengths = [
        f"{top3[0]['title']} ({top3[0]['score']}/100): {top3[0]['strength']}",
        f"{top3[1]['title']} ({top3[1]['score']}/100): {top3[1]['strength']}",
        f"{top3[2]['title']} ({top3[2]['score']}/100): {top3[2]['strength']}",
    ]
    growth_areas = [
        f"{bottom3[2]['title']} ({bottom3[2]['score']}/100): {bottom3[2]['growth']}",
        f"{bottom3[1]['title']} ({bottom3[1]['score']}/100): {bottom3[1]['growth']}",
        f"{bottom3[0]['title']} ({bottom3[0]['score']}/100): {bottom3[0]['growth']}",
    ]

    # New enriched sections
    attachment_style = _detect_attachment_style(all_answers)
    inter_dimension_insights = _generate_inter_dimension_insights(section_scores)
    expanded_partner = _generate_expanded_partner_profile(section_scores, attachment_style)
    recommendations = _generate_score_specific_recommendations(section_scores, section_profiles, attachment_style)

    # Score context explanation
    if overall >= 80:
        score_context = (
            f"A score of {overall}/100 places you in the top tier of relationship readiness. "
            f"You've done meaningful self-work across most dimensions. "
            f"The growth areas that remain are nuanced — the kind that only reveal themselves at depth."
        )
    elif overall >= 65:
        score_context = (
            f"A score of {overall}/100 reflects genuine emotional intelligence with specific areas still developing. "
            f"This is a healthy, realistic profile — and importantly, your growth areas are clearly identifiable and directly actionable."
        )
    elif overall >= 50:
        score_context = (
            f"A score of {overall}/100 shows you are on a genuine growth journey. "
            f"Several dimensions have meaningful room to develop, and this report gives you a clear, prioritised roadmap for where to focus your energy."
        )
    else:
        score_context = (
            f"A score of {overall}/100 reflects an honest self-assessment at the start of a deeper journey. "
            f"This level of honesty is the most important starting point — far more valuable than a high score built on self-deception."
        )

    # Fix headline: name goes at the front, no double-name bug
    first_name = user_name.split()[0] if user_name else ""
    if first_name:
        if overall >= 60:
            headline = f"{first_name}, your Relationship Intelligence is rich, layered, and full of promise."
        else:
            headline = f"{first_name}, you are at the beginning of something significant."
    else:
        if overall >= 60:
            headline = "Your Relationship Intelligence is rich, layered, and full of promise."
        else:
            headline = "You are at the beginning of something significant."

    # Commitment Score (XP)
    total_answered = sum(len(v) for v in all_answers.values() if isinstance(v, dict))
    xp_earned      = min(total_answered * _XP_PER_Q, _XP_MAX)
    commitment     = _commitment_tier(xp_earned)

    return {
        "overall_score": overall,
        "overall_label": "Advanced" if overall >= 70 else ("Developing" if overall >= 45 else "Foundational"),
        "overall_percentile": _percentile_label(overall),
        "headline": headline,
        "summary": (
            f"Across all six dimensions of relationship intelligence, you scored {overall}/100. "
            f"Your strongest dimension is {sorted_by_score[0]['title']} ({sorted_by_score[0]['score']}/100) — "
            f"where you demonstrate {sorted_by_score[0]['profile'].lower()}. "
            f"Your greatest growth opportunity is {sorted_by_score[-1]['title']} ({sorted_by_score[-1]['score']}/100), "
            f"where focused work will unlock your most significant transformation."
        ),
        "score_context": score_context,
        "section_profiles": section_profiles,
        "top_strengths": top_strengths,
        "growth_areas": growth_areas,
        "attachment_style": attachment_style,
        "inter_dimension_insights": inter_dimension_insights,
        "xp_earned": xp_earned,
        "xp_max": _XP_MAX,
        "commitment_tier": commitment["label"],
        "commitment_badge": commitment["badge"],
        "commitment_pct": commitment["pct"],
        "commitment_message": commitment["message"],
        "partner_compatibility_profile": expanded_partner["summary"],
        "partner_profile_dimensions": expanded_partner["dimensions"],
        "recommendations": recommendations,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 0 — Public question bank
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/questions")
async def get_questions():
    """Return the full 108-question bank (public endpoint, no auth required)."""
    return {"sections": SECTIONS_FULL}


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 1 — Start guest session
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/guest/start")
async def start_guest_session():
    """Create a new guest session. Returns temp_user_token."""
    session_id  = str(uuid.uuid4())
    temp_token  = str(uuid.uuid4()).replace("-", "")
    now         = datetime.now(timezone.utc)

    await db.insight_guest_sessions.insert_one({
        "session_id":          session_id,
        "temp_token":          temp_token,
        "answers":             {},
        "completed_sections":  [],
        "current_section":     "section_1",
        "current_question":    0,
        "created_at":          now,
        "expires_at":          now + timedelta(days=GUEST_TTL_DAYS),
        "converted":           False,
        "converted_user_id":   None,
    })

    return {
        "session_id": session_id,
        "temp_token": temp_token,
        "message":    "Guest session started. Store your temp_token to resume.",
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 2 — Save section answers (guest)
# ═══════════════════════════════════════════════════════════════════════════════

class GuestAnswersRequest(BaseModel):
    temp_token:       str
    answers:          dict         # {"s1_q1": 5, "s1_q2": "A", ...}
    current_question: Optional[int] = 0


@router.post("/guest/answers/{section_id}")
async def save_guest_answers(section_id: str, payload: GuestAnswersRequest):
    """Save a section's answers for a guest session."""
    if section_id not in VALID_SECTION_IDS:
        raise HTTPException(status_code=400, detail="Invalid section_id.")

    session = await db.insight_guest_sessions.find_one(
        {"temp_token": payload.temp_token}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Guest session not found. Please start a new one.")
    if session.get("converted"):
        raise HTTPException(status_code=410, detail="Session already converted to a user account.")

    # Merge new answers into existing
    existing_answers = session.get("answers") or {}
    existing_answers[section_id] = payload.answers

    # Determine completed sections
    completed = list(session.get("completed_sections") or [])
    if payload.current_question >= QUESTIONS_PER_SECTION - 1 and section_id not in completed:
        completed.append(section_id)

    # Determine next section
    section_order = [m["id"] for m in SECTIONS_META]
    current_idx   = section_order.index(section_id)
    next_section  = section_order[current_idx + 1] if current_idx + 1 < len(section_order) else section_id

    await db.insight_guest_sessions.update_one(
        {"temp_token": payload.temp_token},
        {"$set": {
            f"answers.{section_id}":  payload.answers,
            "completed_sections":     completed,
            "current_section":        next_section,
            "current_question":       payload.current_question,
            "updated_at":             datetime.now(timezone.utc),
        }},
    )

    is_complete = len(completed) == SECTIONS_COUNT
    score       = _compute_section_score(payload.answers)

    return {
        "saved":        True,
        "section_id":   section_id,
        "is_complete":  payload.current_question >= QUESTIONS_PER_SECTION - 1,
        "all_complete": is_complete,
        "score":        round(score * 100),
        "next_section": next_section,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 3 — Get guest progress
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/guest/progress")
async def get_guest_progress(token: str = Query(..., description="temp_user_token")):
    """Resume a guest session — returns saved progress and answers."""
    session = await db.insight_guest_sessions.find_one(
        {"temp_token": token}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    if session.get("converted"):
        return {
            "converted":  True,
            "message":    "This session has been linked to a user account.",
        }

    return {
        "session_id":         session["session_id"],
        "temp_token":         session["temp_token"],
        "answers":            session.get("answers") or {},
        "completed_sections": session.get("completed_sections") or [],
        "current_section":    session.get("current_section") or "section_1",
        "current_question":   session.get("current_question") or 0,
        "all_complete":       len(session.get("completed_sections") or []) == SECTIONS_COUNT,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 4 — Section mini-insight (guest or user)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/guest/section/{section_id}/insight")
async def get_section_insight(
    section_id: str,
    token: str = Query(..., description="temp_user_token"),
):
    """Return mini-insight for a completed section."""
    if section_id not in VALID_SECTION_IDS:
        raise HTTPException(status_code=400, detail="Invalid section_id.")

    session = await db.insight_guest_sessions.find_one(
        {"temp_token": token}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    answers = (session.get("answers") or {}).get(section_id, {})
    if not answers:
        raise HTTPException(status_code=400, detail="No answers found for this section yet.")

    score   = _compute_section_score(answers)
    insight = _get_mini_insight(section_id, score)
    meta    = next(m for m in SECTIONS_META if m["id"] == section_id)

    return {
        "section_id":    section_id,
        "section_title": meta["title"],
        "level":         meta["level"],
        **insight,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 5 — Convert guest → logged-in user
# ═══════════════════════════════════════════════════════════════════════════════

class ConvertGuestRequest(BaseModel):
    temp_token: str


@router.post("/convert-guest")
async def convert_guest(
    payload:      ConvertGuestRequest,
    current_user: dict = Depends(get_current_user),
):
    """Migrate guest answers and progress into the logged-in user's insight profile."""
    user_id = current_user["user_id"]

    session = await db.insight_guest_sessions.find_one(
        {"temp_token": payload.temp_token}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Guest session not found.")
    if session.get("converted"):
        # Already converted — check if it's this user
        if session.get("converted_user_id") == user_id:
            return {"converted": True, "message": "Already linked to your account."}
        raise HTTPException(status_code=409, detail="Session already linked to another account.")

    now = datetime.now(timezone.utc)
    guest_answers    = session.get("answers") or {}
    completed_secs   = session.get("completed_sections") or []
    current_section  = session.get("current_section") or "section_1"
    current_question = session.get("current_question") or 0

    # Upsert user insight profile
    await db.insight_profiles.update_one(
        {"user_id": user_id},
        {"$setOnInsert": {
            "user_id":         user_id,
            "payment_status":  "unpaid",
            "report_unlocked": False,
            "report_data":     None,
            "created_at":      now,
        },
         "$set": {
             "answers":             guest_answers,
             "completed_sections":  completed_secs,
             "current_section":     current_section,
             "current_question":    current_question,
             "all_complete":        len(completed_secs) == SECTIONS_COUNT,
             "updated_at":          now,
         }},
        upsert=True,
    )

    # Mark guest session as converted
    await db.insight_guest_sessions.update_one(
        {"temp_token": payload.temp_token},
        {"$set": {
            "converted":         True,
            "converted_user_id": user_id,
            "converted_at":      now,
        }},
    )

    return {
        "converted":          True,
        "completed_sections": completed_secs,
        "all_complete":       len(completed_secs) == SECTIONS_COUNT,
        "message":            "Your progress has been saved to your account.",
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 6 — Create payment order
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/payment")
async def create_payment(current_user: dict = Depends(get_current_user)):
    """Create a Razorpay order for the ₹999 Relationship Intelligence Report."""
    user_id = current_user["user_id"]

    profile = await db.insight_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete the assessment first.")
    if not profile.get("all_complete"):
        raise HTTPException(status_code=400, detail="Please complete all 6 sections before unlocking.")
    if profile.get("payment_status") == "paid":
        return {"already_paid": True, "message": "Report already unlocked.", "report_unlocked": True}

    order_id = f"order_insights_{uuid.uuid4().hex[:14]}"

    await db.insight_profiles.update_one(
        {"user_id": user_id},
        {"$set": {
            "razorpay_order_id": order_id,
            "payment_status":    "pending",
        }},
    )

    return {
        "already_paid": False,
        "order": {
            "id":              order_id,
            "amount":          REPORT_PRICE_PAISE,
            "currency":        "INR",
            "razorpay_key_id": RAZORPAY_KEY_ID,
            "is_dummy":        _is_dummy_mode(),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 7 — Verify payment & generate report
# ═══════════════════════════════════════════════════════════════════════════════

class VerifyInsightPayment(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  Optional[str] = None


@router.post("/verify-payment")
async def verify_insight_payment(
    payload:      VerifyInsightPayment,
    current_user: dict = Depends(get_current_user),
):
    user_id  = current_user["user_id"]
    now      = datetime.now(timezone.utc)

    profile = await db.insight_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Insight profile not found.")
    if profile.get("payment_status") == "paid":
        return {"success": True, "report_unlocked": True, "message": "Already unlocked."}

    # Signature verification (skipped in dummy mode)
    if not _is_dummy_mode() and payload.razorpay_signature:
        import hmac, hashlib
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, payload.razorpay_signature):
            raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    # Generate full report
    report = _generate_full_report(
        profile.get("answers") or {},
        current_user.get("full_name", ""),
    )

    await db.insight_profiles.update_one(
        {"user_id": user_id},
        {"$set": {
            "payment_status":      "paid",
            "razorpay_payment_id": payload.razorpay_payment_id,
            "report_unlocked":     True,
            "report_data":         report,
            "unlocked_at":         now,
        }},
    )

    return {
        "success":        True,
        "report_unlocked": True,
        "message":        "Payment confirmed! Your Relationship Intelligence Report is ready.",
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 8 — Retrieve full report (paid users only)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/report")
async def get_insight_report(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    profile = await db.insight_profiles.find_one({"user_id": user_id}, {"_id": 0})

    if not profile:
        raise HTTPException(status_code=404, detail="No insight profile found.")
    if profile.get("payment_status") != "paid":
        raise HTTPException(status_code=402, detail="Report not yet unlocked. Please complete payment.")

    return {
        "report_unlocked": True,
        "report":          profile.get("report_data"),
        "unlocked_at":     profile.get("unlocked_at"),
        "user_name":       current_user.get("full_name", ""),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 9 — User profile status (logged-in users)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/my-status")
async def get_my_insight_status(current_user: dict = Depends(get_current_user)):
    """Return current status for a logged-in user's insight journey."""
    user_id = current_user["user_id"]
    profile = await db.insight_profiles.find_one({"user_id": user_id}, {"_id": 0})

    if not profile:
        return {
            "has_profile":        False,
            "completed_sections": [],
            "all_complete":       False,
            "payment_status":     "unpaid",
            "report_unlocked":    False,
        }

    return {
        "has_profile":        True,
        "completed_sections": profile.get("completed_sections") or [],
        "current_section":    profile.get("current_section") or "section_1",
        "current_question":   profile.get("current_question") or 0,
        "all_complete":       profile.get("all_complete") or False,
        "payment_status":     profile.get("payment_status") or "unpaid",
        "report_unlocked":    profile.get("report_unlocked") or False,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINT 10 — Admin analytics
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/analytics")
async def insights_admin_analytics(current_user: dict = Depends(get_current_user)):
    """Admin-only: guest, conversion, and payment analytics."""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required.")

    total_guests      = await db.insight_guest_sessions.count_documents({})
    converted_guests  = await db.insight_guest_sessions.count_documents({"converted": True})
    total_profiles    = await db.insight_profiles.count_documents({})
    paid_users        = await db.insight_profiles.count_documents({"payment_status": "paid"})
    complete_guests   = await db.insight_guest_sessions.count_documents(
        {"completed_sections": {"$size": SECTIONS_COUNT}}
    )

    conversion_rate  = round(converted_guests / total_guests * 100, 1) if total_guests else 0
    payment_rate     = round(paid_users / total_profiles * 100, 1)     if total_profiles else 0
    completion_rate  = round(complete_guests / total_guests * 100, 1)  if total_guests else 0

    return {
        "guest_sessions": {
            "total":            total_guests,
            "completed_all_6":  complete_guests,
            "converted_to_user": converted_guests,
            "completion_rate":  f"{completion_rate}%",
            "conversion_rate":  f"{conversion_rate}%",
        },
        "user_profiles": {
            "total":            total_profiles,
            "paid_reports":     paid_users,
            "payment_rate":     f"{payment_rate}%",
        },
        "revenue_estimate": {
            "reports_sold":     paid_users,
            "estimate_inr":     paid_users * 999,
        },
    }
