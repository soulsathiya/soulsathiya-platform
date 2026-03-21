"""SoulSathiya Compatibility Engine

Scoring philosophy
──────────────────
Domain compatibility uses a tight exponential-decay curve (÷35, ^1.5)
instead of the naive linear `100 - diff`.  This spreads real-world
scores across the full 30-90 range so that an 85 %+ match genuinely
feels rare and special, while a 60 % match looks credible and worth
exploring.

Deal-breaker domains (values, marriage_expectations) carry an additional
hard penalty when the gap exceeds 35 points, ensuring that fundamental
misalignment cannot be hidden behind average-of-everything math.
"""

from typing import Dict, List, Tuple, Optional
from datetime import datetime, timezone
import math
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

    # Domains where a large gap triggers a hard penalty on the overall score
    DEALBREAKER_DOMAINS = {
        "values":                 {"threshold": 35, "penalty": 15},
        "marriage_expectations":  {"threshold": 35, "penalty": 12},
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
        """Tight exponential-decay curve: even small gaps create meaningful spread.

        Formula:  100 × max(0, 1 − (diff / 35)^1.5)

        Examples:  diff=0 → 100,  diff=5 → 95,   diff=10 → 85,
                   diff=15 → 72,  diff=20 → 57,   diff=25 → 40,
                   diff=30 → 21,  diff=35 → 0
        """
        diff = abs(score_a - score_b)
        ratio = min(diff / 35.0, 1.0)              # cap at 1.0
        compatibility = 100.0 * max(0.0, 1.0 - math.pow(ratio, 1.5))
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
        dealbreaker_penalty = 0.0

        for domain, weight in self.DOMAIN_WEIGHTS.items():
            score_a = scores_a.get(domain, 50)
            score_b = scores_b.get(domain, 50)

            domain_comp = self.calculate_domain_compatibility(score_a, score_b)
            domain_breakdown[domain] = domain_comp
            weighted_sum += domain_comp * weight

            # Check for dealbreaker-level misalignment
            if domain in self.DEALBREAKER_DOMAINS:
                db_cfg = self.DEALBREAKER_DOMAINS[domain]
                if abs(score_a - score_b) > db_cfg["threshold"]:
                    dealbreaker_penalty += db_cfg["penalty"]

        final_compatibility = weighted_sum - dealbreaker_penalty
        final_compatibility = max(0, min(100, round(final_compatibility, 1)))

        return {
            "compatibility_percentage": final_compatibility,
            "domain_breakdown": domain_breakdown,
            "dealbreaker_flags": [
                d for d in self.DEALBREAKER_DOMAINS
                if abs(scores_a.get(d, 50) - scores_b.get(d, 50)) > self.DEALBREAKER_DOMAINS[d]["threshold"]
            ],
            "user_a_scores": scores_a,
            "user_b_scores": scores_b
        }
    
    def generate_match_insights(self, compatibility_data: Dict, user_a_archetype: str, user_b_archetype: str) -> Dict:
        compat_pct = compatibility_data["compatibility_percentage"]
        breakdown = compatibility_data["domain_breakdown"]
        dealbreakers = compatibility_data.get("dealbreaker_flags", [])

        if compat_pct >= 85:
            headline = "Exceptional compatibility — deeply aligned values and goals"
        elif compat_pct >= 70:
            headline = "Strong compatibility — great foundation for partnership"
        elif compat_pct >= 55:
            headline = "Good compatibility — complementary strengths worth exploring"
        elif compat_pct >= 40:
            headline = "Moderate compatibility — interesting differences to navigate"
        else:
            headline = "Some compatibility — open, honest communication is key"

        strengths = []
        for domain, score in breakdown.items():
            if score >= 70:
                domain_name = domain.replace("_", " ").title()
                strengths.append(f"Aligned on {domain_name}")

        if not strengths:
            strengths = ["Natural compatibility in core areas"]

        differences = []
        for domain, score in breakdown.items():
            if score < 50:
                domain_name = domain.replace("_", " ").title()
                differences.append(f"{domain_name} needs open conversation")

        if not differences:
            differences = ["Minor differences — room for growth together"]

        risks = []
        if dealbreakers:
            for d in dealbreakers:
                domain_name = d.replace("_", " ").title()
                risks.append(f"Significant gap in {domain_name} — discuss early")
        if not risks:
            risks = ["No major red flags detected"]

        tip = "Focus conversations on your shared strengths while being curious about your differences"

        return {
            "headline": headline,
            "strengths": strengths[:3],
            "differences": differences[:2],
            "risks": risks[:2],
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
    
    # ── Tier-based visibility boost (higher tier = more visibility) ──────
    TIER_VISIBILITY_BONUS = {
        "free": 0,
        "premium": 6,     # mild boost — always slightly more visible
        "elite": 12,       # strong boost — top-tier visibility
    }

    async def get_ranked_matches(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Three-layer matching engine:
        Layer 1 — Hard Filters:  gender, age range, marital status, religion
        Layer 2 — Soft Prefs:    location, education, diet/lifestyle (affect ranking, don't eliminate)
        Layer 3 — Intelligence:  psychometric score, tier boost, purchased boost, distance, recency
        """
        user_profile = await self.db.psychometric_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        if not user_profile:
            return []

        # ── Fetch current user's profile and preferences ─────────────────────
        my_profile = await self.db.profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        my_gender = (my_profile or {}).get("gender")

        my_prefs = await self.db.partner_preferences.find_one(
            {"user_id": user_id}, {"_id": 0}
        ) or {}

        seek_gender = my_prefs.get("preferred_gender")
        if not seek_gender:
            if my_gender == "male":
                seek_gender = "female"
            elif my_gender == "female":
                seek_gender = "male"

        # ── Step 1: fetch all candidates who finished psychometric ────────────
        other_profiles = await self.db.psychometric_profiles.find(
            {"user_id": {"$ne": user_id}}, {"_id": 0, "user_id": 1}
        ).to_list(500)

        if not other_profiles:
            return []

        other_user_ids = [p["user_id"] for p in other_profiles]

        # ── Step 2: bulk-fetch candidate profiles for filtering ──────────────
        candidate_profiles_cursor = await self.db.profiles.find(
            {"user_id": {"$in": other_user_ids}}, {"_id": 0}
        ).to_list(500)
        candidate_profile_map = {p["user_id"]: p for p in candidate_profiles_cursor}

        # ── Step 3: build active-user set ────────────────────────────────────
        raw_users = await self.db.users.find(
            {"is_active": {"$ne": False}},
            {"_id": 0, "user_id": 1, "subscription_tier": 1}
        ).to_list(500)
        active_user_map = {u["user_id"]: u for u in raw_users}

        # ── Step 4: pre-computed signals (distance, boost) ───────────────────
        pre_computed = await self.db.matches.find(
            {"user_id": user_id},
            {"_id": 0, "matched_user_id": 1, "match_id": 1,
             "compatibility_score": 1, "distance_km": 1, "is_boosted": 1}
        ).to_list(500)
        pre_computed_map = {m["matched_user_id"]: m for m in pre_computed}

        # ── Active boosts lookup ─────────────────────────────────────────────
        from datetime import timezone as tz
        now = datetime.now(tz.utc)
        active_boosts = await self.db.boosts.find(
            {"status": "active", "expires_at": {"$gt": now}},
            {"_id": 0, "user_id": 1}
        ).to_list(200)
        boosted_user_ids = {b["user_id"] for b in active_boosts}

        # ── Extract hard-filter preferences ──────────────────────────────────
        pref_age_min = my_prefs.get("age_min")
        pref_age_max = my_prefs.get("age_max")
        pref_marital = my_prefs.get("preferred_marital_status") or []
        pref_religion = my_prefs.get("preferred_religion") or []

        # ── Extract soft preferences ─────────────────────────────────────────
        pref_cities = [c.lower() for c in (my_prefs.get("preferred_cities") or [])]
        pref_states = [s.lower() for s in (my_prefs.get("preferred_states") or [])]
        pref_education = my_prefs.get("preferred_education") or []
        pref_diet = [d.lower() for d in (my_prefs.get("preferred_diet") or [])]
        pref_drinking = [d.lower() for d in (my_prefs.get("preferred_drinking") or [])]
        pref_smoking = [s.lower() for s in (my_prefs.get("preferred_smoking") or [])]

        # ── Score all candidates through 3 layers ────────────────────────────
        enriched_matches = []

        for other in other_profiles:
            other_user_id = other["user_id"]

            # Must be active
            if other_user_id not in active_user_map:
                continue

            cand_profile = candidate_profile_map.get(other_user_id)
            if not cand_profile:
                continue

            # ═══════════════════════════════════════════════════════════════════
            # LAYER 1: HARD FILTERS — eliminate impossible matches
            # ═══════════════════════════════════════════════════════════════════

            # 1a. Gender filter
            if seek_gender and cand_profile.get("gender") != seek_gender:
                continue

            # 1b. Age filter
            cand_dob = cand_profile.get("date_of_birth")
            cand_age = None
            if cand_dob:
                if isinstance(cand_dob, str):
                    try:
                        cand_dob = datetime.strptime(cand_dob, "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        cand_dob = None
                if cand_dob:
                    today = datetime.now().date()
                    cand_age = today.year - cand_dob.year - (
                        (today.month, today.day) < (cand_dob.month, cand_dob.day)
                    )

            if cand_age is not None:
                if pref_age_min and cand_age < pref_age_min:
                    continue
                if pref_age_max and cand_age > pref_age_max:
                    continue

            # 1c. Marital status filter (if user specified preferences)
            if pref_marital:
                cand_marital = cand_profile.get("marital_status")
                if cand_marital and cand_marital not in pref_marital:
                    continue

            # 1d. Religion filter (if user specified preferences)
            if pref_religion:
                cand_religion = cand_profile.get("religion")
                if cand_religion and cand_religion not in pref_religion:
                    continue

            # ═══════════════════════════════════════════════════════════════════
            # LAYER 2: SOFT PREFERENCES — affect ranking, don't eliminate
            # ═══════════════════════════════════════════════════════════════════
            soft_bonus = 0.0

            # 2a. Location match (city > state)
            cand_city = (cand_profile.get("city") or "").lower()
            cand_state = (cand_profile.get("state") or "").lower()
            if pref_cities and cand_city in pref_cities:
                soft_bonus += 8   # strong bonus for same city
            elif pref_states and cand_state in pref_states:
                soft_bonus += 4   # moderate bonus for same state

            # 2b. Education alignment
            if pref_education:
                cand_edu = cand_profile.get("education_level")
                if cand_edu and cand_edu in pref_education:
                    soft_bonus += 4

            # 2c. Diet alignment
            if pref_diet:
                cand_diet = (cand_profile.get("diet") or "").lower()
                if cand_diet and cand_diet in pref_diet:
                    soft_bonus += 3

            # 2d. Drinking alignment
            if pref_drinking:
                cand_drink = (cand_profile.get("drinking") or "").lower()
                if cand_drink and cand_drink in pref_drinking:
                    soft_bonus += 2

            # 2e. Smoking alignment
            if pref_smoking:
                cand_smoke = (cand_profile.get("smoking") or "").lower()
                if cand_smoke and cand_smoke in pref_smoking:
                    soft_bonus += 2

            # ═══════════════════════════════════════════════════════════════════
            # LAYER 3: INTELLIGENCE LAYER — psychometric + tier + boost
            # ═══════════════════════════════════════════════════════════════════

            compat_data = await self.calculate_compatibility(user_id, other_user_id)
            psychometric_score = compat_data["compatibility_percentage"]

            pre = pre_computed_map.get(other_user_id, {})
            distance_km = pre.get("distance_km", 0)

            # Candidate's subscription tier visibility bonus
            cand_user = active_user_map.get(other_user_id, {})
            cand_tier = cand_user.get("subscription_tier") or "free"
            tier_bonus = self.TIER_VISIBILITY_BONUS.get(cand_tier, 0)

            # Purchased boost (stacks with tier bonus)
            is_boosted = other_user_id in boosted_user_ids or pre.get("is_boosted", False)
            boost_bonus = 10 if is_boosted else 0

            # Final ranking formula:
            #   Psychometric compatibility:  55%  (your core differentiator)
            #   Soft preference alignment:   15%  (preference matching)
            #   Distance proximity:           8%  (closer = better)
            #   Tier visibility bonus:        10% (premium/elite get more visibility)
            #   Purchased boost bonus:         7% (paid boost stacks on top)
            #   Profile completeness:          5% (reward complete profiles)
            profile_completeness = min(len([
                v for k, v in cand_profile.items()
                if k not in ("user_id", "profile_id", "created_at", "updated_at")
                and v is not None and v != "" and v != []
            ]) / 15.0 * 100, 100)

            rank_score = (
                psychometric_score * 0.55 +
                min(soft_bonus, 19) * 0.15 * (100 / 19) +   # normalize soft_bonus to 0-100 scale
                (100 - min(distance_km, 100)) * 0.08 +
                tier_bonus * (100 / 12) * 0.10 +              # normalize tier to 0-100 scale
                (boost_bonus * 10) * 0.07 +                    # 0 or 100 scale
                profile_completeness * 0.05
            )

            enriched_matches.append({
                "matched_user_id": other_user_id,
                "match_id": pre.get("match_id", f"match_{uuid.uuid4().hex[:8]}"),
                "psychometric_score": round(psychometric_score, 1),
                "rank_score": round(rank_score, 2),
                "compatibility_data": compat_data,
                "distance_km": distance_km if distance_km else None,
                "is_boosted": is_boosted,
                "candidate_tier": cand_tier,
            })

        enriched_matches.sort(key=lambda x: x["rank_score"], reverse=True)
        return enriched_matches[:limit]
