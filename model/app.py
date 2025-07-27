from flask import Flask, request, jsonify
import os
import torch
import numpy as np
import pandas as pd
import random
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import DataFrameLoader
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from flask_cors import CORS


# =========================
# Initialization
# =========================

app = Flask(__name__)
CORS(app) 

load_dotenv()
device = "cuda" if torch.cuda.is_available() else "cpu"
embedding_model = SentenceTransformer('all-MiniLM-L6-v2').to(device)
groq_api_key = os.getenv("GROQ_API_KEY")
chat_model = ChatGroq(model="mistral-saba-24b", api_key=groq_api_key)

df = pd.read_csv('Software-Questions.csv', encoding='ISO-8859-1')
loader = DataFrameLoader(df, page_content_column="Question")
questions = loader.load()
questions_text = [doc.page_content for doc in questions]
answers_text = [doc.metadata['Answer'] for doc in questions]
categories = list(set(doc.metadata["Category"] for doc in questions))
questions_by_category = {category: [] for category in categories}
for doc in questions:
    category = doc.metadata["Category"]
    questions_by_category[category].append(doc)

question_embeddings = np.load('question_embeddings.npy')
answer_embeddings = np.load('answer_embeddings.npy')
category_embeddings = np.load('category_embeddings.npy')

# =========================
# Utility Functions
# =========================

def cosine_similarity(vec1, vec2):
    return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))

def generate_response(user_input, correct_answer):
    messages = [
        SystemMessage(content="You are a helpful interview bot that evaluates user responses and gives them a score out of 5."),
        HumanMessage(content=f"User's answer: {user_input}\nExpected answer: {correct_answer}\nEvaluate correctness and give a response.")
    ]
    response = chat_model.invoke(messages)
    return response.content

def get_new_question(previous_question_idx, category_questions, asked_questions, question_embeddings):
    while True:
        new_idx = random.randint(0, len(category_questions) - 1)
        if new_idx == previous_question_idx or new_idx in asked_questions:
            continue
        if previous_question_idx is not None:
            similarity = cosine_similarity(
                question_embeddings[previous_question_idx],
                question_embeddings[new_idx]
            )
            if similarity > 0.7:
                continue
        asked_questions.add(new_idx)
        return new_idx

# =========================
# API Endpoints
# =========================

@app.route('/categories', methods=['GET'])
def get_categories():
    return jsonify({'categories': categories})

@app.route('/question', methods=['POST'])
def get_question():
    data = request.get_json()
    category = data.get('category')
    asked_questions = set(data.get('asked_questions', []))
    previous_question_idx = data.get('previous_question_idx')
    if category not in categories:
        return jsonify({'error': 'Invalid category'}), 400
    category_questions = questions_by_category[category]
    idx = get_new_question(previous_question_idx, category_questions, asked_questions, question_embeddings)
    question = category_questions[idx].page_content
    answer = category_questions[idx].metadata['Answer']
    return jsonify({
        'question_idx': idx,
        'question': question,
        'answer': answer,  # Remove this in production!
        'category': category
    })

@app.route('/evaluate', methods=['POST'])
def evaluate_answer():
    data = request.get_json()
    user_input = data.get('user_input')
    correct_answer = data.get('correct_answer')
    question_idx = data.get('question_idx')
    user_response_embedding = embedding_model.encode(user_input)
    expected_answer_embedding = answer_embeddings[question_idx]
    similarity = cosine_similarity(user_response_embedding, expected_answer_embedding)
    feedback = generate_response(user_input, correct_answer)
    return jsonify({
        'similarity': similarity,
        'feedback': feedback
    })

if __name__ == '__main__':
    app.run(debug=True)