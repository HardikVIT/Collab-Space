import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000"; 

const Chatbot = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [questionData, setQuestionData] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [previousQuestionIdx, setPreviousQuestionIdx] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`http://localhost:5000/categories`)
      .then(res => {
        setCategories(res.data.categories || []);
        setError("");
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
        setError("❌ Failed to load categories. Make sure backend is running.");
      });
  }, []);

  const startInterview = async () => {
    try {
      setFeedback(null);
      const res = await axios.post(`${API_BASE}/question`, {
        category: selectedCategory,
        asked_questions: askedQuestions,
        previous_question_idx: previousQuestionIdx,
      });
      setQuestionData(res.data);
      setPreviousQuestionIdx(res.data.question_idx);
      setAskedQuestions(prev => [...prev, res.data.question_idx]);
      setUserAnswer("");
      setError("");
    } catch (err) {
      console.error("Interview error:", err);
      setError("❌ Failed to start interview. Check your server connection.");
    }
  };

  const submitAnswer = async () => {
    try {
      const res = await axios.post(`${API_BASE}/evaluate`, {
        user_input: userAnswer,
        correct_answer: questionData.answer,
        question_idx: questionData.question_idx,
      });
      setFeedback(res.data);
      setError("");
    } catch (err) {
      console.error("Evaluation error:", err);
      setError("❌ Could not evaluate answer. Try again.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold">🧠 Interview Bot</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block font-semibold mb-2">Select Category:</label>
        <select
          className="border p-2 w-full"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
            <option value="">-- Choose a Category --</option>
            <option value="General Programming">General Programming</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Languages and Frameworks">Languages and Frameworks</option>
            <option value="Database and SQL">Database and SQL</option>
            <option value="Web Development">Web Development</option>
            <option value="Software Testing">Software Testing</option>
            <option value="Version Control">Version Control</option>
            <option value="System Design">System Design</option>
            <option value="Security">Security</option>
            <option value="DevOps">DevOps</option>
            <option value="Front-end">Front-end</option>
            <option value="Back-end">Back-end</option>
            <option value="Full-stack">Full-stack</option>
            <option value="Algorithms">Algorithms</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Distributed Systems">Distributed Systems</option>
            <option value="Networking">Networking</option>
            <option value="Low-level Systems">Low-level Systems</option>
            <option value="Database Systems">Database Systems</option>
            <option value="Data Engineering">Data Engineering</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>

          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>

        <button
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={startInterview}
          disabled={!selectedCategory}
        >
          Start / Next Question
        </button>
      </div>

      {/* Question Display */}
      {questionData && (
        <div className="mt-4">
          <h2 className="font-semibold text-lg">Question:</h2>
          <p className="mb-2">{questionData.question}</p>

          <textarea
            className="border w-full p-2 mt-2"
            rows={4}
            placeholder="Type your answer here..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />

          <button
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            onClick={submitAnswer}
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Feedback Section */}
      {feedback && (
        <div className="mt-4 p-4 bg-gray-100 border rounded">
          <h3 className="font-semibold mb-1">🔍 Feedback:</h3>
          <p className="mb-2">{feedback.feedback}</p>
          <p className="text-sm text-gray-600">
            Similarity Score: {(feedback.similarity * 100).toFixed(2)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
