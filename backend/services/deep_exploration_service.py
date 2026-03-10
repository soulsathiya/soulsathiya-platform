"""Deep Couple Exploration Service"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)


class DeepExplorationService:
    def __init__(self, db, boost_service):
        self.db = db
        self.boost_service = boost_service
    
    async def check_tier_access(self, user_id: str) -> Tuple[str, bool, Optional[str]]:
        """
        Check user's tier and deep exploration access.
        Returns: (tier, has_access, payment_required)
        """
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user:
            return ("free", False, None)
        
        tier = user.get("subscription_tier", "free")
        
        if tier == "elite":
            return ("elite", True, None)
        elif tier == "premium":
            return ("premium", False, "999")
        else:
            return ("free", False, "upgrade")
    
    async def create_or_get_pair(self, user_a_id: str, user_b_id: str) -> Optional[Dict]:
        """Get existing pair or return None"""
        # Sort user IDs to ensure consistent pair lookup
        sorted_ids = sorted([user_a_id, user_b_id])
        
        pair = await self.db.deep_exploration_pairs.find_one(
            {
                "$or": [
                    {"user_a_id": sorted_ids[0], "user_b_id": sorted_ids[1]},
                    {"user_a_id": sorted_ids[1], "user_b_id": sorted_ids[0]}
                ]
            },
            {"_id": 0}
        )
        
        return pair
    
    async def unlock_pair(self, unlocking_user_id: str, partner_user_id: str, 
                         payment_id: Optional[str] = None) -> Dict:
        """Unlock deep exploration for a pair"""
        tier, has_access, payment_req = await self.check_tier_access(unlocking_user_id)
        
        # Check if pair already exists
        existing_pair = await self.create_or_get_pair(unlocking_user_id, partner_user_id)
        if existing_pair:
            return {"exists": True, "pair": existing_pair}
        
        # Create new pair
        pair_id = f"deep_{uuid.uuid4().hex[:12]}"
        
        payment_status = "included" if tier == "elite" else "paid" if payment_id else "pending"
        
        pair_doc = {
            "pair_id": pair_id,
            "user_a_id": unlocking_user_id,
            "user_b_id": partner_user_id,
            "unlocked_by_user": unlocking_user_id,
            "tier_at_unlock": tier,
            "payment_status": payment_status,
            "razorpay_payment_id": payment_id,
            "started_users": [],
            "completed_users": [],
            "status": "unlocked",
            "unlocked_at": datetime.now(timezone.utc),
            "completed_at": None
        }
        
        await self.db.deep_exploration_pairs.insert_one(pair_doc)
        
        return {"exists": False, "pair": pair_doc}
    
    async def get_pair_status(self, user_id: str, partner_id: str) -> Dict:
        """Get deep exploration status for a pair"""
        pair = await self.create_or_get_pair(user_id, partner_id)
        
        if not pair:
            tier, has_access, payment_req = await self.check_tier_access(user_id)
            return {
                "unlocked": False,
                "tier": tier,
                "has_access": has_access,
                "payment_required": payment_req
            }
        
        user_started = user_id in pair.get("started_users", [])
        user_completed = user_id in pair.get("completed_users", [])
        partner_completed = partner_id in pair.get("completed_users", [])
        both_completed = len(pair.get("completed_users", [])) == 2
        
        return {
            "unlocked": True,
            "pair_id": pair["pair_id"],
            "user_started": user_started,
            "user_completed": user_completed,
            "partner_completed": partner_completed,
            "both_completed": both_completed,
            "status": pair["status"]
        }
    
    async def calculate_module_scores(self, responses: List[Dict], questions: List[Dict]) -> Dict[str, float]:
        """Calculate module scores from responses"""
        module_totals = {}
        module_weights = {}
        
        question_map = {q["question_id"]: q for q in questions}
        
        for resp in responses:
            q_id = resp["question_id"]
            if q_id not in question_map:
                continue
            
            question = question_map[q_id]
            module = question["module"]
            weight = question.get("weight", 1.0)
            
            # Normalize to 0-100
            normalized = ((resp["response"] - 1) / 4) * 100
            
            if module not in module_totals:
                module_totals[module] = 0
                module_weights[module] = 0
            
            module_totals[module] += normalized * weight
            module_weights[module] += weight
        
        module_scores = {}
        for module in module_totals:
            if module_weights[module] > 0:
                module_scores[module] = round(module_totals[module] / module_weights[module], 2)
            else:
                module_scores[module] = 0.0
        
        return module_scores
    
    async def save_deep_profile(self, user_id: str, pair_id: str, responses: List[Dict]) -> str:
        """Save deep psychometric profile"""
        from data.deep_questions import DEEP_QUESTIONS_FULL
        
        module_scores = await self.calculate_module_scores(responses, DEEP_QUESTIONS_FULL)
        
        profile_id = f"deep_prof_{uuid.uuid4().hex[:12]}"
        profile_doc = {
            "profile_id": profile_id,
            "user_id": user_id,
            "pair_id": pair_id,
            "module_scores": module_scores,
            "raw_responses": responses,
            "completed_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.deep_psychometric_profiles.insert_one(profile_doc)
        
        # Update pair
        await self.db.deep_exploration_pairs.update_one(
            {"pair_id": pair_id},
            {
                "$addToSet": {
                    "started_users": user_id,
                    "completed_users": user_id
                }
            }
        )
        
        return profile_id
    
    async def generate_pair_report(self, pair_id: str) -> str:
        """Generate deep compatibility report for a pair"""
        pair = await self.db.deep_exploration_pairs.find_one({"pair_id": pair_id}, {"_id": 0})
        
        if not pair or len(pair.get("completed_users", [])) < 2:
            raise ValueError("Both users must complete questionnaire")
        
        # Get both profiles
        profiles = await self.db.deep_psychometric_profiles.find(
            {"pair_id": pair_id},
            {"_id": 0}
        ).to_list(2)
        
        if len(profiles) < 2:
            raise ValueError("Missing profiles")
        
        profile_a = profiles[0]
        profile_b = profiles[1]
        
        scores_a = profile_a["module_scores"]
        scores_b = profile_b["module_scores"]
        
        # Calculate pair dynamics
        dimension_scores = {}
        total_score = 0.0
        
        modules = list(scores_a.keys())
        for module in modules:
            score_a = scores_a.get(module, 50)
            score_b = scores_b.get(module, 50)
            diff = abs(score_a - score_b)
            compatibility = max(0, 100 - diff)
            dimension_scores[module] = round(compatibility, 2)
            total_score += compatibility
        
        deep_score = round(total_score / len(modules), 1) if modules else 0.0
        
        # Generate insights
        strengths = []
        growth_areas = []
        
        for module, score in dimension_scores.items():
            module_name = module.replace("_", " ").title()
            if score >= 80:
                strengths.append(f"Exceptional alignment in {module_name}")
            elif score < 60:
                growth_areas.append(f"{module_name} requires attention and discussion")
        
        if not strengths:
            strengths = ["Good foundational compatibility"]
        if not growth_areas:
            growth_areas = ["Minor areas for continuous growth"]
        
        # Generate outlook
        if deep_score >= 85:
            outlook = "Exceptional long-term compatibility with strong alignment across key relationship dimensions."
        elif deep_score >= 75:
            outlook = "Strong long-term potential with good alignment and manageable differences."
        elif deep_score >= 65:
            outlook = "Moderate compatibility requiring open communication and mutual effort."
        else:
            outlook = "Significant differences requiring substantial compromise and understanding."
        
        # Create report
        report_id = f"deep_rep_{uuid.uuid4().hex[:12]}"
        report_doc = {
            "report_id": report_id,
            "pair_id": pair_id,
            "user_a_id": pair["user_a_id"],
            "user_b_id": pair["user_b_id"],
            "dimension_scores": dimension_scores,
            "deep_score": deep_score,
            "strengths": strengths[:5],
            "growth_areas": growth_areas[:5],
            "risks": ["Open communication required for growth areas"],
            "conversation_prompts": [
                "Discuss your expectations around family involvement in decision-making",
                "Share your conflict resolution preferences and triggers",
                "Explore your attachment needs and boundaries"
            ],
            "long_term_outlook": outlook,
            "generated_at": datetime.now(timezone.utc)
        }
        
        await self.db.deep_compatibility_reports.insert_one(report_doc)
        
        # Update pair status
        await self.db.deep_exploration_pairs.update_one(
            {"pair_id": pair_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return report_id
    
    async def get_pair_report(self, pair_id: str, requesting_user_id: str) -> Optional[Dict]:
        """Get deep compatibility report"""
        pair = await self.db.deep_exploration_pairs.find_one({"pair_id": pair_id}, {"_id": 0})
        
        if not pair:
            return None
        
        # Check if requesting user is part of the pair
        if requesting_user_id not in [pair["user_a_id"], pair["user_b_id"]]:
            return None
        
        # Check if both completed
        if len(pair.get("completed_users", [])) < 2:
            return None
        
        report = await self.db.deep_compatibility_reports.find_one(
            {"pair_id": pair_id},
            {"_id": 0}
        )
        
        return report

    async def submit_deep_profile(self, user_id: str, pair_id: str, responses: list) -> str:
        """Alias for save_deep_profile — called by the subscriptions router."""
        return await self.save_deep_profile(user_id, pair_id, responses)

    async def generate_deep_report(self, pair_id: str) -> str:
        """Alias for generate_pair_report — called by the subscriptions router."""
        return await self.generate_pair_report(pair_id)

    async def check_both_submitted(self, pair_id: str) -> bool:
        """Check if both users in a pair have completed their deep questionnaire."""
        pair = await self.db.deep_exploration_pairs.find_one({"pair_id": pair_id}, {"_id": 0})
        if not pair:
            return False
        return len(pair.get("completed_users", [])) >= 2
