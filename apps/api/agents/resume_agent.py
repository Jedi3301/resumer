from typing import TypedDict, Dict, Any
from langgraph.graph import StateGraph, END
import sys
import os

# Add apps directory to path so we can import llm
sys.path.append(os.path.join(os.path.dirname(__file__), '../../apps/api'))
from services.llm import call_llm_with_retry

class ResumeAgentState(TypedDict):
    resume_text: str
    skills_data: Dict[str, Any]
    strengths_data: Dict[str, Any]
    roles_data: Dict[str, Any]

def extract_skills(state: ResumeAgentState):
    system_prompt = """
You are a technical resume analyzer. Extract structured skill data from the resume text.
Return ONLY valid JSON. No explanation, no markdown, no code blocks. Raw JSON only.

Output schema:
{
  "confirmed_skills": [
    { "skill": str, "confidence": float, "evidence": str }
  ],
  "inferred_skills": [
    { "skill": str, "reasoning": str }
  ],
  "experience_level": "junior|mid|senior|lead|principal",
  "years_of_experience": float,
  "domain": str
}

Rules:
- confidence 0.9+ = skill explicitly named AND demonstrated with project/role
- confidence 0.6-0.9 = skill named but no clear demonstration
- confidence < 0.6 = inferred from context only, put in inferred_skills
- experience_level: junior <2yrs, mid 2-5yrs, senior 5-10yrs, lead/principal 10+yrs
- domain: one of "frontend", "backend", "fullstack", "data-engineering", "ml-ai", "devops", "mobile", "product", "design", "other"
"""
    result = call_llm_with_retry(system_prompt, state["resume_text"])
    return {"skills_data": result}

def identify_strengths(state: ResumeAgentState):
    system_prompt = """
You are a career strategist. Given extracted skills and experience, identify the candidate's 3 strongest professional selling points.
Return ONLY valid JSON. No explanation, no markdown, no code blocks.

Output schema:
{
  "top_strengths": [
    {
      "title": str,
      "description": str,
      "evidence": str,
      "market_demand": "high|medium|low"
    }
  ],
  "elevator_pitch": str
}
"""
    user_prompt = f"Resume Text:\n{state['resume_text']}\n\nExtracted Skills Data:\n{state['skills_data']}"
    result = call_llm_with_retry(system_prompt, user_prompt)
    return {"strengths_data": result}

def suggest_roles(state: ResumeAgentState):
    system_prompt = """
You are a job market expert. Given the candidate's skills and strengths, suggest the 5 best-fit job roles to target.
Return ONLY valid JSON. No explanation, no markdown, no code blocks.

Output schema:
{
  "suggested_roles": [
    {
      "title": str,
      "fit_score": float,
      "fit_reason": str,
      "avg_salary_usd": int,
      "search_keywords": [str]
    }
  ]
}
"""
    user_prompt = f"Skills Data:\n{state['skills_data']}\n\nStrengths Data:\n{state['strengths_data']}"
    result = call_llm_with_retry(system_prompt, user_prompt)
    return {"roles_data": result}

# Build graph
workflow = StateGraph(ResumeAgentState)

workflow.add_node("extract_skills", extract_skills)
workflow.add_node("identify_strengths", identify_strengths)
workflow.add_node("suggest_roles", suggest_roles)

workflow.set_entry_point("extract_skills")
workflow.add_edge("extract_skills", "identify_strengths")
workflow.add_edge("identify_strengths", "suggest_roles")
workflow.add_edge("suggest_roles", END)

resume_agent_app = workflow.compile()

def run_resume_agent(resume_text: str) -> Dict[str, Any]:
    initial_state = {
        "resume_text": resume_text,
        "skills_data": {},
        "strengths_data": {},
        "roles_data": {}
    }
    result = resume_agent_app.invoke(initial_state)
    return result
