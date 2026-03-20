"""SoulSathiya Compatibility Engine"""

from typing import Dict, List, Tuple, Optional
from datetime import datetime, timezone
import uuid


class CompatibilityEngine:
    DOMAIN_WEIGHTS = {
        "values": 0.23,
        "marriage_expectations": 0.22,
        "emotional_style": 0.17,
        "lifestyle": 0.15,
        "personality": 0.10,
        "trust_attachment": 0.08,
        "growth_mindset": 0.05
    }
    
    def __init__(self, db):
        self.db = db
    
    def normalize_response(self, response: int, reverse_scored: bool = False, max_val: int = 5) -> float:
        if reverse_scored:
            response = (max_val + 1) - response
        normalized = ((response - 1) / (max_val - 1)) * 100
        return round(normalized, 2)
    
    async def calculate_domain_scores(self, responses: List[Dict], questions: List[Dict]) -> Dict[str, float]:
        domain_totals = {}
        domain_counts = {}
        domain_weights = {}
        
        question_map = {q["question_id"]: q for q in questions}
        
        for resp in responses:
            q_id = resp["question_id"]
            if q_id not in question_map:
                continue
            
            question = question_map[q_id]
            domain = question["domain"]
            weight = question.get("weight", 1.0)
            reverse = question.get("reverse_scored", False)
            
            max_val = 5
            normalized = self.normalize_response(resp["response"], reverse, max_val)
            
            if domain not in domain_totals:
                domain_totals[domain] = 0
                domain_counts[domain] = 0
                domain_weights[domain] = 0
            
            domain_totals[domain] += normalized * weight
            domain_weights[domain] += weight
            domain_counts[domain] += 1
        
        domain_scores = {}
        for domain in domain_totals:
            if domain_weights[domain] > 0:
                domain_scores[domain] = round(domain_totals[domain] / domain_weights[domain], 2)
            else:
                domain_scores[domain] = 0.0
        
        return domain_scores
    
    def detect_archetype(self, domain_scores: Dict[str, float]) -> Tuple[str, Optional[str]]:
        scores = domain_scores
        
        if scores.get("values", 0) > 75 and scores.get("marriage_expectations", 0) > 75:
            return "traditionalist", "guardian"
        elif scores.get("personality", 0) > 75:
            return "explorer", "achiever"
        elif scores.get("emotional_style", 0) > 75:
            return "nurturer", "harmonizer"
        else:
            return "harmonizer", None
    
    def calculate_domain_compatibility(self, score_a: float, score_b: float) -> float:
        diff = abs(score_a - score_b)
        compatibility = max(0, 100 - diff)
        return round(compatibility, 2)
    
    async def calculate_compatibility(self, user_a_id: str, user_b_id: str) -> Dict:
        profile_a = await self.db.psychometric_profiles.find_one({"user_id": user_a_id}, {"_id": 0})
        profile_b = await self.db.psychometric_profiles.find_one({"user_id": user_b_id}, {"_id": 0})
        
        if not profile_a or not profile_b:
            return {"compatibility_percentage": 0, "domain_breakdown": {}, "error": "Profiles not found"}
        
        scores_a = profile_a["domain_scores"]
        scores_b = profile_b["domain_scores"]
        
        domain_breakdown = {}
        weighted_sum = 0.0
        
        for domain, weight in self.DOMAIN_WEIGHTS.items():
            score_a = scores_a.get(domain, 50)
            score_b = scores_b.get(domain, 50)
            
            domain_comp = self.calculate_domain_compatibility(score_a, score_b)
            domain_breakdown[domain] = domain_comp
            weighted_sum += domain_comp * weight
        
        final_compatibility = round(weighted_sum, 2)
        
        if domain_breakdown.get("values", 0) > 80:
            final_compatibility += 3
        if domain_breakdown.get("marriage_expectations", 0) > 80:
            final_compatibility += 2
        
        final_compatibility = max(0, min(100, final_compatibility))
        
        return {
            "compatibility_percentage": round(final_compatibility, 1),
            "domain_breakdown": domain_breakdown,
            "user_a_scores": scores_a,
            "user_b_scores": scores_b
        }
    
    def generate_match_insights(self, compatibility_data: Dict, user_a_archetype: str, user_b_archetype: str) -> Dict:
        compat_pct = compatibility_data["compatibility_percentage"]
        breakdown = compatibility_data["domain_breakdown"]
        
        if compat_pct >= 85:
            headline = "Exceptional compatibility - deeply aligned values and goals"
        elif compat_pct >= 75:
            headline = "Strong compatibility - great foundation for partnership"
        elif compat_pct >= 65:
            headline = "Good compatibility - complementary strengths"
        else:
            headline = "Moderate compatibility - open communication needed"
        
        strengths = []
        for domain, score in breakdown.items():
            if score >= 80:
                domain_name = domain.replace("_", " ").title()
                strengths.append(f"Highly aligned on {domain_name}")
        
        if not strengths:
            strengths = ["Natural compatibility in core areas"]
        
        differences = []
        for domain, score in breakdown.items():
            if score < 60:
                domain_name = domain.replace("_", " ").title()
                differences.append(f"{domain_name} shows some divergence")
        
        if not differences:
            differences = ["Minor differences for growth"]
        
        tip = "Maintain open communication and celebrate your compatibility"
        
        return {
            "headline": headline,
            "strengths": strengths[:3],
            "differences": differences[:2],
            "risks": ["No major red flags"],
            "communication_tip": tip
        }
    
    async def create_psychometric_profile(self, user_id: str, responses: List[Dict]) -> str:
        from data.psychometric_questions import PSYCHOMETRIC_QUESTIONS_36
        
        domain_scores = await self.calculate_domain_scores(responses, PSYCHOMETRIC_QUESTIONS_36)
        archetype_primary, archetype_secondary = self.detect_archetype(domain_scores)
        
        profile_id = f"psych_{uuid.uuid4().hex[:12]}"
        profile_doc = {
            "profile_id": profile_id,
            "user_id": user_id,
            "raw_responses": responses,
            "domain_scores": domain_scores,
            "archetype_primary": archetype_primary,
            "archetype_secondary": archetype_secondary,
            "lie_score": 0.0,
            "completed_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        }
        
        existing = await self.db.psychometric_profiles.find_one({"user_id": user_id})
        
        if existing:
            await self.db.psychometric_profiles.update_one(
                {"user_id": user_id},
                {"$set": profile_doc}
            )
        else:
            await self.db.psychometric_profiles.insert_one(profile_doc)
        
        return profile_id
    
    async def get_ranked_matches(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Compute compatibility scores live against gender-eligible users with psychometric profiles."""
        user_profile = await self.db.psychometric_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        if not user_profile:
            return []

        # ── Step 1: determine gender filter for this user ────────────────────
        my_profile = await self.db.profiles.find_one(
            {"user_id": user_id}, {"_id": 0, "gender": 1}
        )
        my_gender = (my_profile or {}).get("gender")  # "male" / "female" / "other" / None

        my_prefs = await self.db.partner_preferences.find_one(
            {"user_id": user_id}, {"_id": 0, "preferred_gender": 1}
        )
        seek_gender = (my_prefs or {}).get("preferred_gender")

        # Default: male seeks female, female seeks male; "other" or unknown → no filter
        if not seek_gender:
            if my_gender == "male":
                seek_gender = "female"
            elif my_gender == "female":
                seek_gender = "male"
            # else seek_gender stays None → no gender restriction

        # ── Step 2: fetch all candidates who finished the psychometric ───────
        other_profiles = await self.db.psychometric_profiles.find(
            {"user_id": {"$ne": user_id}}, {"_id": 0, "user_id": 1}
        ).to_list(300)

        if not other_profiles:
            return []

        other_user_ids = [p["user_id"] for p in other_profiles]

        # ── Step 3: build gender-eligible set (bulk profile fetch) ───────────
        if seek_gender:
            gender_profiles = await self.db.profiles.find(
                {"user_id": {"$in": other_user_ids}, "gender": seek_gender},
                {"_id": 0, "user_id": 1}
            ).to_list(300)
            eligible_ids = {p["user_id"] for p in gender_profiles}

            # Mutual check: candidate must be seeking my_gender or have no preference
            if my_gender and eligible_ids:
                cand_prefs = await self.db.partner_preferences.find(
                    {"user_id": {"$in": list(eligible_ids)}},
                    {"_id": 0, "user_id": 1, "preferred_gender": 1}
                ).to_list(300)
                prefs_map = {p["user_id"]: p.get("preferred_gender") for p in cand_prefs}
                eligible_ids = {
                    uid for uid in eligible_ids
                    if not prefs_map.get(uid) or prefs_map[uid] == my_gender
                }
        else:
            eligible_ids = set(other_user_ids)

        # ── Step 4: build active-user set ────────────────────────────────────
        raw_users = await self.db.users.find(
            {"is_active": {"$ne": False}}, {"_id": 0, "user_id": 1}
        ).to_list(500)
        active_user_ids = {u["user_id"] for u in raw_users}

        # ── Step 5: supplementary pre-computed signals (distance, boost) ─────
        pre_computed = await self.db.matches.find(
            {"user_id": user_id},
            {"_id": 0, "matched_user_id": 1, "match_id": 1,
             "compatibility_score": 1, "distance_km": 1, "is_boosted": 1}
        ).to_list(300)
        pre_computed_map = {m["matched_user_id"]: m for m in pre_computed}

        # ── Step 6: score only eligible, active candidates ───────────────────
        enriched_matches = []
        for other in other_profiles:
            other_user_id = other["user_id"]

            if other_user_id not in active_user_ids:
                continue
            if other_user_id not in eligible_ids:        # ← gender gate
                continue

            compat_data = await self.calculate_compatibility(user_id, other_user_id)
            psychometric_score = compat_data["compatibility_percentage"]

            pre = pre_computed_map.get(other_user_id, {})
            rank_score = (
                psychometric_score * 0.65 +
                pre.get("compatibility_score", 50) * 0.15 +
                (100 - min(pre.get("distance_km", 0), 100)) * 0.10 +
                (10 if pre.get("is_boosted") else 0) * 0.10
            )

            enriched_matches.append({
                "matched_user_id": other_user_id,
                "match_id": pre.get("match_id", f"match_{uuid.uuid4().hex[:8]}"),
                "psychometric_score": round(psychometric_score, 1),
                "rank_score": round(rank_score, 2),
                "compatibility_data": compat_data,
                "distance_km": pre.get("distance_km"),
                "is_boosted": pre.get("is_boosted", False),
            })

        enriched_matches.sort(key=lambda x: x["rank_score"], reverse=True)
        return enriched_matches[:limit]
