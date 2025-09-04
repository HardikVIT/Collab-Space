import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import mammoth from "mammoth";
import "./ResumeATS.css";

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
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        setResume(value);
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

      if (!response.ok) throw new Error("Failed to analyze. Try again.");
      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || "Unexpected error occurred.");
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
    <div className="ats-container">
      {/* Animated background */}
      <div className="bg-blobs">
        <div className="blob purple"></div>
        <div className="blob cyan"></div>
        <div className="blob indigo"></div>
      </div>

      <div className="main-content">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="title">ATS Resume Scanner</h1>
          <p className="subtitle">
            AI-powered resume analysis to maximize your job application success 🚀
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="grid-container">
          {/* Input Section */}
          <div className="glass-card p-8">
            <label className="label">Job Description</label>
            <textarea
              rows="6"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="input-textarea"
            />

            <label className="label mt-6">Upload Resume (.txt / .docx)</label>
            <input type="file" accept=".txt,.docx" onChange={handleFileUpload} className="input-file" />

            {fileName && <div className="file-name">✔ {fileName}</div>}

            <div className="flex space-x-4 mt-6">
              <button onClick={analyzeResume} disabled={isLoading} className="btn-primary">
                {isLoading ? "Analyzing..." : "Analyze Resume"}
              </button>
              <button onClick={handleClear} disabled={isLoading} className="btn-secondary">
                Clear
              </button>
            </div>
          </div>

          {/* Resume Preview */}
          {resume && (
            <div className="glass-card p-8">
              <h3 className="section-title">Resume Preview</h3>
              <div className="resume-preview">
                <pre>{resume}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="results-section">
            {/* Match Score Circle */}
            <div className="glass-card text-center p-8">
              <div className="score-circle" style={{ background: getScoreGradient(analysisResult.ats_score) }}>
                <div className="score-inner">
                  <h2>{analysisResult.ats_score}%</h2>
                  <p>Match Score</p>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Match", value: analysisResult.ats_score },
                        { name: "Gap", value: 100 - analysisResult.ats_score },
                      ]}
                      dataKey="value"
                      innerRadius={70}
                      outerRadius={100}
                    >
                      <Cell fill={getScoreColor(analysisResult.ats_score)} />
                      <Cell fill="#374151" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Extra Stats */}
            <div className="grid-2">
              <div className="glass-card stat-card">
                <h3>{analysisResult.similarity_score}%</h3>
                <p>Content Similarity</p>
              </div>
              <div className="glass-card stat-card">
                <h3>
                  {analysisResult.skills_matched} / {analysisResult.total_skills_required}
                </h3>
                <p>Skills Matched</p>
              </div>
            </div>

            {/* Skills Section */}
            <div className="grid-2">
              <div className="glass-card p-6">
                <h3 className="skills-title">✅ Matching Skills</h3>
                <div className="skills-list">
                  {analysisResult.matching_skills?.map((s, i) => (
                    <span key={i} className="skill-tag green">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="skills-title">❌ Missing Skills</h3>
                <div className="skills-list">
                  {analysisResult.missing_skills?.map((s, i) => (
                    <span key={i} className="skill-tag red">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeATS;
