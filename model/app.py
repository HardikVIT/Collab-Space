from flask import Flask, request, jsonify
import os, csv, random, requests
from dotenv import load_dotenv
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
hf_api_key = os.getenv("HF_API_KEY")

# =========================
# Load Questions (CSV → list)
# =========================
questions = []
categories = set()

with open("Software-Questions.csv", encoding="ISO-8859-1") as f:
    reader = csv.DictReader(f)
    for row in reader:
        q = row["Question"]
        a = row["Answer"]
        c = row["Category"]
        questions.append({"question": q, "answer": a, "category": c})
        categories.add(c)

categories = list(categories)

# =========================
# Utility Functions
# =========================
def generate_response(user_input, correct_answer):
    """Call Groq API directly"""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {groq_api_key}"}
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "You are a helpful interview bot that evaluates user responses and scores them out of 5."},
            {"role": "user", "content": f"User's answer: {user_input}\nExpected answer: {correct_answer}\nEvaluate correctness and give a response."}
        ]
    }
    r = requests.post(url, headers=headers, json=payload)
    if r.status_code == 200:
        return r.json()["choices"][0]["message"]["content"]
    return "Error from Groq: " + r.text

def compute_similarity(user_input, correct_answer):
    """Use Hugging Face Inference API for sentence similarity"""
    url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {hf_api_key}"}
    payload = {"inputs": {"source_sentence": user_input, "sentences": [correct_answer]}}
    r = requests.post(url, headers=headers, json=payload)
    if r.status_code != 200:
        return None, r.text
    scores = r.json()
    return float(scores[0]), None if isinstance(scores, list) else (0.0, None)

# =========================
# Routes
# =========================
@app.route("/categories", methods=["GET"])
def get_categories():
    return jsonify({"categories": categories})

@app.route("/question", methods=["POST"])
def get_question():
    data = request.get_json()
    category = data.get("category")
    asked = set(data.get("asked_questions", []))
    prev_idx = data.get("previous_question_idx")

    qs = [q for q in questions if q["category"] == category]
    if not qs:
        return jsonify({"error": "Invalid category"}), 400

    while True:
        idx = random.randint(0, len(qs) - 1)
        if idx != prev_idx and idx not in asked:
            asked.add(idx)
            q = qs[idx]
            return jsonify({
                "question_idx": idx,
                "question": q["question"],
                "answer": q["answer"],  # ⚠ remove in prod
                "category": category
            })

@app.route("/evaluate", methods=["POST"])
def evaluate_answer():
    data = request.get_json()
    user_input = data.get("user_input")
    correct_answer = data.get("correct_answer")

    sim, err = compute_similarity(user_input, correct_answer)
    if sim is None:
        return jsonify({"error": err}), 500

    feedback = generate_response(user_input, correct_answer)

    return jsonify({"similarity": sim, "feedback": feedback})

# =========================
# Main
# =========================
if __name__ == "__main__":
    app.run(debug=True)
