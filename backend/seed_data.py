"""
Seed script to populate initial data for SoulSathiya
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def seed_communities():
    """Seed communities data"""
    communities = [
        {
            "community_id": f"comm_{uuid.uuid4().hex[:12]}",
            "name": "Software Engineers",
            "category": "profession",
            "description": "Community for software engineers and tech professionals",
            "is_active": True,
            "member_count": 0,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "community_id": f"comm_{uuid.uuid4().hex[:12]}",
            "name": "Doctors & Healthcare",
            "category": "profession",
            "description": "Medical professionals and healthcare workers",
            "is_active": True,
            "member_count": 0,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "community_id": f"comm_{uuid.uuid4().hex[:12]}",
            "name": "Business Professionals",
            "category": "profession",
            "description": "Entrepreneurs, managers, and business leaders",
            "is_active": True,
            "member_count": 0,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "community_id": f"comm_{uuid.uuid4().hex[:12]}",
            "name": "Teachers & Educators",
            "category": "profession",
            "description": "Teaching professionals and educators",
            "is_active": True,
            "member_count": 0,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "community_id": f"comm_{uuid.uuid4().hex[:12]}",
            "name": "South Indian Community",
            "category": "regional",
            "description": "People from South Indian states",
            "is_active": True,
            "member_count": 0,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "community_id": f"comm_{uuid.uuid4().hex[:12]}",
            "name": "North Indian Community",
            "category": "regional",
            "description": "People from North Indian states",
            "is_active": True,
            "member_count": 0,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "community_id": f"comm_{uuid.uuid4().hex[:12]}",
            "name": "NRI Community",
            "category": "regional",
            "description": "Non-Resident Indians seeking matches globally",
            "is_active": True,
            "member_count": 0,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    existing_count = await db.communities.count_documents({})
    if existing_count == 0:
        await db.communities.insert_many(communities)
        print(f"Seeded {len(communities)} communities")
    else:
        print(f"Communities already exist ({existing_count} found)")


async def seed_psychometric_questions():
    """Seed psychometric questions"""
    questions = [
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "How important is family in your life decisions?",
            "question_type": "scale",
            "category": "values",
            "scale_min": 1,
            "scale_max": 10,
            "weight": 2.0,
            "is_active": True,
            "display_order": 1,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "What is your ideal weekend activity?",
            "question_type": "multiple_choice",
            "category": "lifestyle",
            "options": [
                "Quiet time at home",
                "Social gatherings with friends",
                "Outdoor adventures",
                "Cultural activities (museums, theater)",
                "Sports and fitness"
            ],
            "weight": 1.5,
            "is_active": True,
            "display_order": 2,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "How would you describe your communication style?",
            "question_type": "multiple_choice",
            "category": "personality",
            "options": [
                "Direct and straightforward",
                "Diplomatic and tactful",
                "Analytical and detailed",
                "Warm and expressive",
                "Reserved and thoughtful"
            ],
            "weight": 2.0,
            "is_active": True,
            "display_order": 3,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "Do you want children in the future?",
            "question_type": "multiple_choice",
            "category": "relationship_goals",
            "options": [
                "Yes, definitely",
                "Open to it",
                "Not sure yet",
                "Prefer not to",
                "No"
            ],
            "weight": 3.0,
            "is_active": True,
            "display_order": 4,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "How important is career growth to you?",
            "question_type": "scale",
            "category": "values",
            "scale_min": 1,
            "scale_max": 10,
            "weight": 1.5,
            "is_active": True,
            "display_order": 5,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "What is your approach to conflict resolution?",
            "question_type": "multiple_choice",
            "category": "compatibility",
            "options": [
                "Address issues immediately",
                "Take time to cool down first",
                "Seek compromise",
                "Avoid confrontation",
                "Seek external mediation"
            ],
            "weight": 2.5,
            "is_active": True,
            "display_order": 6,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "How do you prefer to spend quality time with your partner?",
            "question_type": "multiple_choice",
            "category": "relationship_goals",
            "options": [
                "Deep conversations",
                "Shared activities and hobbies",
                "Physical affection",
                "Acts of service",
                "Gift giving"
            ],
            "weight": 2.0,
            "is_active": True,
            "display_order": 7,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "Are you comfortable with your partner having close friends of the opposite gender?",
            "question_type": "yes_no",
            "category": "compatibility",
            "weight": 1.5,
            "is_active": True,
            "display_order": 8,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "How important is maintaining cultural/religious traditions?",
            "question_type": "scale",
            "category": "values",
            "scale_min": 1,
            "scale_max": 10,
            "weight": 2.5,
            "is_active": True,
            "display_order": 9,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "question_id": f"q_{uuid.uuid4().hex[:12]}",
            "question_text": "What role do you expect your partner to play in household responsibilities?",
            "question_type": "multiple_choice",
            "category": "compatibility",
            "options": [
                "Equal partnership in all tasks",
                "Traditional gender roles",
                "Based on individual strengths",
                "Flexible and adaptable",
                "Hire help for most tasks"
            ],
            "weight": 2.0,
            "is_active": True,
            "display_order": 10,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    existing_count = await db.psychometric_questions.count_documents({})
    if existing_count == 0:
        await db.psychometric_questions.insert_many(questions)
        print(f"Seeded {len(questions)} psychometric questions")
    else:
        print(f"Psychometric questions already exist ({existing_count} found)")


async def main():
    """Main seeding function"""
    print("Starting database seeding...")
    await seed_communities()
    await seed_psychometric_questions()
    print("Database seeding completed!")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
