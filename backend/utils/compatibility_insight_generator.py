"""
SoulSathiya — Compatibility Insight Generator
Simple rule-based utility. Does NOT modify compatibility scores.
"""

DOMAIN_LABELS = {
    "values":                 "shared values",
    "marriage_expectations":  "family & marriage goals",
    "emotional_style":        "emotional alignment",
    "lifestyle":              "lifestyle compatibility",
    "personality":            "personality harmony",
    "trust_attachment":       "trust & attachment",
    "growth_mindset":         "personal growth outlook",
}


def generate_compatibility_insight(domain_breakdown: dict, partner_name: str = "your match") -> str:
    """Return a short 1–2 sentence narrative from domain breakdown scores."""
    if not domain_breakdown:
        return (
            f"Complete your SoulSathiya Personality Profile to see "
            f"compatibility insights with {partner_name}."
        )

    sorted_domains = sorted(domain_breakdown.items(), key=lambda x: x[1], reverse=True)
    top1_label = DOMAIN_LABELS.get(sorted_domains[0][0], sorted_domains[0][0].replace("_", " "))
    top2_label = DOMAIN_LABELS.get(sorted_domains[1][0], sorted_domains[1][0].replace("_", " ")) \
        if len(sorted_domains) > 1 else None
    low_label  = DOMAIN_LABELS.get(sorted_domains[-1][0], sorted_domains[-1][0].replace("_", " "))

    if top2_label:
        return (
            f"You and {partner_name} show strong alignment in {top1_label} "
            f"and {top2_label}. One area that may benefit from attention "
            f"is {low_label}."
        )
    return (
        f"You and {partner_name} show strong alignment in {top1_label}. "
        f"One area that may benefit from attention is {low_label}."
    )


def get_relationship_outlook(score: float) -> str:
    """Return a short outlook string based on overall compatibility score."""
    if score > 85:
        return "Very promising long-term compatibility."
    if score >= 75:
        return "Good compatibility with areas for growth."
    if score >= 65:
        return "Moderate compatibility requiring mutual effort."
    return "Meaningful differences exist — open communication will be key."


def get_strengths_and_growth(domain_breakdown: dict) -> dict:
    """Return top-2 strengths and the primary growth area."""
    if not domain_breakdown:
        return {"strengths": [], "growth_area": None}

    sorted_domains = sorted(domain_breakdown.items(), key=lambda x: x[1], reverse=True)
    strengths = [
        DOMAIN_LABELS.get(d[0], d[0].replace("_", " "))
        for d in sorted_domains[:2]
    ]
    growth_area = DOMAIN_LABELS.get(
        sorted_domains[-1][0], sorted_domains[-1][0].replace("_", " ")
    )
    return {"strengths": strengths, "growth_area": growth_area}
