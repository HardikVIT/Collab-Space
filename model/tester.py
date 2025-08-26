import os
from dotenv import load_dotenv
import requests

# Load .env
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")
print("Loaded HF_API_KEY:", HF_API_KEY[:10] + "...")

# Use sentence similarity pipeline
model_id = "sentence-transformers/all-MiniLM-L6-v2"
url = f"https://api-inference.huggingface.co/models/{model_id}"

headers = {"Authorization": f"Bearer {HF_API_KEY}"}

# Two sentences to compare
payload = {
    "inputs": {
        "source_sentence": "Hello world, Hugging Face embeddings are working!",
        "sentences": [
            "Hi there, this is a test.",
            "Completely unrelated sentence about cats."
        ]
    }
}

response = requests.post(url, headers=headers, json=payload)

print("Status:", response.status_code)
print("Raw text:", response.text[:200], "...")

try:
    data = response.json()
    print("Similarity scores:", data)
except Exception as e:
    print("Error parsing JSON:", e)
