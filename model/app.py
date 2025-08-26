from flask import Flask, request, jsonify
import os
import random
import pandas as pd
import requests
from dotenv import load_dotenv
from flask_cors import CORS
from langchain_community.document_loaders import DataFrameLoader
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

# =========================
# Initialization
# =========================

app = Flask(__name__)
CORS(app)

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
hf_api_key = os.getenv("HF_API_KEY")

# Chat model (Groq)
chat_model = ChatGroq(model="llama-3.1-8b-instant", api_key=groq_api_key)

# Load questions dataset
df = pd.read_csv("Software-Questions.csv", encoding="ISO-8859-1")
loader = DataFrameLoader(df, page_content_column="Question")
questions = loader.load()

# Organize data
categories = list(set(doc.metadata["Category"] for doc in questions))
questions_by_category = {category: [] for category in categories}
for doc in questions:
    questions_by_category[doc.metadata["Category"]].append(doc)

# =========================
# Utility Functions
# =========================

def generate_response(user_input, correct_answer):
    """Generate LLM feedback using Groq"""
    messages = [
        SystemMessage(content="You are a helpful interview bot that evaluates user responses and gives them a score out of 5."),
        HumanMessage(content=f"User's answer: {user_input}\nExpected answer: {correct_answer}\nEvaluate correctness and give a response.")
    ]
    response = chat_model.invoke(messages)
    return response.content

def get_new_question(previous_question_idx, category_questions, asked_questions):
    """Pick a new random question that hasn’t been asked yet"""
    while True:
        new_idx = random.randint(0, len(category_questions) - 1)
        if new_idx == previous_question_idx or new_idx in asked_questions:
            continue
        asked_questions.add(new_idx)
        return new_idx

def compute_similarity(user_input, correct_answer):
    """Use Hugging Face Inference API for sentence similarity"""
    url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {hf_api_key}"}
    payload = {
        "inputs": {
            "source_sentence": user_input,
            "sentences": [correct_answer]
        }
    }
    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        return None, response.text

    scores = response.json()
    similarity = float(scores[0]) if isinstance(scores, list) else 0.0
    return similarity, None

# =========================
# API Endpoints
# =========================

@app.route("/categories", methods=["GET"])
def get_categories():
    return jsonify({"categories": categories})

@app.route("/question", methods=["POST"])
def get_question():
    data = request.get_json()
    category = data.get("category")
    asked_questions = set(data.get("asked_questions", []))
    previous_question_idx = data.get("previous_question_idx")

    if category not in categories:
        return jsonify({"error": "Invalid category"}), 400

    category_questions = questions_by_category[category]
    idx = get_new_question(previous_question_idx, category_questions, asked_questions)
    question = category_questions[idx].page_content
    answer = category_questions[idx].metadata["Answer"]

    return jsonify({
        "question_idx": idx,
        "question": question,
        "answer": answer,  # ⚠️ remove in production
        "category": category
    })

@app.route("/evaluate", methods=["POST"])
def evaluate_answer():
    data = request.get_json()
    user_input = data.get("user_input")
    correct_answer = data.get("correct_answer")

    # Compute similarity
    similarity, error = compute_similarity(user_input, correct_answer)
    if similarity is None:
        return jsonify({"error": error, "similarity": None, "feedback": "Could not compute similarity"}), 500

    # Generate LLM feedback
    feedback = generate_response(user_input, correct_answer)

    return jsonify({
        "similarity": similarity,
        "feedback": feedback
    })

# =========================
# Main
# =========================

if __name__ == "__main__":
    app.run(debug=True)
