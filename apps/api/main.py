from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz
import json
import redis
import os
from celery.result import AsyncResult
from celery_app import celery_app
from tasks import process_resume_pipeline
from services.gap_analyzer import analyze_gap, generate_battle_plan
from pydantic import BaseModel
import asyncio

app = FastAPI(title="Job Hunt Copilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_response(success: bool, data: any = None, error: str = None):
    return {
        "success": success,
        "data": data,
        "error": error,
        "timestamp": datetime.now(pytz.utc).isoformat()
    }

@app.get("/api/health")
async def health_check():
    return build_response(success=True, data={"status": "healthy"})

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = Form(...), goal_profile: str = Form("{}")):
    contents = await file.read()
    try:
        goals = json.loads(goal_profile)
    except:
        goals = {}
    task = process_resume_pipeline.delay(contents, file.content_type, user_id, goals)
    return build_response(success=True, data={"task_id": task.id})

@app.get("/api/resume/{task_id}")
async def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    
    if task_result.state == 'PENDING':
        response = {"status": "pending", "progress": 0}
    elif task_result.state == 'PROGRESS':
        response = {"status": "processing", "progress": task_result.info.get("progress", 0), "step": task_result.info.get("step", "")}
    elif task_result.state == 'SUCCESS':
        response = {"status": "complete", "progress": 100, "data": task_result.result}
    else:
        response = {"status": "failed", "progress": 0, "error": str(task_result.info)}
        
    return build_response(success=True, data=response)

@app.get("/api/resume/stream/{task_id}")
async def stream_task_status(task_id: str):
    async def event_generator():
        last_progress = -1
        while True:
            task_result = AsyncResult(task_id, app=celery_app)
            
            if task_result.state == 'PENDING':
                yield f"data: {json.dumps({'step': 'pending', 'progress': 0})}\n\n"
            elif task_result.state == 'PROGRESS':
                prog = task_result.info.get('progress', 0)
                step = task_result.info.get('step', '')
                if prog != last_progress:
                    yield f"data: {json.dumps({'step': step, 'progress': prog})}\n\n"
                    last_progress = prog
            elif task_result.state == 'SUCCESS':
                yield f"data: {json.dumps({'step': 'complete', 'progress': 100, 'data': task_result.result})}\n\n"
                break
            else:
                yield f"data: {json.dumps({'step': 'failed', 'progress': 0, 'error': str(task_result.info)})}\n\n"
                break
                
            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/jobs/{user_id}")
async def get_jobs(user_id: str):
    redis_url = os.getenv("UPSTASH_REDIS_URL", "redis://redis:6379/0")
    try:
        r = redis.from_url(redis_url)
        data = r.get(f"jobs:{user_id}")
        if data:
            return build_response(success=True, data={"jobs": json.loads(data)})
        return build_response(success=True, data={"jobs": []})
    except Exception as e:
        return build_response(success=False, error=str(e))

class GapRequest(BaseModel):
    resume_skills: list[str]
    jd_text: str
    job_title: str

@app.post("/api/jobs/gap/{job_id}")
async def get_job_gap(job_id: str, req: GapRequest):
    gap = analyze_gap(req.resume_skills, req.jd_text, req.job_title)
    battle_plan = generate_battle_plan(gap.get("missing_skills", []))
    
    return build_response(success=True, data={
        "gap_analysis": gap,
        "battle_plan": battle_plan
    })
