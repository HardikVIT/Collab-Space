# Interview QA Bot Flask API

This project provides a Flask-based REST API for an interview question-answering bot. The bot serves questions from a dataset, evaluates user responses using embeddings and a language model, and supports category-based question selection. The API is designed for easy integration with web or mobile frontends.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Setup \& Installation](#setup--installation)
- [Configuration](#configuration)
- [API Usage Guide](#api-usage-guide)
    - [Get Categories](#1-get-categories)
    - [Request a Question](#2-request-a-question)
    - [Evaluate an Answer](#3-evaluate-an-answer)
- [State Management](#state-management)
- [Example Client Flow](#example-client-flow)
- [Security Notes](#security-notes)
- [Extending the API](#extending-the-api)
- [Troubleshooting](#troubleshooting)


## Features

- **Category-based question selection:** Users can pick a category and receive questions only from that category.
- **Avoids repeats and similar questions:** Uses embeddings to reduce question redundancy.
- **Automated answer evaluation:** Uses both cosine similarity and an LLM for feedback and scoring.
- **Stateless API:** All session state is managed by the client.
- **Easy integration:** Designed for use with any frontend via JSON HTTP requests.


## Project Structure

```
your_project/
├── app.py
├── Software Questions.csv
├── question_embeddings.npy
├── answer_embeddings.npy
├── category_embeddings.npy
├── .env
├── requirements.txt
```

- **app.py:** Main Flask API application.
- **Software Questions.csv:** Dataset of questions, answers, and categories.
- **question_embeddings.npy, answer_embeddings.npy, category_embeddings.npy:** Precomputed embeddings.
- **.env:** Environment variables (API keys, etc.).
- **requirements.txt:** Python dependencies.


## Setup \& Installation

1. **Clone the repository** and navigate to the project directory.
2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Prepare your `.env` file** with your API key:

```
GROQ_API_KEY=your_groq_api_key_here
```

4. **Ensure all data files** (`Software Questions.csv`, `*.npy` embeddings) are present in the project directory.
5. **Run the Flask app:**

```bash
python app.py
```

The API will be available at `http://127.0.0.1:5000/` by default.

## Configuration

- **Environment Variables:**
Store sensitive keys (e.g., `GROQ_API_KEY`) in the `.env` file.
- **Embeddings:**
The `.npy` files must match the dataset and embedding model used in the code.


## API Usage Guide

### 1. Get Categories

**Endpoint:**
`GET /categories`

**Description:**
Returns a list of available question categories.

**Response Example:**

```json
{
  "categories": ["Python", "Databases", "Algorithms"]
}
```


### 2. Request a Question

**Endpoint:**
`POST /question`

**Description:**
Request a new question from a chosen category. The client provides the current category, a list of already asked question indices, and the previous question index.

**Request Example:**

```json
{
  "category": "Python",
  "asked_questions": [1, 5],
  "previous_question_idx": 5
}
```

**Response Example:**

```json
{
  "question_idx": 8,
  "question": "What is a Python decorator?",
  "answer": "A decorator is a function that modifies another function.",  // Remove in production!
  "category": "Python"
}
```

> **Note:** The `answer` field is included for demonstration. **Remove it in production** to prevent exposing answers.

### 3. Evaluate an Answer

**Endpoint:**
`POST /evaluate`

**Description:**
Evaluate a user's answer using cosine similarity and an LLM for feedback.

**Request Example:**

```json
{
  "user_input": "It's a way to modify functions.",
  "correct_answer": "A decorator is a function that modifies another function.",
  "question_idx": 8
}
```

**Response Example:**

```json
{
  "similarity": 0.82,
  "feedback": "Good answer! You correctly described a decorator."
}
```


## State Management

- The API is **stateless**: it does not track user sessions, categories, or asked questions.
- The **client (frontend)** must:
    - Track which questions have been asked (`asked_questions`).
    - Remember the current category and previous question index.
    - Manage chat or interaction history if needed.


## Example Client Flow

1. **Fetch categories:**
UI calls `/categories` and displays options.
2. **User selects a category:**
UI sends a `/question` request with the chosen category and empty `asked_questions`.
3. **Bot returns a question:**
UI displays the question to the user.
4. **User submits an answer:**
UI sends `/evaluate` with the user's answer, the correct answer (from the previous `/question` response), and the question index.
5. **Bot returns feedback:**
UI shows the feedback and similarity score.
6. **Repeat or switch category:**
UI can request another question from the same or a different category at any time.

## Security Notes

- **Do NOT return the correct answer** in `/question` responses in production.
- **Protect your `.env` and API keys.**
- For production, use a WSGI server (e.g., Gunicorn) and consider HTTPS.


## Extending the API

- **Session Management:**
To track user sessions or chat history server-side, integrate Flask sessions, Redis, or a database.
- **Frontend Integration:**
The API is compatible with any frontend framework (React, Vue, mobile apps, etc.).
- **Dataset Expansion:**
Add more questions or categories by updating `Software Questions.csv` and regenerating embeddings.


## Troubleshooting

- **Missing API Keys:**
Ensure `GROQ_API_KEY` is set in `.env`.
- **File Not Found Errors:**
Check that all data and embedding files are present.
- **Model Compatibility:**
The embedding model and `.npy` files must match.

For further questions or customization, feel free to reach out or open an issue in your project repository.

