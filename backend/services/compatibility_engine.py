"""SoulSathiya Compatibility Engine - Core Service"""

from typing import Dict, List, Tuple, Optional
from datetime import datetime, timezone
import uuid
import math


class CompatibilityEngine:
    """
    SoulSathiya Compatibility Engine implementing psychometric matching.
    
    Weights (adjusted for Indian matrimonial context):
    - values: 0.23 (highest - family, religion, cultural alignment)
    - expectations: 0.22 (children, finances, roles)
    - emotional: 0.17 (communication style, conflict resolution)
    - lifestyle: 0.15 (daily habits, location, joint family)
    - personality: 0.10 (complementary traits)
    - trust: 0.08 (attachment style, jealousy)
    - growth: 0.05 (openness to change)
    """
    
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
        """Normalize response to 0-100 scale"""
        if reverse_scored:
            response = (max_val + 1) - response
        
        normalized = ((response - 1) / (max_val - 1)) * 100
        return round(normalized, 2)
    
    async def calculate_domain_scores(self, responses: List[Dict], questions: List[Dict]) -> Dict[str, float]:
        """Calculate domain scores from raw responses"""
        domain_totals = {}
        domain_counts = {}
        domain_weights = {}
        
        # Create question lookup
        question_map = {q["question_id"]: q for q in questions}
        
        for resp in responses:
            q_id = resp["question_id"]
            if q_id not in question_map:
                continue
            
            question = question_map[q_id]
            domain = question["domain"]
            weight = question.get("weight", 1.0)
            reverse = question.get("reverse_scored", False)
            
            # Normalize response
            max_val = 5 if question["question_type"] == "likert_5" else 7
            normalized = self.normalize_response(resp["response"], reverse, max_val)
            
            # Accumulate weighted scores
            if domain not in domain_totals:
                domain_totals[domain] = 0
                domain_counts[domain] = 0
                domain_weights[domain] = 0
            
            domain_totals[domain] += normalized * weight
            domain_weights[domain] += weight
            domain_counts[domain] += 1
        
        # Calculate averages
        domain_scores = {}
        for domain in domain_totals:
            if domain_weights[domain] > 0:
                domain_scores[domain] = round(domain_totals[domain] / domain_weights[domain], 2)
            else:
                domain_scores[domain] = 0.0
        
        return domain_scores
    
    def detect_archetype(self, domain_scores: Dict[str, float]) -> Tuple[str, Optional[str]]:
        """Detect user archetype from domain scores"""
        scores = domain_scores
        
        # Simple archetype detection logic
        if scores.get("values", 0) > 75 and scores.get("marriage_expectations", 0) > 75:
            if scores.get("lifestyle", 0) > 70:
                return "traditionalist", "guardian"
            else:
                return "guardian", "traditionalist"
        
        elif scores.get("personality", 0) > 75 and scores.get("growth_mindset", 0) > 70:
            if scores.get("emotional_style", 0) > 70:
                return "explorer", "achiever"
            else:
                return "achiever", "explorer"
        
        elif scores.get("emotional_style", 0) > 75 and scores.get("trust_attachment", 0) > 70:
            return "nurturer", "harmonizer"
        
        elif scores.get("values", 0) > 70 and scores.get("personality", 0) < 50:
            return "harmonizer", "nurturer"
        
        elif scores.get("marriage_expectations", 0) < 40 and scores.get("growth_mindset", 0) > 70:
            return "modernist", "explorer"
        
        else:
            return "harmonizer", None
    
    def calculate_domain_compatibility(self, score_a: float, score_b: float) -> float:
        """Calculate compatibility for a single domain (0-100)"""
        # Similarity-based compatibility
        diff = abs(score_a - score_b)
        compatibility = max(0, 100 - diff)
        return round(compatibility, 2)
    
    async def calculate_compatibility(self, user_a_id: str, user_b_id: str) -> Dict:
        """
        Calculate full compatibility between two users.
        
        Returns:
            Dict with compatibility_percentage, domain_breakdown, and insights
        """
        # Get psychometric profiles
        profile_a = await self.db.psychometric_profiles.find_one(
            {"user_id": user_a_id},
            {"_id": 0}
        )
        profile_b = await self.db.psychometric_profiles.find_one(
            {"user_id": user_b_id},
            {"_id": 0}
        )
        
        if not profile_a or not profile_b:
            return {
                "compatibility_percentage": 0,
                "domain_breakdown": {},
                "error": "Psychometric profiles not found"
            }
        
        scores_a = profile_a["domain_scores"]
        scores_b = profile_b["domain_scores"]
        
        # Calculate domain compatibilities
        domain_breakdown = {}
        weighted_sum = 0.0
        
        for domain, weight in self.DOMAIN_WEIGHTS.items():
            score_a = scores_a.get(domain, 50)
            score_b = scores_b.get(domain, 50)
            
            domain_comp = self.calculate_domain_compatibility(score_a, score_b)
            domain_breakdown[domain] = domain_comp
            weighted_sum += domain_comp * weight
        
        # Base compatibility
        base_compatibility = round(weighted_sum, 2)
        
        # Apply bonuses and penalties
        final_compatibility = base_compatibility
        
        # Bonus: High values alignment (critical in Indian context)
        if domain_breakdown.get("values", 0) > 80:
            final_compatibility += 3
        
        # Bonus: High expectations alignment
        if domain_breakdown.get("marriage_expectations", 0) > 80:
            final_compatibility += 2
        
        # Penalty: Very low emotional compatibility
        if domain_breakdown.get("emotional_style", 0) < 40:
            final_compatibility -= 5
        
        # Penalty: Lifestyle mismatch
        if domain_breakdown.get("lifestyle", 0) < 35:
            final_compatibility -= 4
        
        # Ensure within bounds
        final_compatibility = max(0, min(100, final_compatibility))
        final_compatibility = round(final_compatibility, 1)
        
        return {
            "compatibility_percentage": final_compatibility,
            "domain_breakdown": domain_breakdown,
            "user_a_scores": scores_a,
            "user_b_scores": scores_b
        }
    
    def generate_match_insights(self, compatibility_data: Dict, user_a_archetype: str, user_b_archetype: str) -> Dict:
        """Generate human-readable insights for a match"""
        compat_pct = compatibility_data["compatibility_percentage"]
        breakdown = compatibility_data["domain_breakdown"]
        
        # Generate headline
        if compat_pct >= 85:
            headline = "Exceptional compatibility - deeply aligned values and goals"
        elif compat_pct >= 75:
            headline = "Strong compatibility - great foundation for lifelong partnership"
        elif compat_pct >= 65:
            headline = "Good compatibility - complementary strengths with some differences"
        elif compat_pct >= 50:
            headline = "Moderate compatibility - requires open communication and compromise"
        else:
            headline = "Lower compatibility - significant differences to navigate"
        
        # Identify strengths
        strengths = []
        for domain, score in breakdown.items():
            if score >= 80:
                domain_name = domain.replace("_", " ").title()
                strengths.append(f"Highly aligned on {domain_name} ({score}%)")
        
        if not strengths:
            for domain, score in sorted(breakdown.items(), key=lambda x: x[1], reverse=True)[:2]:
                domain_name = domain.replace("_", " ").title()
                strengths.append(f"{domain_name} compatibility ({score}%)")\n        \n        # Identify differences\n        differences = []\n        for domain, score in breakdown.items():\n            if score < 60:\n                domain_name = domain.replace(\"_\", \" \").title()\n                differences.append(f\"{domain_name} shows some divergence ({score}%)\")\n        \n        if not differences:\n            differences = [\"Minor differences that can enhance mutual growth\"]\n        \n        # Identify risks\n        risks = []\n        for domain, score in breakdown.items():\n            if score < 40:\n                domain_name = domain.replace(\"_\", \" \").title()\n                risks.append(f\"Significant gap in {domain_name} may need attention\")\n        \n        if not risks:\n            risks = [\"No major red flags identified\"]\n        \n        # Communication tip\n        if breakdown.get(\"emotional_style\", 0) < 60:\n            tip = \"Focus on understanding each other's emotional expression styles. Schedule regular check-ins to discuss feelings openly.\"\n        elif breakdown.get(\"values\", 0) < 60:\n            tip = \"Have deep conversations about family values, religious practices, and cultural traditions to find common ground.\"\n        elif breakdown.get(\"marriage_expectations\", 0) < 60:\n            tip = \"Discuss expectations about children, finances, and roles openly before making commitments.\"\n        else:\n            tip = \"Maintain open communication and celebrate your natural compatibility while respecting differences.\"\n        \n        return {\n            \"headline\": headline,\n            \"strengths\": strengths[:3],\n            \"differences\": differences[:2],\n            \"risks\": risks[:2],\n            \"communication_tip\": tip\n        }\n    \n    async def create_psychometric_profile(self, user_id: str, responses: List[Dict]) -> str:\n        \"\"\"Create and store psychometric profile\"\"\"\n        from data.psychometric_questions import PSYCHOMETRIC_QUESTIONS_36\n        \n        # Calculate domain scores\n        domain_scores = await self.calculate_domain_scores(responses, PSYCHOMETRIC_QUESTIONS_36)\n        \n        # Detect archetype\n        archetype_primary, archetype_secondary = self.detect_archetype(domain_scores)\n        \n        # Create profile\n        profile_id = f\"psych_{uuid.uuid4().hex[:12]}\"\n        profile_doc = {\n            \"profile_id\": profile_id,\n            \"user_id\": user_id,\n            \"raw_responses\": responses,\n            \"domain_scores\": domain_scores,\n            \"archetype_primary\": archetype_primary,\n            \"archetype_secondary\": archetype_secondary,\n            \"lie_score\": 0.0,\n            \"completed_at\": datetime.now(timezone.utc),\n            \"created_at\": datetime.now(timezone.utc)\n        }\n        \n        # Check if profile exists\n        existing = await self.db.psychometric_profiles.find_one({\"user_id\": user_id})\n        \n        if existing:\n            # Update existing\n            await self.db.psychometric_profiles.update_one(\n                {\"user_id\": user_id},\n                {\"$set\": profile_doc}\n            )\n        else:\n            # Insert new\n            await self.db.psychometric_profiles.insert_one(profile_doc)\n        \n        return profile_id\n    \n    async def get_ranked_matches(self, user_id: str, limit: int = 50) -> List[Dict]:\n        \"\"\"Get matches ranked by comprehensive compatibility\"\"\"\n        # Get user's psychometric profile\n        user_profile = await self.db.psychometric_profiles.find_one(\n            {\"user_id\": user_id},\n            {\"_id\": 0}\n        )\n        \n        if not user_profile:\n            return []\n        \n        # Get basic matches\n        matches = await self.db.matches.find(\n            {\"user_id\": user_id, \"status\": \"computed\"},\n            {\"_id\": 0}\n        ).to_list(100)\n        \n        # Calculate psychometric compatibility for each match\n        enriched_matches = []\n        \n        for match in matches:\n            compat_data = await self.calculate_compatibility(user_id, match[\"matched_user_id\"])\n            \n            # Calculate综合rank\n            psychometric_score = compat_data[\"compatibility_percentage\"]\n            \n            rank_score = (\n                psychometric_score * 0.55 +\n                match.get(\"compatibility_score\", 50) * 0.20 +\n                match.get(\"profile_score\", 50) * 0.10 +\n                (100 - min(match.get(\"distance_km\", 0), 100)) * 0.08 +\n                50 * 0.05 +  # recency placeholder\n                (10 if match.get(\"is_boosted\") else 0) * 0.02\n            )\n            \n            match[\"psychometric_score\"] = round(psychometric_score, 1)\n            match[\"rank_score\"] = round(rank_score, 2)\n            match[\"compatibility_data\"] = compat_data\n            enriched_matches.append(match)\n        \n        # Sort by rank score\n        enriched_matches.sort(key=lambda x: x[\"rank_score\"], reverse=True)\n        \n        return enriched_matches[:limit]
