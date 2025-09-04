import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./ResumeATS.css";
import mammoth from "mammoth";

const ResumeATS = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB).");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        alert("File uploaded successfully!");
        const arrayBuffer = event.target.result;

        // Extract text from .docx
        const { value } = await mammoth.extractRawText({ arrayBuffer });

        setResume(value);
        console.log(value);
        setError(null);
      } catch (err) {
        setError("Error extracting text from DOCX.");
      }
    };
    reader.onerror = () => setError("Error reading file.");
    reader.readAsArrayBuffer(file);
  };

  const handleClear = () => {
    setJobDescription("");
    setResume(null);
    setAnalysisResult(null);
    setError(null);
    setFileName("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const analyzeResume = async () => {
    if (!jobDescription.trim()) return setError("Enter job description.");
    if (!resume) return setError("Upload a resume file.");
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("https://collab-space-backend-login-ats.vercel.app/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription, resume_text: resume }),
      });

      if (!response.ok) throw new Error("Failed to analyze. Try again due to error.");
      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#10B981";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const getScoreGradient = (score) => {
    if (score >= 70) return "linear-gradient(135deg, #10B981, #059669)";
    if (score >= 50) return "linear-gradient(135deg, #F59E0B, #D97706)";
    return "linear-gradient(135deg, #EF4444, #DC2626)";
  };

  return (
    <div className="app-container">
      {/* Animated background elements */}
      <div className="background-overlay">
        <div className="bg-element bg-element-1"></div>
        <div className="bg-element bg-element-2"></div>
        <div className="bg-element bg-element-3"></div>
      </div>

      <div className="main-wrapper">
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1 className="main-title">
              ATS Resume Scanner
            </h1>
            <p className="subtitle">
              Advanced AI-powered resume analysis to optimize your job application success
            </p>
          </div>

          {error && (
            <div className="error-banner">
              <div className="error-content">
                <div className="error-dot"></div>
                <span className="error-text">{error}</span>
              </div>
            </div>
          )}

          <div className="content-grid">
            {/* Input Section */}
            <div className="glass-card input-section">
              <div className="form-container">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-dot label-dot-cyan"></span>
                    Job Description
                  </label>
                  <textarea
                    rows="6"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here to analyze compatibility..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-dot label-dot-purple"></span>
                    Upload Resume (.txt/.docx)
                  </label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      accept=".txt,.docx"
                      onChange={handleFileUpload}
                      className="file-input"
                    />
                  </div>
                  {fileName && (
                    <div className="file-success">
                      <svg className="check-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {fileName}
                    </div>
                  )}
                </div>

                <div className="button-container">
                  <button
                    onClick={analyzeResume}
                    disabled={isLoading}
                    className={`analyze-button ${isLoading ? 'disabled' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Analyze Resume</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className={`clear-button ${isLoading ? 'disabled' : ''}`}
                  >
                    <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Resume Preview Section */}
            {resume && (
              <div className="glass-card resume-preview">
                <h3 className="preview-title">
                  <span className="preview-dot"></span>
                  Resume Preview
                </h3>
                <div className="preview-content">
                  <pre className="resume-text">
                    {resume}
                  </pre>
                </div>
                <div className="preview-info">
                  <svg className="info-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Text extracted from your resume document
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {analysisResult && (
            <div className="results-container">
              {/* Score Display */}
              <div className="glass-card score-section">
                <div className="score-display">
                  <div 
                    className="score-circle"
                    style={{ background: getScoreGradient(analysisResult.ats_score) }}
                  >
                    <div className="score-inner">
                      <div className="score-content">
                        <div className="score-number">
                          {analysisResult.ats_score}%
                        </div>
                        <div className="score-label">
                          Match Score
                        </div>
                      </div>
                    </div>
                    <div className="score-shine"></div>
                  </div>
                </div>

                {/* Chart */}
                <div className="chart-section">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Match", value: analysisResult.ats_score },
                          { name: "Gap", value: 100 - analysisResult.ats_score },
                        ]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={450}
                      >
                        <Cell fill={getScoreColor(analysisResult.ats_score)} />
                        <Cell fill="#374151" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                <div className="glass-card stat-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-value">{analysisResult.similarity_score}%</p>
                      <p className="stat-label">Content Similarity</p>
                    </div>
                    <div className="stat-icon stat-icon-cyan">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card stat-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-value">
                        {analysisResult.skills_matched} / {analysisResult.total_skills_required}
                      </p>
                      <p className="stat-label">Skills Matched</p>
                    </div>
                    <div className="stat-icon stat-icon-purple">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Sections */}
              <div className="skills-grid">
                {analysisResult.matching_skills?.length > 0 && (
                  <div className="glass-card skills-section skills-matching">
                    <h3 className="skills-title">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Matching Skills
                    </h3>
                    <div className="skills-container">
                      {analysisResult.matching_skills.map((skill, i) => (
                        <span key={i} className="skill-chip skill-chip-green">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.missing_skills?.length > 0 && (
                  <div className="glass-card skills-section skills-missing">
                    <h3 className="skills-title">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Missing Skills
                    </h3>
                    <div className="skills-container">
                      {analysisResult.missing_skills.map((skill, i) => (
                        <span key={i} className="skill-chip skill-chip-red">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeATS;