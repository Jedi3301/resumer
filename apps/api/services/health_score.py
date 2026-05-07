import re
from typing import Dict, Any

ACTION_VERBS = {"built", "scaled", "reduced", "led", "shipped", "designed", "architected", "developed", "managed", "created", "engineered", "implemented", "delivered", "optimized"}

def compute_health_score(parsed_json: dict) -> dict:
    flags = []
    strengths = []
    
    sections = parsed_json.get("sections", {})
    experience = sections.get("experience", [])
    
    # 1. Formatting (0-20)
    formatting_score = 0
    if "experience" in sections and len(experience) > 0:
        formatting_score += 10
    else:
        flags.append("Missing Experience section")
        
    if "education" in sections and len(sections["education"]) > 0:
        formatting_score += 5
    else:
        flags.append("Missing Education section")
        
    if "skills" in sections and len(sections["skills"]) > 0:
        formatting_score += 5
    else:
        flags.append("Missing Skills section")
        
    if formatting_score == 20:
        strengths.append("Clear and complete section formatting")
        
    # 2. Keyword Density (0-20)
    all_bullets = []
    for exp in experience:
        all_bullets.extend(exp.get("bullets", []))
        
    action_verb_count = 0
    for bullet in all_bullets:
        words = set(bullet.lower().split())
        if words.intersection(ACTION_VERBS):
            action_verb_count += 1
            
    keyword_score = min(20, action_verb_count * 2)
    if keyword_score >= 15:
        strengths.append("Strong use of action verbs")
    elif keyword_score < 10 and all_bullets:
        flags.append("Use more strong action verbs (e.g. built, scaled, led)")

    # 3. Quantified Impact (0-20)
    quantified_count = 0
    quant_regex = r"(\d+%|\$\d+|\d+x|\d+)"
    for bullet in all_bullets:
        if re.search(quant_regex, bullet):
            quantified_count += 1
            
    impact_score = min(20, quantified_count * 3)
    if impact_score >= 15:
        strengths.append("Excellent use of quantified metrics")
    elif impact_score < 10 and all_bullets:
        flags.append("Add more numbers and metrics to your bullets")
        
    # 4. ATS Compatibility (0-20)
    ats_score = 20
    parser_flags = parsed_json.get("flags", [])
    if parser_flags:
        ats_score -= min(10, len(parser_flags) * 2)
        flags.extend(parser_flags)
    
    # 5. Readability (0-20)
    readability_score = 0
    if not all_bullets:
        readability_score = 10
    else:
        total_words = sum(len(b.split()) for b in all_bullets)
        avg_len = total_words / len(all_bullets)
        if 15 <= avg_len <= 20:
            readability_score = 20
            strengths.append("Optimal bullet point length")
        elif avg_len < 15:
            readability_score = 15
        elif avg_len <= 30:
            readability_score = 10
            flags.append("Bullet points are slightly long, aim for 15-20 words")
        else:
            readability_score = 5
            flags.append("Bullet points are too long, keep them concise")
            
    total = formatting_score + keyword_score + impact_score + ats_score + readability_score
    
    return {
        "total": total,
        "formatting": formatting_score,
        "keyword_density": keyword_score,
        "quantified_impact": impact_score,
        "ats_compatibility": ats_score,
        "readability": readability_score,
        "flags": list(set(flags)),
        "strengths": list(set(strengths))
    }
