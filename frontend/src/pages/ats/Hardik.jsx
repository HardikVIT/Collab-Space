import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import mammoth from "mammoth";
import "./ResumeATS.css"; // ✅ Import vanilla CSS

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
    <div className="ats-page">
      {/* Animated background elements */}
      <div className="ats-background">
        <div className="bg-circle purple"></div>
        <div className="bg-circle cyan"></div>
        <div className="bg-circle indigo"></div>
      </div>

      <div className="ats-container">
        <div className="ats-header">
          <h1 className="ats-title">ATS Resume Scanner</h1>
          <p className="ats-subtitle">
            Advanced AI-powered resume analysis to optimize your job application success
          </p>
        </div>

        {error && (
          <div className="error-box">
            <div className="error-dot"></div>
            <span>{error}</span>
          </div>
        )}

        <div className="ats-grid">
          {/* Input Section */}
          <div className="glass-card">
            <label className="ats-label">Job Description</label>
            <textarea
              rows="6"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="ats-textarea"
            />

            <label className="ats-label">Upload Resume (.txt/.docx)</label>
            <input
              type="file"
              accept=".txt,.docx"
              onChange={handleFileUpload}
              className="ats-file"
            />
            {fileName && <div className="file-success">{fileName}</div>}

            <div className="ats-buttons">
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
            <div className="glass-card">
              <h3 className="preview-title">Resume Preview</h3>
              <div className="preview-box">
                <pre>{resume}</pre>
              </div>
              <div className="preview-note">Text extracted from your resume document</div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {analysisResult && (
          <div className="ats-results">
            <div className="glass-card score-card">
              <div
                className="score-circle"
                style={{ background: getScoreGradient(analysisResult.ats_score) }}
              >
                <div className="score-inner">
                  <div className="score-value">{analysisResult.ats_score}%</div>
                  <div className="score-label">Match Score</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Match", value: analysisResult.ats_score },
                      { name: "Gap", value: 100 - analysisResult.ats_score },
                    ]}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={100}
                    startAngle={90}
                    endAngle={450}
                  >
                    <Cell fill={getScoreColor(analysisResult.ats_score)} />
                    <Cell fill="#374151" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeATS;
