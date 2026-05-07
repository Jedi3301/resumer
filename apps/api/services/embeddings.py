from sentence_transformers import SentenceTransformer
import chromadb
import os
import numpy as np

# Enforce CPU-only
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Load model globally
_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
    return _model

# Initialize ChromaDB client
def get_chroma_client():
    persist_dir = os.environ.get("CHROMA_PERSIST_PATH", "./chroma_db")
    os.makedirs(persist_dir, exist_ok=True)
    return chromadb.PersistentClient(path=persist_dir)

def get_job_collection():
    client = get_chroma_client()
    return client.get_or_create_collection(name="jobs")

def get_embedding(text: str) -> list[float]:
    model = get_model()
    embedding = model.encode(text)
    return embedding.tolist()

def add_job_embedding(job_id: str, jd_text: str):
    emb = get_embedding(jd_text)
    collection = get_job_collection()
    collection.upsert(
        embeddings=[emb],
        documents=[jd_text],
        ids=[str(job_id)]
    )
    return emb

def compute_similarity(emb1: list[float], emb2: list[float]) -> float:
    a = np.array(emb1)
    b = np.array(emb2)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
