from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
import random
import pandas as pd
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Sentence Transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')
device = "cuda" if torch.cuda.is_available() else "cpu"
embedding_model = model.to(device)

# Load dataset
df = pd.read_csv('Software Questions.csv', encoding='ISO-8859-1')
df['Question Number'] = df['Question Number'].astype(str)

# Extract questions and answers
categories = df['Category'].unique().tolist()
questions_by_category = {category: df[df['Category'] == category].to_dict(orient='records') for category in categories}

# Load chat model
chat_model = ChatGroq(model="llama3-8b-8192", api_key="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")

# Session storage
user_sessions = {}

class StartSessionRequest(BaseModel):
    category: str

class AnswerRequest(BaseModel):
    user_answer: str
    session_id: str

def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

@app.post("/start")
def start_session(request: StartSessionRequest):
    category = request.category
    if category not in categories:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    session_id = str(random.randint(1000, 9999))  # Generate session ID
    user_sessions[session_id] = {
        "category": category,
        "asked_questions": set()
    }
    
    question_data = random.choice(questions_by_category[category])
    user_sessions[session_id]["current_question"] = question_data
    
    return {"session_id": session_id, "question": question_data['Question']}

@app.post("/answer")
def answer_question(request: AnswerRequest):
    session_id = request.session_id
    if session_id not in user_sessions:
        raise HTTPException(status_code=400, detail="Session not found")
    
    session_data = user_sessions[session_id]
    correct_answer = session_data["current_question"]["Answer"]
    user_answer = request.user_answer
    
    # Compute similarity
    user_embedding = embedding_model.encode(user_answer)
    correct_embedding = embedding_model.encode(correct_answer)
    similarity = float(cosine_similarity(user_embedding, correct_embedding))  # Convert numpy.float32 to float
    
    # Generate feedback
    messages = [
        SystemMessage(content="You are a helpful quiz bot evaluating responses."),
        HumanMessage(content=f"User's answer: {user_answer}\nExpected answer: {correct_answer}\nEvaluate correctness.")
    ]
    feedback = chat_model.invoke(messages).content
    
    # Get next question
    category_questions = questions_by_category[session_data['category']]
    new_question_data = random.choice(category_questions)
    session_data["current_question"] = new_question_data
    
    return {
        "similarity_score": similarity,
        "feedback": feedback,
        "next_question": new_question_data['Question']
    }

# Run server using: uvicorn main:app --reload
