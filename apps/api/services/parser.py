import fitz  # PyMuPDF
import pdfplumber
import docx
import io
import re
import spacy
from typing import Dict, Any
from .llm import call_llm_with_retry

# Load spaCy model for NER
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Handled via requirements / explicit download in prod, fallback gracefully here
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    for page in doc:
        text += page.get_text()
    
    if len(text.split()) < 100:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])

def strip_pii(text: str) -> str:
    phone_regex = r"\(?\b[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b"
    text = re.sub(phone_regex, "[PHONE REMOVED]", text)
    
    dob_regex = r"\b(DOB|Date of Birth)[\s:]*[0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4}\b"
    text = re.sub(dob_regex, "[DOB REMOVED]", text, flags=re.IGNORECASE)
    
    address_regex = r"\d{1,5}\s\w+\s(?:st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|court|ct)\b"
    text = re.sub(address_regex, "[ADDRESS REMOVED]", text, flags=re.IGNORECASE)
    
    email_regex = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    text = re.sub(email_regex, "[EMAIL REMOVED]", text)
    
    return text

def parse_resume(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    if "pdf" in mime_type.lower():
        raw_text = extract_text_from_pdf(file_bytes)
    elif "wordprocessingml" in mime_type.lower() or "docx" in mime_type.lower():
        raw_text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {mime_type}")
        
    clean_text = strip_pii(raw_text)
    
    system_prompt = """
You are a technical resume parser. Extract structured information from the provided resume text.
Return ONLY valid JSON. No explanation, no markdown, no code blocks. Raw JSON only.

Output schema:
{
  "sections": {
    "experience": [{ "title": str, "company": str, "duration": str, "bullets": [str], "confidence": float }],
    "education": [{ "degree": str, "institution": str, "year": str, "confidence": float }],
    "skills": [str],
    "projects": [{ "name": str, "description": str, "tech": [str] }]
  },
  "flags": [str] // e.g. "Missing graduation year", "Vague job title: Consultant"
}
"""
    structured_data = call_llm_with_retry(system_prompt, clean_text)
    
    return {
        "raw_text": raw_text,
        "sections": structured_data.get("sections", {}),
        "flags": structured_data.get("flags", [])
    }
