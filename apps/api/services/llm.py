import os
import json
from groq import Groq
import google.generativeai as genai

# Configure clients lazily to allow importing without env vars set immediately
_groq_client = None
_gemini_model = None

def get_groq_client():
    global _groq_client
    if not _groq_client:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")
        _groq_client = Groq(api_key=api_key)
    return _groq_client

def get_gemini_model():
    global _gemini_model
    if not _gemini_model:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    return _gemini_model

def call_llm_with_retry(system_prompt: str, user_prompt: str = "") -> dict:
    messages = [
        {"role": "system", "content": system_prompt},
    ]
    if user_prompt:
        messages.append({"role": "user", "content": user_prompt})

    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.1,
            max_tokens=2000,
        )
        content = response.choices[0].message.content
        
        try:
            return _extract_json(content)
        except ValueError:
            # Retry once
            messages.append({"role": "assistant", "content": content})
            messages.append({"role": "user", "content": "Return ONLY raw JSON, your previous response was invalid."})
            
            response2 = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.1,
                max_tokens=2000,
            )
            content2 = response2.choices[0].message.content
            return _extract_json(content2)
            
    except Exception as e:
        # Fallback to Gemini
        return call_gemini_fallback(system_prompt, user_prompt)

def call_gemini_fallback(system_prompt: str, user_prompt: str) -> dict:
    prompt = f"{system_prompt}\n\n{user_prompt}"
    try:
        model = get_gemini_model()
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.1)
        )
        return _extract_json(response.text)
    except Exception as e:
        raise Exception(f"Both LLMs failed: {str(e)}")

def _extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except:
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end != 0:
            try:
                return json.loads(text[start:end])
            except:
                pass
        raise ValueError("Not valid JSON")
