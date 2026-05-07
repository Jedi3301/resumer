import asyncio
from playwright.async_api import async_playwright
import random
import re
from typing import Dict, Any

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0"
]

def strip_boilerplate(text: str) -> str:
    patterns = [
        r"Equal opportunity employer.*",
        r"We are an equal opportunity.*",
        r"All qualified applicants will receive consideration.*"
    ]
    for p in patterns:
        text = re.sub(p, "", text, flags=re.IGNORECASE|re.DOTALL)
    return text.strip()

async def scrape_job_page(url: str) -> Dict[str, Any]:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=random.choice(USER_AGENTS))
        page = await context.new_page()
        
        try:
            await asyncio.sleep(random.uniform(0.5, 1.5))
            await page.goto(url, timeout=10000, wait_until="domcontentloaded")
            
            text = await page.evaluate("document.body.innerText")
            title = await page.title()
            text = strip_boilerplate(text)
            
            await browser.close()
            return {
                "url": url,
                "title": title,
                "company": "Company Name",
                "jd_text": text,
                "posted_date": "Recently",
                "location": "Remote"
            }
        except Exception as e:
            await browser.close()
            return {"error": str(e), "url": url}
