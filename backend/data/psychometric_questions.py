"""SoulSathiya 36-Question Psychometric Assessment"""

PSYCHOMETRIC_QUESTIONS_36 = [
    # EMOTIONAL STYLE (6 questions)
    {
        "question_id": "emo_1",
        "domain": "emotional_style",
        "question_text": "I openly express my emotions to my partner",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "emo_2",
        "domain": "emotional_style",
        "question_text": "I prefer to process my feelings privately before sharing them",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": True,
        "weight": 1.0
    },
    {
        "question_id": "emo_3",
        "domain": "emotional_style",
        "question_text": "I need physical affection to feel emotionally connected",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "emo_4",
        "domain": "emotional_style",
        "question_text": "During conflicts, I prefer to take a break and revisit the discussion later",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "emo_5",
        "domain": "emotional_style",
        "question_text": "I find it easy to understand and empathize with my partner's feelings",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "emo_6",
        "domain": "emotional_style",
        "question_text": "I stay calm and logical even in emotionally charged situations",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": True,
        "weight": 1.0
    },
    
    # PERSONALITY (6 questions)
    {
        "question_id": "per_1",
        "domain": "personality",
        "question_text": "I enjoy spontaneous adventures and trying new experiences",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "per_2",
        "domain": "personality",
        "question_text": "I prefer structured routines and planning ahead",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": True,
        "weight": 1.0
    },
    {
        "question_id": "per_3",
        "domain": "personality",
        "question_text": "I am naturally outgoing and energized by social interactions",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "per_4",
        "domain": "personality",
        "question_text": "I pay close attention to details and like things to be organized",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "per_5",
        "domain": "personality",
        "question_text": "I make decisions based on logic and facts rather than emotions",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "per_6",
        "domain": "personality",
        "question_text": "I am comfortable being the center of attention",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    
    # VALUES (6 questions)
    {
        "question_id": "val_1",
        "domain": "values",
        "question_text": "Family should always be the top priority in life",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "val_2",
        "domain": "values",
        "question_text": "Career ambition and professional success are very important to me",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "val_3",
        "domain": "values",
        "question_text": "Religious or spiritual beliefs should guide daily life decisions",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 2.0
    },
    {
        "question_id": "val_4",
        "domain": "values",
        "question_text": "Maintaining cultural traditions is essential in a marriage",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "val_5",
        "domain": "values",
        "question_text": "Financial security is more important than following one's passion",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "val_6",
        "domain": "values",
        "question_text": "Both partners should have equal say in major life decisions",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 2.0
    },
    
    # TRUST & ATTACHMENT (5 questions)
    {
        "question_id": "tru_1",
        "domain": "trust_attachment",
        "question_text": "I feel secure when my partner has close friendships outside our relationship",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "tru_2",
        "domain": "trust_attachment",
        "question_text": "I need regular reassurance from my partner about their feelings for me",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": True,
        "weight": 1.0
    },
    {
        "question_id": "tru_3",
        "domain": "trust_attachment",
        "question_text": "I believe in complete transparency including sharing all passwords and devices",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "tru_4",
        "domain": "trust_attachment",
        "question_text": "I am comfortable with my partner spending time alone without me",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "tru_5",
        "domain": "trust_attachment",
        "question_text": "Past relationship betrayals still affect how I approach new relationships",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": True,
        "weight": 1.0
    },
    
    # LIFESTYLE (6 questions)
    {
        "question_id": "lif_1",
        "domain": "lifestyle",
        "question_text": "I prefer spending weekends at home rather than going out",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "lif_2",
        "domain": "lifestyle",
        "question_text": "Physical fitness and health are top priorities in my daily routine",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "lif_3",
        "domain": "lifestyle",
        "question_text": "I am willing to relocate for my partner's career opportunities",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "lif_4",
        "domain": "lifestyle",
        "question_text": "I enjoy hosting social gatherings and entertaining guests regularly",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "lif_5",
        "domain": "lifestyle",
        "question_text": "Saving money for the future is more important than spending on experiences",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "lif_6",
        "domain": "lifestyle",
        "question_text": "I prefer living in a joint family with parents/in-laws",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 2.0
    },
    
    # GROWTH MINDSET (3 questions)
    {
        "question_id": "gro_1",
        "domain": "growth_mindset",
        "question_text": "I believe people can fundamentally change their personality and habits",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    {
        "question_id": "gro_2",
        "domain": "growth_mindset",
        "question_text": "I am open to my partner's constructive feedback and willing to work on myself",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "gro_3",
        "domain": "growth_mindset",
        "question_text": "I am committed to ongoing personal development and learning",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.0
    },
    
    # MARRIAGE EXPECTATIONS (4 questions)
    {
        "question_id": "exp_1",
        "domain": "marriage_expectations",
        "question_text": "I definitely want to have children in the future",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 3.0
    },
    {
        "question_id": "exp_2",
        "domain": "marriage_expectations",
        "question_text": "Both partners should contribute financially to household expenses",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "exp_3",
        "domain": "marriage_expectations",
        "question_text": "Household chores and responsibilities should be equally divided",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    },
    {
        "question_id": "exp_4",
        "domain": "marriage_expectations",
        "question_text": "One partner should be willing to compromise career for family needs",
        "question_type": "likert_5",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "reverse_scored": False,
        "weight": 1.5
    }
]
