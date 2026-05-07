from typing import TypedDict, Dict, Any, List
from langgraph.graph import StateGraph, END
from duckduckgo_search import DDGS
import sys
import os
import asyncio
import json
import redis
from datetime import datetime
import uuid

sys.path.append(os.path.join(os.path.dirname(__file__), '../../apps/api'))
from services.embeddings import get_embedding, compute_similarity, add_job_embedding
from services.scraper import scrape_job_page
from services.redis_url import get_redis_url

class JobScoutState(TypedDict):
    user_id: str
    suggested_roles: List[Dict[str, Any]]
    skills_data: Dict[str, Any]
    user_location: str
    urls_to_scrape: List[str]
    scraped_jobs: List[Dict[str, Any]]
    ranked_jobs: List[Dict[str, Any]]

def search_jobs(state: JobScoutState):
    ddgs = DDGS()
    all_urls = set()
    
    allowed_domains = ["linkedin.com/jobs", "indeed.com", "glassdoor.com", "wellfound.com", "naukri.com"]
    roles = state.get("suggested_roles", [])[:3]
    domain = state.get("skills_data", {}).get("domain", "tech")
    confirmed_skills = state.get("skills_data", {}).get("confirmed_skills", [])
    top_keyword = confirmed_skills[0]["skill"] if confirmed_skills else domain
    
    for role in roles:
        title = role.get("title", "")
        q1 = f"{title} {top_keyword} jobs"
        q2 = f"{title} {domain} hiring 2024"
        
        for q in [q1, q2]:
            try:
                results = ddgs.text(q, max_results=15)
                if not results: continue
                for r in results:
                    url = r.get("href", "")
                    if any(d in url for d in allowed_domains):
                        all_urls.add(url)
            except Exception as e:
                pass
                
    return {"urls_to_scrape": list(all_urls)}

async def scrape_and_filter(state: JobScoutState):
    urls = state["urls_to_scrape"][:10]
    tasks = [scrape_job_page(url) for url in urls]
    results = await asyncio.gather(*tasks)
    
    valid_jobs = []
    for r in results:
        if "error" not in r and r.get("jd_text") and len(r["jd_text"]) > 200:
            r["stale"] = False
            r["id"] = str(uuid.uuid4())
            valid_jobs.append(r)
            
    return {"scraped_jobs": valid_jobs}

def score_and_rank(state: JobScoutState):
    jobs = state["scraped_jobs"]
    skills_data = state["skills_data"]
    
    resume_text_approx = " ".join([s.get("skill", "") for s in skills_data.get("confirmed_skills", [])])
    if not resume_text_approx:
        resume_text_approx = "developer"
    resume_emb = get_embedding(resume_text_approx)
    
    user_exp_level = skills_data.get("experience_level", "mid").lower()
    user_domain = skills_data.get("domain", "tech").lower()
    user_loc = state.get("user_location", "").lower()
    
    ranked_jobs = []
    for j in jobs:
        jd_text = j["jd_text"]
        job_emb = add_job_embedding(j["id"], jd_text)
        skills_match = compute_similarity(resume_emb, job_emb)
        
        jd_lower = jd_text.lower()
        exp_match = 1.0 if user_exp_level in jd_lower else 0.5
        domain_match = 1.0 if user_domain in jd_lower else 0.5
        
        loc = j.get("location", "").lower()
        if "remote" in loc or "remote" in jd_lower:
            loc_match = 1.0
        elif user_loc and user_loc in loc:
            loc_match = 0.8
        else:
            loc_match = 0.3
            
        total_score = (skills_match * 0.4) + (exp_match * 0.3) + (domain_match * 0.2) + (loc_match * 0.1)
        j["match_score"] = float(total_score)
        ranked_jobs.append(j)
        
    ranked_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    top_20 = ranked_jobs[:20]
    
    redis_url = get_redis_url("redis://localhost:6379/0")
    try:
        r = redis.from_url(redis_url)
        r.setex(f"jobs:{state['user_id']}", 86400, json.dumps(top_20))
    except Exception:
        pass
        
    return {"ranked_jobs": top_20}

workflow = StateGraph(JobScoutState)
workflow.add_node("search_jobs", search_jobs)
workflow.add_node("scrape_and_filter", scrape_and_filter)
workflow.add_node("score_and_rank", score_and_rank)
workflow.set_entry_point("search_jobs")
workflow.add_edge("search_jobs", "scrape_and_filter")
workflow.add_edge("scrape_and_filter", "score_and_rank")
workflow.add_edge("score_and_rank", END)

job_scout_app = workflow.compile()

async def run_job_scout(user_id: str, suggested_roles: list, skills_data: dict, location: str = "") -> list:
    initial_state = {
        "user_id": user_id,
        "suggested_roles": suggested_roles,
        "skills_data": skills_data,
        "user_location": location,
        "urls_to_scrape": [],
        "scraped_jobs": [],
        "ranked_jobs": []
    }
    result = await job_scout_app.ainvoke(initial_state)
    return result["ranked_jobs"]
