from celery_app import celery_app
from services.parser import parse_resume
from services.health_score import compute_health_score
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../packages'))
from agents.resume_agent import run_resume_agent
import asyncio

@celery_app.task(bind=True)
def process_resume_pipeline(self, file_bytes: bytes, mime_type: str, user_id: str, goal_profile: dict):
    self.update_state(state='PROGRESS', meta={'step': 'parsing', 'progress': 20})
    parsed_data = parse_resume(file_bytes, mime_type)
    
    self.update_state(state='PROGRESS', meta={'step': 'scoring', 'progress': 40})
    health_score = compute_health_score(parsed_data)
    
    self.update_state(state='PROGRESS', meta={'step': 'extracting_skills', 'progress': 60})
    agent_result = run_resume_agent(parsed_data["raw_text"])
    
    # Job scraping and recommendation are temporarily disabled.
    jobs = []
    
    self.update_state(state='PROGRESS', meta={'step': 'complete', 'progress': 100})
    
    return {
        "parsed_data": parsed_data,
        "health_score": health_score,
        "agent_result": agent_result,
        "jobs": jobs,
        "recommender_disabled": True
    }
