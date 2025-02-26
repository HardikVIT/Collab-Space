import React, { useState, useEffect } from "react";
import './chatbot.css';
const Chatbot = () => {
    const [categories, setCategories] = useState([]);  // Store available categories
    const [category, setCategory] = useState("");      // Store selected category
    const [sessionId, setSessionId] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [userAnswer, setUserAnswer] = useState("");
    const [feedback, setFeedback] = useState("");
    const [similarityScore, setSimilarityScore] = useState(null);

    // Fetch categories from backend (Replace with actual categories if static)
    useEffect(() => {
        setCategories(['General Programming', 'General Program', 'Data Structures', 'Languages and Frameworks', 'Database and SQL', 'Web Development', 'Software Testing', 'Version Control', 'System Design', 'Security', 'DevOps', 'Front-end', 'Back-end', 'Full-stack', 'Algorithms', 'Machine Learning', 'Distributed Systems', 'Networking', 'Low-level Systems', 'Database Systems', 'Data Engineering', 'Artificial Intelligence']);  // Replace with actual categories from backend
    }, []);

    // Function to start interview
    const startInterview = async () => {
        if (!category) {
            alert("Please select a category first!");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category })
            });

            const data = await response.json();
            if (response.ok) {
                setSessionId(data.session_id);
                setCurrentQuestion(data.question);
                setFeedback(""); // Reset feedback when starting
                setSimilarityScore(null);
            } else {
                console.error("Error:", data.detail);
            }
        } catch (error) {
            console.error("Failed to start interview:", error);
        }
    };

    // Function to submit answer
    const submitAnswer = async () => {
        if (!userAnswer.trim()) {
            alert("Please enter an answer!");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    user_answer: userAnswer
                })
            });

            const data = await response.json();
            if (response.ok) {
                setFeedback(data.feedback);
                setSimilarityScore(data.similarity_score);
                setCurrentQuestion(data.next_question);
                setUserAnswer("");  // Clear input field
            } else {
                console.error("Error:", data.detail);
            }
        } catch (error) {
            console.error("Failed to submit answer:", error);
        }
    };

    // Function to skip to the next question
    const nextQuestion = async () => {
        if (!sessionId) {
            alert("Please start the interview first!");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category })
            });

            const data = await response.json();
            if (response.ok) {
                setCurrentQuestion(data.question);
                setUserAnswer("");
                setFeedback("");
                setSimilarityScore(null);
            } else {
                console.error("Error:", data.detail);
            }
        } catch (error) {
            console.error("Failed to fetch next question:", error);
        }
    };

    return (
        <div className="chatbot-container" style={{ maxWidth: "500px", margin: "auto", textAlign: "center" }}>
            <div className="Headingg">
                <h1>Interview Chatbot</h1>
            </div>

            {/* Category Selection */}
            <div className="chatbot-category">
                <label>Select Category:</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">-- Select --</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <br />

            {/* Start Interview Button */}
            <button className="chatbot-button" onClick={startInterview}>Start Interview</button>

            {/* Display Question */}
            {currentQuestion && (
                <div className="chatbot-question">
                    <h3>Question: {currentQuestion}</h3>
                    <textarea className="chatbot-textarea"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows="4"
                        cols="50"
                    />
                    <br />
                    <button className="chatbot-button" onClick={submitAnswer}>Submit Answer</button>
                    <button className="chatbot-button" onClick={nextQuestion} style={{ marginLeft: "10px" }}>Next Question</button>
                </div>
            )}

            {/* Feedback Section */}
            {feedback && (
                <div className="chatbot-feedback">
                    <h3>Feedback:</h3>
                    <p>{feedback}</p>
                    <p className="chatbot-score">Similarity Score: {similarityScore?.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};

export default Chatbot;