"""
SoulSathiya Demo Data Seed Script
Creates 6 realistic demo users with complete profiles, psychometric data,
matches, messages, deep exploration pairs, and compatibility reports.
"""

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
import uuid
import random

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Demo Users Data
DEMO_USERS = [
    {
        "user_id": "demo_user_001",
        "email": "priya.sharma@demo.soulsathiya.com",
        "password": "demo123",
        "full_name": "Priya Sharma",
        "picture": "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=400",
        "subscription_tier": "elite",
        "subscription_status": "active",
        "is_verified": True,
        "gender": "female",
        "age": 28,
        "city": "Mumbai",
        "occupation": "Product Manager at Google",
        "education": "MBA - IIM Ahmedabad",
        "bio": "Tech enthusiast who loves exploring new cafes and reading poetry. Looking for someone who values deep conversations and personal growth.",
        "archetype": "intellectual_companion"
    },
    {
        "user_id": "demo_user_002",
        "email": "arjun.mehta@demo.soulsathiya.com",
        "password": "demo123",
        "full_name": "Arjun Mehta",
        "picture": "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=400",
        "subscription_tier": "elite",
        "subscription_status": "active",
        "is_verified": True,
        "gender": "male",
        "age": 30,
        "city": "Mumbai",
        "occupation": "Senior Software Engineer at Microsoft",
        "education": "B.Tech - IIT Bombay",
        "bio": "Passionate about technology and music. Weekend guitarist and amateur chef. Seeking a partner who appreciates both ambition and quiet moments.",
        "archetype": "nurturing_anchor"
    },
    {
        "user_id": "demo_user_003",
        "email": "ananya.reddy@demo.soulsathiya.com",
        "password": "demo123",
        "full_name": "Ananya Reddy",
        "picture": "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=400",
        "subscription_tier": "premium",
        "subscription_status": "active",
        "is_verified": True,
        "gender": "female",
        "age": 26,
        "city": "Bangalore",
        "occupation": "UX Designer at Flipkart",
        "education": "NID Ahmedabad",
        "bio": "Creative soul with a passion for design and travel. Love discovering hidden gems in cities and trying local cuisines. Looking for an adventure partner.",
        "archetype": "adventurous_spirit"
    },
    {
        "user_id": "demo_user_004",
        "email": "vikram.singh@demo.soulsathiya.com",
        "password": "demo123",
        "full_name": "Vikram Singh",
        "picture": "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=400",
        "subscription_tier": "premium",
        "subscription_status": "active",
        "is_verified": True,
        "gender": "male",
        "age": 32,
        "city": "Delhi",
        "occupation": "Investment Banker at Goldman Sachs",
        "education": "MBA - ISB Hyderabad",
        "bio": "Finance professional who believes in work-life balance. Marathon runner and cricket enthusiast. Value honesty and commitment in relationships.",
        "archetype": "devoted_traditionalist"
    },
    {
        "user_id": "demo_user_005",
        "email": "sneha.patel@demo.soulsathiya.com",
        "password": "demo123",
        "full_name": "Sneha Patel",
        "picture": "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?w=400",
        "subscription_tier": "basic",
        "subscription_status": "free",
        "is_verified": False,
        "gender": "female",
        "age": 25,
        "city": "Pune",
        "occupation": "Marketing Associate at Zomato",
        "education": "BBA - Christ University",
        "bio": "Foodie and fitness enthusiast. Love yoga, cooking, and Netflix binges. Looking for someone who can make me laugh and share life's simple joys.",
        "archetype": "harmonizer"
    },
    {
        "user_id": "demo_user_006",
        "email": "rahul.kumar@demo.soulsathiya.com",
        "password": "demo123",
        "full_name": "Rahul Kumar",
        "picture": "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=400",
        "subscription_tier": None,
        "subscription_status": "free",
        "is_verified": False,
        "gender": "male",
        "age": 27,
        "city": "Hyderabad",
        "occupation": "Data Scientist at Amazon",
        "education": "M.Tech - IIIT Hyderabad",
        "bio": "Numbers by day, movies by night. Sci-fi fan and amateur photographer. Seeking someone who appreciates both logic and creativity.",
        "archetype": "independent_partner"
    }
]

# Additional photos for each user
USER_PHOTOS = {
    "demo_user_001": [
        "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=400",
        "https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?w=400",
        "https://images.pexels.com/photos/3756616/pexels-photo-3756616.jpeg?w=400"
    ],
    "demo_user_002": [
        "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=400",
        "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?w=400",
        "https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?w=400"
    ],
    "demo_user_003": [
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=400",
        "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?w=400",
        "https://images.pexels.com/photos/3756165/pexels-photo-3756165.jpeg?w=400"
    ],
    "demo_user_004": [
        "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=400",
        "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?w=400",
        "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?w=400"
    ],
    "demo_user_005": [
        "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?w=400",
        "https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?w=400"
    ],
    "demo_user_006": [
        "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=400",
        "https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg?w=400"
    ]
}

# Psychometric domain scores for each user
PSYCHOMETRIC_SCORES = {
    "demo_user_001": {
        "emotional_style": 85, "personality_core": 78, "values_priorities": 92,
        "lifestyle_compatibility": 80, "communication_style": 88, "conflict_resolution": 75, "intimacy_approach": 82
    },
    "demo_user_002": {
        "emotional_style": 80, "personality_core": 85, "values_priorities": 88,
        "lifestyle_compatibility": 82, "communication_style": 79, "conflict_resolution": 90, "intimacy_approach": 85
    },
    "demo_user_003": {
        "emotional_style": 75, "personality_core": 90, "values_priorities": 72,
        "lifestyle_compatibility": 95, "communication_style": 85, "conflict_resolution": 70, "intimacy_approach": 78
    },
    "demo_user_004": {
        "emotional_style": 70, "personality_core": 75, "values_priorities": 95,
        "lifestyle_compatibility": 68, "communication_style": 72, "conflict_resolution": 88, "intimacy_approach": 75
    },
    "demo_user_005": {
        "emotional_style": 88, "personality_core": 82, "values_priorities": 78,
        "lifestyle_compatibility": 85, "communication_style": 90, "conflict_resolution": 72, "intimacy_approach": 88
    },
    "demo_user_006": {
        "emotional_style": 72, "personality_core": 88, "values_priorities": 80,
        "lifestyle_compatibility": 75, "communication_style": 76, "conflict_resolution": 82, "intimacy_approach": 70
    }
}

# Matches configuration (user_id pairs with compatibility scores)
MATCHES = [
    ("demo_user_001", "demo_user_002", 92),  # Priya & Arjun - Elite couple
    ("demo_user_001", "demo_user_004", 78),  # Priya & Vikram
    ("demo_user_003", "demo_user_004", 85),  # Ananya & Vikram - Premium couple
    ("demo_user_003", "demo_user_006", 72),  # Ananya & Rahul
    ("demo_user_005", "demo_user_006", 80),  # Sneha & Rahul - Free users
    ("demo_user_002", "demo_user_005", 68),  # Arjun & Sneha
]

# Messages between matched users
CONVERSATIONS = [
    {
        "participants": ("demo_user_001", "demo_user_002"),
        "messages": [
            {"sender": "demo_user_002", "text": "Hi Priya! I noticed we both love exploring cafes. Have you tried the new place in Bandra?", "hours_ago": 48},
            {"sender": "demo_user_001", "text": "Hey Arjun! Yes, I've been meaning to check it out. Their cold brew is supposed to be amazing!", "hours_ago": 47},
            {"sender": "demo_user_002", "text": "Would you like to grab coffee there this weekend? I know a great time when it's not too crowded.", "hours_ago": 46},
            {"sender": "demo_user_001", "text": "I'd love that! Saturday afternoon works for me. Looking forward to it! ☕", "hours_ago": 45},
            {"sender": "demo_user_002", "text": "Perfect! I'll send you the details. Also, I saw you completed our deep compatibility - should we do it together?", "hours_ago": 24},
            {"sender": "demo_user_001", "text": "Already started! Can't wait to see our report 😊", "hours_ago": 23},
        ]
    },
    {
        "participants": ("demo_user_003", "demo_user_004"),
        "messages": [
            {"sender": "demo_user_004", "text": "Hi Ananya! Your travel photos are incredible. Where was that beach shot taken?", "hours_ago": 72},
            {"sender": "demo_user_003", "text": "Thank you Vikram! That was in Gokarna. Have you been?", "hours_ago": 70},
            {"sender": "demo_user_004", "text": "Not yet, but it's been on my list. I'm more of a mountain person but beaches are growing on me.", "hours_ago": 68},
            {"sender": "demo_user_003", "text": "Mountains are amazing too! We should plan a trip to Coorg sometime - best of both worlds!", "hours_ago": 65},
            {"sender": "demo_user_004", "text": "I'd like that. By the way, I unlocked our deep exploration. Would you be interested?", "hours_ago": 36},
            {"sender": "demo_user_003", "text": "Just saw that! Completing it now. Excited to see how we match on a deeper level!", "hours_ago": 30},
        ]
    },
    {
        "participants": ("demo_user_005", "demo_user_006"),
        "messages": [
            {"sender": "demo_user_006", "text": "Hey Sneha! Fellow foodie here. What's your favorite cuisine?", "hours_ago": 96},
            {"sender": "demo_user_005", "text": "Hi Rahul! I'm obsessed with South Indian food. The dosas in Pune are underrated!", "hours_ago": 94},
            {"sender": "demo_user_006", "text": "Agreed! Hyderabad biryani is my weakness though. We should do a food tour sometime!", "hours_ago": 90},
            {"sender": "demo_user_005", "text": "That sounds fun! Though I should warn you, I can be quite competitive about food recommendations 😄", "hours_ago": 85},
        ]
    }
]

# Deep Exploration Pairs
DEEP_PAIRS = [
    {
        "pair_id": "deep_pair_001",
        "user_a_id": "demo_user_001",
        "user_b_id": "demo_user_002",
        "tier_at_unlock": "elite",
        "payment_status": "free",  # Elite gets free
        "status": "completed",
        "deep_score": 91
    },
    {
        "pair_id": "deep_pair_002",
        "user_a_id": "demo_user_003",
        "user_b_id": "demo_user_004",
        "tier_at_unlock": "premium",
        "payment_status": "paid",  # Premium paid ₹999
        "status": "completed",
        "deep_score": 84
    }
]

# Deep Compatibility Reports
DEEP_REPORTS = {
    "deep_pair_001": {
        "deep_score": 91,
        "long_term_outlook": "Priya and Arjun demonstrate exceptional compatibility across key relationship dimensions. Their shared intellectual curiosity creates a strong foundation for meaningful conversations, while their complementary emotional styles suggest they can provide each other with both stimulation and stability. Their alignment on core values, particularly around family and career growth, indicates strong potential for a lasting partnership.",
        "strengths": [
            "Exceptional intellectual compatibility - both value deep, meaningful conversations",
            "Complementary communication styles - Priya's expressiveness balances Arjun's thoughtful listening",
            "Strong alignment on long-term life goals including family planning and career ambitions",
            "Shared appreciation for personal growth and continuous learning",
            "Compatible conflict resolution approaches - both prefer direct, respectful dialogue"
        ],
        "growth_areas": [
            "Navigate potential differences in social energy - Priya is more extroverted",
            "Establish clear boundaries around work-life balance given both have demanding careers",
            "Discuss expectations around family involvement in decision-making early"
        ],
        "dimension_scores": {
            "expectations_roles": 88,
            "conflict_repair": 92,
            "attachment_trust": 95,
            "lifestyle_integration": 85,
            "intimacy_communication": 90,
            "family_inlaw_dynamics": 88
        },
        "conversation_prompts": [
            "How do you envision balancing our careers with quality time together?",
            "What role do you see our families playing in major life decisions?",
            "How do you prefer to reconnect after we've both had stressful days?",
            "What traditions would you like us to create as a couple?"
        ]
    },
    "deep_pair_002": {
        "deep_score": 84,
        "long_term_outlook": "Ananya and Vikram show strong compatibility with exciting complementary traits. Ananya's creative energy and adventurous spirit pairs well with Vikram's structured approach and reliability. While they may need to navigate different lifestyle paces, their shared values around commitment and honesty provide a solid foundation for growth together.",
        "strengths": [
            "Excellent value alignment on commitment, honesty, and loyalty",
            "Complementary strengths - creativity meets structure",
            "Both are career-driven with mutual respect for professional ambitions",
            "Strong physical chemistry indicated by intimacy compatibility scores"
        ],
        "growth_areas": [
            "Bridge the gap between spontaneity (Ananya) and planning (Vikram)",
            "Find middle ground on social activities - frequency and type",
            "Develop shared hobbies that satisfy both adventure and relaxation needs",
            "Discuss financial management styles and create shared approach"
        ],
        "dimension_scores": {
            "expectations_roles": 82,
            "conflict_repair": 78,
            "attachment_trust": 88,
            "lifestyle_integration": 75,
            "intimacy_communication": 92,
            "family_inlaw_dynamics": 85
        },
        "conversation_prompts": [
            "How can we balance your need for adventure with my preference for routine?",
            "What does an ideal weekend look like for you?",
            "How should we handle disagreements about spending on experiences vs. savings?",
            "What are your thoughts on living in different cities for career opportunities?"
        ]
    }
}


async def seed_demo_data():
    """Main function to seed all demo data"""
    print("🌱 Starting SoulSathiya Demo Data Seed...")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Clear existing demo data (optional - comment out to preserve)
    print("🗑️  Clearing existing demo data...")
    await db.users.delete_many({"user_id": {"$regex": "^demo_user_"}})
    await db.profiles.delete_many({"user_id": {"$regex": "^demo_user_"}})
    await db.photos.delete_many({"user_id": {"$regex": "^demo_user_"}})
    await db.psychometric_profiles.delete_many({"user_id": {"$regex": "^demo_user_"}})
    await db.matches.delete_many({"$or": [
        {"user_a_id": {"$regex": "^demo_user_"}},
        {"user_b_id": {"$regex": "^demo_user_"}}
    ]})
    await db.messages.delete_many({"$or": [
        {"sender_id": {"$regex": "^demo_user_"}},
        {"receiver_id": {"$regex": "^demo_user_"}}
    ]})
    await db.conversations.delete_many({"participants": {"$regex": "^demo_user_"}})
    await db.deep_exploration_pairs.delete_many({"pair_id": {"$regex": "^deep_pair_"}})
    await db.deep_psychometric_profiles.delete_many({"user_id": {"$regex": "^demo_user_"}})
    await db.deep_compatibility_reports.delete_many({"pair_id": {"$regex": "^deep_pair_"}})
    await db.interests.delete_many({"$or": [
        {"from_user_id": {"$regex": "^demo_user_"}},
        {"to_user_id": {"$regex": "^demo_user_"}}
    ]})
    await db.notifications.delete_many({"user_id": {"$regex": "^demo_user_"}})
    
    # 1. Create Users
    print("👤 Creating demo users...")
    for user_data in DEMO_USERS:
        dob = datetime.now(timezone.utc) - timedelta(days=user_data["age"]*365)
        user_doc = {
            "user_id": user_data["user_id"],
            "email": user_data["email"],
            "password_hash": pwd_context.hash(user_data["password"]),
            "full_name": user_data["full_name"],
            "picture": user_data["picture"],
            "subscription_tier": user_data["subscription_tier"],
            "subscription_status": user_data["subscription_status"],
            "subscription_expires_at": datetime.now(timezone.utc) + timedelta(days=30) if user_data["subscription_tier"] else None,
            "is_verified": user_data["is_verified"],
            "is_profile_complete": True,
            "is_psychometric_complete": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(30, 90)),
            "last_login": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))
        }
        await db.users.insert_one(user_doc)
        print(f"   ✓ Created user: {user_data['full_name']} ({user_data['subscription_tier'] or 'free'})")
    
    # 2. Create Profiles
    print("📝 Creating user profiles...")
    for user_data in DEMO_USERS:
        dob = datetime.now(timezone.utc) - timedelta(days=user_data["age"]*365)
        profile_doc = {
            "profile_id": f"profile_{user_data['user_id']}",
            "user_id": user_data["user_id"],
            "date_of_birth": dob,
            "gender": user_data["gender"],
            "city": user_data["city"],
            "state": "Maharashtra" if user_data["city"] in ["Mumbai", "Pune"] else "Karnataka" if user_data["city"] == "Bangalore" else "Delhi" if user_data["city"] == "Delhi" else "Telangana",
            "occupation": user_data["occupation"],
            "education": user_data["education"],
            "bio": user_data["bio"],
            "height_cm": random.randint(155, 185) if user_data["gender"] == "male" else random.randint(150, 170),
            "religion": random.choice(["Hindu", "Jain", "Sikh"]),
            "mother_tongue": random.choice(["Hindi", "Marathi", "Telugu", "Kannada", "Gujarati"]),
            "marital_status": "never_married",
            "diet": random.choice(["vegetarian", "non_vegetarian", "eggetarian"]),
            "smoking": "never",
            "drinking": random.choice(["never", "occasionally"]),
            "interests": random.sample(["travel", "music", "reading", "cooking", "fitness", "photography", "movies", "art"], 4),
            "looking_for": "female" if user_data["gender"] == "male" else "male",
            "age_preference_min": user_data["age"] - 5,
            "age_preference_max": user_data["age"] + 5,
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(25, 85)),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 10))
        }
        await db.profiles.insert_one(profile_doc)
    
    # 3. Create Photos
    print("📷 Creating user photos...")
    for user_id, photos in USER_PHOTOS.items():
        for i, photo_url in enumerate(photos):
            photo_doc = {
                "photo_id": f"photo_{user_id}_{i}",
                "user_id": user_id,
                "s3_url": photo_url,
                "is_primary": i == 0,
                "is_hidden": False,
                "order": i,
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(20, 80))
            }
            await db.photos.insert_one(photo_doc)
    
    # 4. Create Psychometric Profiles
    print("🧠 Creating psychometric profiles...")
    for user_data in DEMO_USERS:
        user_id = user_data["user_id"]
        scores = PSYCHOMETRIC_SCORES[user_id]
        
        # Generate mock responses (36 questions)
        raw_responses = [
            {"question_id": f"q_{i}", "answer": random.randint(1, 5)}
            for i in range(1, 37)
        ]
        
        psych_doc = {
            "psychometric_id": f"psych_{user_id}",
            "user_id": user_id,
            "raw_responses": raw_responses,
            "domain_scores": scores,
            "overall_score": sum(scores.values()) // len(scores),
            "archetype_primary": user_data["archetype"],
            "archetype_secondary": random.choice([a for a in ["nurturing_anchor", "passionate_catalyst", "intellectual_companion", "adventurous_spirit", "harmonizer", "independent_partner", "devoted_traditionalist"] if a != user_data["archetype"]]),
            "completed_at": datetime.now(timezone.utc) - timedelta(days=random.randint(15, 70)),
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(20, 75))
        }
        await db.psychometric_profiles.insert_one(psych_doc)
    
    # 5. Create Matches
    print("💕 Creating matches...")
    for user_a, user_b, score in MATCHES:
        match_doc = {
            "match_id": f"match_{user_a}_{user_b}",
            "user_a_id": user_a,
            "user_b_id": user_b,
            "compatibility_score": score,
            "psychometric_score": score + random.randint(-5, 5),
            "status": "computed",
            "is_mutual_interest": random.choice([True, False]),
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(10, 60))
        }
        await db.matches.insert_one(match_doc)
        
        # Create interests for some matches
        if random.random() > 0.3:
            interest_doc = {
                "interest_id": f"interest_{user_a}_{user_b}",
                "from_user_id": user_a,
                "to_user_id": user_b,
                "status": "accepted" if random.random() > 0.4 else "pending",
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(5, 40))
            }
            await db.interests.insert_one(interest_doc)
    
    # 6. Create Conversations and Messages
    print("💬 Creating conversations and messages...")
    for conv_data in CONVERSATIONS:
        user_a, user_b = conv_data["participants"]
        
        # Create conversation
        conv_doc = {
            "conversation_id": f"conv_{user_a}_{user_b}",
            "participants": [user_a, user_b],
            "last_message_at": datetime.now(timezone.utc) - timedelta(hours=conv_data["messages"][-1]["hours_ago"]),
            "created_at": datetime.now(timezone.utc) - timedelta(hours=conv_data["messages"][0]["hours_ago"])
        }
        await db.conversations.insert_one(conv_doc)
        
        # Create messages
        for i, msg in enumerate(conv_data["messages"]):
            receiver = user_b if msg["sender"] == user_a else user_a
            msg_doc = {
                "message_id": f"msg_{user_a}_{user_b}_{i}",
                "conversation_id": f"conv_{user_a}_{user_b}",
                "sender_id": msg["sender"],
                "receiver_id": receiver,
                "content": msg["text"],
                "is_read": True,
                "created_at": datetime.now(timezone.utc) - timedelta(hours=msg["hours_ago"])
            }
            await db.messages.insert_one(msg_doc)
    
    # 7. Create Deep Exploration Pairs
    print("🔮 Creating deep exploration pairs...")
    for pair_data in DEEP_PAIRS:
        pair_doc = {
            "pair_id": pair_data["pair_id"],
            "user_a_id": pair_data["user_a_id"],
            "user_b_id": pair_data["user_b_id"],
            "tier_at_unlock": pair_data["tier_at_unlock"],
            "payment_status": pair_data["payment_status"],
            "payment_id": f"pay_{pair_data['pair_id']}" if pair_data["payment_status"] == "paid" else None,
            "status": pair_data["status"],
            "started_users": [pair_data["user_a_id"], pair_data["user_b_id"]],
            "completed_users": [pair_data["user_a_id"], pair_data["user_b_id"]],
            "unlocked_at": datetime.now(timezone.utc) - timedelta(days=random.randint(5, 15)),
            "completed_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 4))
        }
        await db.deep_exploration_pairs.insert_one(pair_doc)
        print(f"   ✓ Created deep pair: {pair_data['pair_id']} ({pair_data['payment_status']})")
    
    # 8. Create Deep Psychometric Profiles
    print("📊 Creating deep psychometric profiles...")
    for pair_data in DEEP_PAIRS:
        for user_id in [pair_data["user_a_id"], pair_data["user_b_id"]]:
            # Generate 108 mock deep responses
            deep_responses = [
                {"question_id": f"deep_q_{i}", "answer": random.randint(1, 5)}
                for i in range(1, 109)
            ]
            
            deep_psych_doc = {
                "deep_profile_id": f"deep_psych_{pair_data['pair_id']}_{user_id}",
                "user_id": user_id,
                "pair_id": pair_data["pair_id"],
                "raw_responses": deep_responses,
                "dimension_scores": {
                    "expectations_roles": random.randint(70, 95),
                    "conflict_repair": random.randint(70, 95),
                    "attachment_trust": random.randint(75, 98),
                    "lifestyle_integration": random.randint(65, 90),
                    "intimacy_communication": random.randint(75, 95),
                    "family_inlaw_dynamics": random.randint(70, 92)
                },
                "completed_at": datetime.now(timezone.utc) - timedelta(days=random.randint(2, 5))
            }
            await db.deep_psychometric_profiles.insert_one(deep_psych_doc)
    
    # 9. Create Deep Compatibility Reports
    print("📋 Creating deep compatibility reports...")
    for pair_id, report_data in DEEP_REPORTS.items():
        report_doc = {
            "report_id": f"report_{pair_id}",
            "pair_id": pair_id,
            "deep_score": report_data["deep_score"],
            "long_term_outlook": report_data["long_term_outlook"],
            "strengths": report_data["strengths"],
            "growth_areas": report_data["growth_areas"],
            "dimension_scores": report_data["dimension_scores"],
            "conversation_prompts": report_data["conversation_prompts"],
            "generated_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 3))
        }
        await db.deep_compatibility_reports.insert_one(report_doc)
        print(f"   ✓ Created report for {pair_id} (score: {report_data['deep_score']}%)")
    
    # 10. Create Notifications
    print("🔔 Creating sample notifications...")
    notification_samples = [
        {"user_id": "demo_user_001", "type": "deep_report_ready", "message": "Your Deep Compatibility Report with Arjun is ready!", "pair_id": "deep_pair_001"},
        {"user_id": "demo_user_002", "type": "deep_report_ready", "message": "Your Deep Compatibility Report with Priya is ready!", "pair_id": "deep_pair_001"},
        {"user_id": "demo_user_003", "type": "deep_partner_completed", "message": "Vikram completed the deep compatibility assessment", "pair_id": "deep_pair_002"},
        {"user_id": "demo_user_004", "type": "deep_report_ready", "message": "Your Deep Compatibility Report with Ananya is ready!", "pair_id": "deep_pair_002"},
        {"user_id": "demo_user_005", "type": "interest_received", "message": "Rahul is interested in connecting with you!", "pair_id": None},
    ]
    
    for notif in notification_samples:
        notif_doc = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": notif["user_id"],
            "type": notif["type"],
            "message": notif["message"],
            "pair_id": notif["pair_id"],
            "is_read": random.choice([True, False]),
            "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))
        }
        await db.notifications.insert_one(notif_doc)
    
    # 11. Create Boosts for demo
    print("⚡ Creating sample boosts...")
    boost_doc = {
        "boost_id": "boost_demo_001",
        "user_id": "demo_user_002",
        "boost_type": "standard",
        "duration_hours": 24,
        "price_paid": 299,
        "status": "active",
        "started_at": datetime.now(timezone.utc) - timedelta(hours=6),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=18),
        "created_at": datetime.now(timezone.utc) - timedelta(hours=6)
    }
    await db.boosts.insert_one(boost_doc)
    
    print("\n✅ Demo data seeding complete!")
    print("\n📊 Summary:")
    print(f"   • Users: {len(DEMO_USERS)}")
    print(f"   • Profiles: {len(DEMO_USERS)}")
    print(f"   • Photos: {sum(len(p) for p in USER_PHOTOS.values())}")
    print(f"   • Matches: {len(MATCHES)}")
    print(f"   • Conversations: {len(CONVERSATIONS)}")
    print(f"   • Deep Pairs: {len(DEEP_PAIRS)}")
    print(f"   • Deep Reports: {len(DEEP_REPORTS)}")
    
    print("\n🔑 Demo Credentials:")
    print("   ┌─────────────────────────────────────────────────────────────┐")
    print("   │ Email                              │ Password │ Tier       │")
    print("   ├─────────────────────────────────────────────────────────────┤")
    for user in DEMO_USERS:
        tier = user["subscription_tier"] or "free"
        print(f"   │ {user['email']:<35} │ demo123  │ {tier:<10} │")
    print("   └─────────────────────────────────────────────────────────────┘")
    
    print("\n💕 Deep Exploration Pairs:")
    print("   • Priya & Arjun (Elite) - Score: 91% - FREE unlock")
    print("   • Ananya & Vikram (Premium) - Score: 84% - PAID ₹999")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
