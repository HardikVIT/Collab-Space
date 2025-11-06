import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import './chatbot.css'; // Make sure this imports your CSS file

const API_BASE = "https://collab-space-interview.vercel.app/";

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
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Add ref to store interval ID
  const intervalRef = useRef(null);

  const categoryIcons = {
    "General Programming": "💻",
    "Data Structures": "🌳", 
    "Languages and Frameworks": "🔧",
    "Database and SQL": "🗃️",
    "Web Development": "🌐",
    "Software Testing": "🧪",
    "Version Control": "📝",
    "System Design": "🏗️",
    "Security": "🔒",
    "DevOps": "⚙️",
    "Front-end": "🎨",
    "Back-end": "⚡",
    "Full-stack": "🔥",
    "Algorithms": "🧮",
    "Machine Learning": "🤖",
    "Distributed Systems": "🌐",
    "Networking": "📡",
    "Low-level Systems": "⚡",
    "Database Systems": "🗄️",
    "Data Engineering": "📊",
    "Artificial Intelligence": "🧠"
  };

  const categoryEntries = Object.entries(categoryIcons);
  const categoriesPerPage = 6; // 3 columns x 2 rows
  const maxPages = Math.ceil(categoryEntries.length / categoriesPerPage);

  // Function to start/restart the auto-slide timer
  const startAutoSlide = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start new interval
    intervalRef.current = setInterval(() => {
      setCarouselOffset(prev => {
        return prev >= maxPages - 1 ? 0 : prev + 1;
      });
    }, 4000); // Slide every 4 seconds
  };

  // Function to stop the auto-slide timer
  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Auto-sliding carousel effect
  useEffect(() => {
    if (currentStep === 1 && !selectedCategory) {
      // Only auto-slide when on step 1 AND no category is selected
      startAutoSlide();
    } else {
      // Stop auto-sliding when category is selected or not on step 1
      stopAutoSlide();
    }

    // Cleanup on unmount
    return () => stopAutoSlide();
  }, [currentStep, selectedCategory, maxPages]);

  // Modified carousel scroll handlers with timer reset
  const scrollToNext = () => {
    if (carouselOffset < maxPages - 1) {
      setCarouselOffset(prev => prev + 1);
      // Reset the auto-slide timer when manually navigating (only if no category selected)
      if (!selectedCategory) {
        startAutoSlide();
      }
    }
  };

  const scrollToPrev = () => {
    if (carouselOffset > 0) {
      setCarouselOffset(prev => prev - 1);
      // Reset the auto-slide timer when manually navigating (only if no category selected)
      if (!selectedCategory) {
        startAutoSlide();
      }
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 0 || e.deltaX > 0) {
      scrollToNext();
    } else {
      scrollToPrev();
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLeft(carouselOffset);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (startX - x) / 200; // Adjust sensitivity
    const newOffset = Math.max(0, Math.min(maxPages - 1, scrollLeft + walk));
    const roundedOffset = Math.round(newOffset);
    
    // Only update if the offset actually changed
    if (roundedOffset !== carouselOffset) {
      setCarouselOffset(roundedOffset);
      // Reset the auto-slide timer when manually dragging (only if no category selected)
      if (!selectedCategory) {
        startAutoSlide();
      }
    }
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    setScrollLeft(carouselOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX;
    const walk = (startX - x) / 200; // Adjust sensitivity
    const newOffset = Math.max(0, Math.min(maxPages - 1, scrollLeft + walk));
    const roundedOffset = Math.round(newOffset);
    
    // Only update if the offset actually changed
    if (roundedOffset !== carouselOffset) {
      setCarouselOffset(roundedOffset);
      // Reset the auto-slide timer when manually touching/swiping (only if no category selected)
      if (!selectedCategory) {
        startAutoSlide();
      }
    }
  };

  // Modified page dot click handler with timer reset
  const handlePageDotClick = (index) => {
    setCarouselOffset(index);
    // Reset the auto-slide timer when clicking page dots (only if no category selected)
    if (!selectedCategory) {
      startAutoSlide();
    }
  };

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
      setError("⚠️ Failed to start interview. Check your server connection.");
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
      setError("⚠️ Could not evaluate answer. Try again.");
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
    setCarouselOffset(0);
  };

  // Get current page categories
  const getCurrentPageCategories = () => {
    const startIndex = carouselOffset * categoriesPerPage;
    const endIndex = startIndex + categoriesPerPage;
    return categoryEntries.slice(startIndex, endIndex);
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

              {/* Category Carousel */}
              <div className="category-carousel-container">
                <div 
                  className="category-carousel-wrapper"
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onWheel={handleWheel}
                >
                  <div className="category-grid-2rows">
                    {getCurrentPageCategories().map(([category, icon]) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`category-card carousel-card ${selectedCategory === category ? 'selected' : ''}`}
                      >
                        <div className="category-icon">{icon}</div>
                        <div className="category-name">{category}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scroll indicators */}
                <div className="carousel-indicators">
                  <button 
                    className="carousel-nav prev" 
                    onClick={scrollToPrev}
                    disabled={carouselOffset === 0}
                  >
                    ‹
                  </button>
                  <button 
                    className="carousel-nav next" 
                    onClick={scrollToNext}
                    disabled={carouselOffset >= maxPages - 1}
                  >
                    ›
                  </button>
                </div>

                {/* Page indicators */}
                <div className="page-indicators">
                  {[...Array(maxPages)].map((_, index) => (
                    <button
                      key={index}
                      className={`page-dot ${index === carouselOffset ? 'active' : ''}`}
                      onClick={() => handlePageDotClick(index)}
                    />
                  ))}
                </div>
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