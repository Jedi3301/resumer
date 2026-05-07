from .llm import call_llm_with_retry

def analyze_gap(resume_skills: list[str], jd_text: str, job_title: str) -> dict:
    system_prompt = """
You are a technical skills assessor. Compare a candidate's skills against a job description.
Return ONLY valid JSON. No explanation, no markdown, no code blocks.

Output schema:
{
  "matched_skills": [str],
  "missing_skills": [
    {
      "skill": str,
      "severity": "critical|important|nice-to-have",
      "reason": str,
      "estimated_hours_to_learn": int
    }
  ],
  "gap_score": float,
  "ats_keywords_missing": [str]
}
"""
    user_prompt = f"Job Title: {job_title}\n\nJob Description:\n{jd_text}\n\nCandidate Skills: {', '.join(resume_skills)}"
    return call_llm_with_retry(system_prompt, user_prompt)

def generate_battle_plan(missing_skills: list[dict]) -> dict:
    FREE_RESOURCES = {
        "python": [{"title": "Python Docs", "url": "https://docs.python.org/3/tutorial/"}, {"title": "freeCodeCamp Python", "url": "https://www.freecodecamp.org/learn/scientific-computing-with-python/"}],
        "react": [{"title": "React Docs", "url": "https://react.dev/learn"}, {"title": "freeCodeCamp React", "url": "https://www.freecodecamp.org/learn/front-end-development-libraries/"}],
        "system design": [{"title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"title": "Gaurav Sensei", "url": "https://www.youtube.com/c/GauravSensei"}],
        "sql": [{"title": "SQLZoo", "url": "https://sqlzoo.net/"}, {"title": "Mode SQL", "url": "https://mode.com/sql-tutorial/"}],
        "docker": [{"title": "Docker Docs", "url": "https://docs.docker.com/get-started/"}, {"title": "Docker Tutorial", "url": "https://www.youtube.com/watch?v=fqMOX6JJhGo"}],
        "kubernetes": [{"title": "K8s Docs", "url": "https://kubernetes.io/docs/tutorials/"}, {"title": "Kube Academy", "url": "https://kube.academy/"}],
        "machine learning": [{"title": "Coursera ML", "url": "https://www.coursera.org/learn/machine-learning"}, {"title": "Fast.ai", "url": "https://fast.ai"}]
    }

    PAID_COURSES = {
        "system design": { "platform": "Educative", "title": "Grokking the System Design Interview", "price_usd": 79, "url": "https://www.educative.io/courses/grokking-the-system-design-interview" },
        "python": { "platform": "Udemy", "title": "100 Days of Code: Python Bootcamp", "price_usd": 15, "url": "https://www.udemy.com/course/100-days-of-code/" },
    }

    study_plan = []
    total_hours = 0
    current_week = 1
    
    severity_order = {"critical": 0, "important": 1, "nice-to-have": 2}
    sorted_skills = sorted(missing_skills, key=lambda x: severity_order.get(x.get("severity", "nice-to-have"), 2))
    
    for skill_data in sorted_skills:
        if skill_data.get("severity") in ["critical", "important"]:
            skill = skill_data.get("skill", "").lower()
            hours = skill_data.get("estimated_hours_to_learn", 10)
            
            free_res = [{"title": f"Learn {skill.title()} on freeCodeCamp", "url": f"https://www.freecodecamp.org/search?q={skill}"}]
            paid_course = None
            
            for key, res in FREE_RESOURCES.items():
                if key in skill or skill in key:
                    free_res = res
                    break
            
            for key, res in PAID_COURSES.items():
                if key in skill or skill in key:
                    paid_course = res
                    break
                    
            study_plan.append({
                "skill": skill.title(),
                "severity": skill_data.get("severity"),
                "week": current_week,
                "estimated_hours": hours,
                "free_resources": free_res,
                "paid_course": paid_course
            })
            
            total_hours += hours
            if sum(item["estimated_hours"] for item in study_plan if item["week"] == current_week) > 20:
                current_week += 1

    return {
        "study_plan": study_plan,
        "total_weeks": current_week,
        "total_free_hours": total_hours
    }
