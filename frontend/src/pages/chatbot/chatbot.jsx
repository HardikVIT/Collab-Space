import React, { useState, useEffect } from "react";
import axios from "axios";
import './chatbot.css'; // Make sure this imports your CSS file

const API_BASE = "https://collab-space-bot.vercel.app";

const Chatbot = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [questionData, setQuestionData] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [previousQuestionIdx, setPreviousQuestionIdx] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const categoryIcons = {
    "General Programming": "💻",
    "Data Structures": "🌳", 
    "Languages and Frameworks": "🔧",
    "Database and SQL": "🗃️",
    "Web Development": "🌐",
    "Software Testing": "🧪",
    "Version Control": "📝",
    "System Design": "🏗️",
    "Security": "🔐",
    "DevOps": "⚙️",
    "Front-end": "🎨",
    "Back-end": "⚡",
    "Full-stack": "🔥",
    "Algorithms": "🧮",
    "Machine Learning": "🤖",
    "Distributed Systems": "🌍",
    "Networking": "📡",
    "Low-level Systems": "⚡",
    "Database Systems": "🗄️",
    "Data Engineering": "📊",
    "Artificial Intelligence": "🧠"
  };

  useEffect(() => {
    axios.get(`https://collab-space-bot.vercel.app/categories`)
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
      setLoading(true);
      setFeedback(null);
      setCurrentStep(2);
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
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    try {
      setLoading(true);
      setCurrentStep(3);
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
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    setCurrentStep(1);
    setQuestionData(null);
    setFeedback(null);
    setUserAnswer("");
    setSelectedCategory("");
  };

  return (
    <div className="app">
      {/* Floating particles background effect */}
      <div className="floating-particles">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}></div>
        ))}
      </div>

      <div className="chatbot-container">
        {/* Premium Header */}
        <div className="premium-header">
          <div className="header-icon">
            <span className="icon-emoji">🚀</span>
          </div>
          <h1 className="main-title">AI Interview Mastery</h1>
          <p className="subtitle">Master your technical interviews with AI-powered practice sessions</p>
          
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-number">{askedQuestions.length}</div>
              <div className="stat-label">Questions</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{feedback ? Math.round(feedback.similarity * 100) : 0}%</div>
              <div className="stat-label">Last Score</div>
            </div>
            {/*<div className="stat-item">
              <div className="stat-number">{Math.floor(Math.random() * 25) + 5}m</div>
              <div className="stat-label">Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{Math.floor(Math.random() * 8) + 1}</div>
              <div className="stat-label">Streak</div>
        </div>*/}
          </div>

          {/* Progress Steps */}
          <div className="progress-steps">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`progress-step ${currentStep >= step ? 'active' : ''}`}>
                  {step}
                </div>
                {step < 3 && <div className={`progress-line ${currentStep > step ? 'active' : ''}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="main-content">
          {/* Error Display */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Step 1: Category Selection */}
          {currentStep === 1 && (
            <div className="step-container">
              <div className="step-header">
                <h2>Choose Your Challenge</h2>
                <p>Select a category to begin your interview practice</p>
              </div>

              <div className="category-grid">
                {Object.entries(categoryIcons).map(([category, icon]) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`category-card ${selectedCategory === category ? 'selected' : ''}`}
                  >
                    <div className="category-icon">{icon}</div>
                    <div className="category-name">{category}</div>
                  </button>
                ))}
              </div>

              <div className="step-actions">
                <button
                  onClick={startInterview}
                  disabled={!selectedCategory || loading}
                  className="btn-primary large"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Generating Question...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🎯</span>
                      Start Interview
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Question Display */}
          {currentStep === 2 && questionData && (
            <div className="step-container">
              <div className="question-header">
                <div className="question-info">
                  <span className="category-icon-large">{categoryIcons[selectedCategory]}</span>
                  <div>
                    <h2>{selectedCategory}</h2>
                    <p>Question {askedQuestions.length}</p>
                  </div>
                </div>
                <button onClick={resetInterview} className="btn-reset">Reset</button>
              </div>

              <div className="question-card">
                <div className="question-label">
                  <span className="question-icon">❓</span>
                  <h3>Interview Question</h3>
                </div>
                <div className="question-text">
                  {questionData.question}
                </div>
              </div>

              <div className="answer-section">
                <label className="answer-label">Your Answer:</label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="answer-textarea premium"
                  placeholder="Take your time to provide a detailed, thoughtful answer. Consider examples, pros/cons, and real-world applications..."
                />
                <div className="answer-stats">
                  <span>{userAnswer.length} characters</span>
                  <span className="tip">💡 Tip: Explain your reasoning step by step</span>
                </div>
              </div>

              <div className="step-actions">
                <button
                  onClick={submitAnswer}
                  disabled={!userAnswer.trim() || loading}
                  className="btn-submit large"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      AI is analyzing...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🚀</span>
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Feedback */}
          {currentStep === 3 && feedback && (
            <div className="step-container">
              <div className="feedback-header">
                <div className="feedback-icon-container">
                  <span className="feedback-icon">✨</span>
                </div>
                <h2>AI Analysis Complete</h2>
                <p>Here's your detailed feedback and score</p>
              </div>

              {/* Score Circle */}
              <div className="score-container">
                <div className="score-circle">
                  <svg className="score-ring" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - feedback.similarity)}`}
                      className="score-progress"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="score-text">
                    <span className="score-number">{Math.round(feedback.similarity * 100)}%</span>
                  </div>
                </div>
                <p className="score-label">Overall Score</p>
              </div>

              {/* Feedback Card */}
              <div className="feedback-card">
                <div className="feedback-label">
                  <span className="feedback-ai-icon">🤖</span>
                  <h3>AI Feedback</h3>
                </div>
                <p className="feedback-text">{feedback.feedback}</p>
              </div>

              {/* Action Buttons */}
              <div className="feedback-actions">
                <button onClick={startInterview} className="btn-primary">
                  <span className="btn-icon">➡️</span>
                  Next Question
                </button>
                <button onClick={resetInterview} className="btn-secondary">
                  <span className="btn-icon">🔄</span>
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;