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
    document.querySelector('input[type="file"]').value = "";
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
    if (score >= 70) return "#00ff88";
    if (score >= 50) return "#ffa726";
    return "#ff5252";
  };

  const getScoreGradient = (score) => {
    if (score >= 70) return "linear-gradient(135deg, #00ff88, #00c851)";
    if (score >= 50) return "linear-gradient(135deg, #ffa726, #ff8f00)";
    return "linear-gradient(135deg, #ff5252, #d32f2f)";
  };

  return (
    <div className="ats-wrapper">
      <div className="ats-container">
        <div className="header-section">
          <h1 className="ats-title">
            <span className="title-icon">🎯</span>
            ATS Resume Scanner
            <span className="title-subtitle">AI-Powered Resume Analysis</span>
          </h1>
        </div>

        {error && (
          <div className="ats-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="main-content">
          <div className="input-section">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📋</span>
                Job Description
              </label>
              <textarea
                className="job-textarea"
                rows="6"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📄</span>
                Upload Resume (.txt/.docx)
              </label>
              <div className="file-upload-wrapper">
                <input 
                  type="file" 
                  accept=".txt,.docx" 
                  onChange={handleFileUpload}
                  id="file-input"
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  <span className="upload-icon">⬆️</span>
                  Choose File
                </label>
                {fileName && (
                  <div className="file-name">
                    <span className="file-icon">📎</span>
                    {fileName}
                  </div>
                )}
              </div>
            </div>

            <div className="button-group">
              <button 
                className="analyze-btn" 
                onClick={analyzeResume} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔍</span>
                    Analyze Resume
                  </>
                )}
              </button>
              <button 
                className="clear-btn" 
                onClick={handleClear} 
                disabled={isLoading}
              >
                <span className="btn-icon">🗑️</span>
                Clear All
              </button>
            </div>
          </div>

          {resume && (
            <div className="resume-preview-section">
              <div className="section-header">
                <h3>
                  <span className="section-icon">👀</span>
                  Resume Preview
                </h3>
              </div>
              <div className="resume-content">
                <pre className="resume-text">{resume}</pre>
              </div>
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="results-section">
            <div className="score-section">
              <div className="score-card" style={{ background: getScoreGradient(analysisResult.ats_score) }}>
                <div className="score-content">
                  <div className="score-label">Match Score</div>
                  <div className="score-value">{analysisResult.ats_score}%</div>
                  <div className="score-status">
                    {analysisResult.ats_score >= 70 ? "🎉 Excellent Match" : 
                     analysisResult.ats_score >= 50 ? "👍 Good Match" : "⚡ Needs Improvement"}
                  </div>
                </div>
              </div>

              <div className="chart-container">
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
                      paddingAngle={3}
                      startAngle={90}
                      endAngle={450}
                    >
                      <Cell fill={getScoreColor(analysisResult.ats_score)} />
                      <Cell fill="rgba(255,255,255,0.1)" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{analysisResult.similarity_score}%</div>
                  <div className="stat-label">Content Similarity</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{analysisResult.skills_matched}/{analysisResult.total_skills_required}</div>
                  <div className="stat-label">Skills Matched</div>
                </div>
              </div>
            </div>

            <div className="skills-section">
              {analysisResult.matching_skills?.length > 0 && (
                <div className="skill-category matching">
                  <h3 className="skill-title">
                    <span className="skill-icon">✅</span>
                    Matching Skills
                    <span className="skill-count">({analysisResult.matching_skills.length})</span>
                  </h3>
                  <div className="skill-chips">
                    {analysisResult.matching_skills.map((skill, i) => (
                      <span key={i} className="skill-chip match-chip">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.resume_skills?.length > 0 && (
                <div className="skill-category resume-skills">
                  <h3 className="skill-title">
                    <span className="skill-icon">💼</span>
                    Resume Skills
                    <span className="skill-count">({analysisResult.resume_skills.length})</span>
                  </h3>
                  <div className="skill-chips">
                    {analysisResult.resume_skills.map((skill, i) => (
                      <span key={i} className="skill-chip resume-chip">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.missing_skills?.length > 0 && (
                <div className="skill-category missing">
                  <h3 className="skill-title">
                    <span className="skill-icon">⚠️</span>
                    Missing Skills
                    <span className="skill-count">({analysisResult.missing_skills.length})</span>
                  </h3>
                  <div className="skill-chips">
                    {analysisResult.missing_skills.map((skill, i) => (
                      <span key={i} className="skill-chip miss-chip">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeATS;