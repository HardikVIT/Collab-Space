import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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
    reader.onload = (event) => {
      const text = event.target.result;
      if (text.length > 50000) {
        setError("File content too large. Please shorten the resume.");
        return;
      }
      setResume(text);
      setError(null);
    };
    reader.onerror = () => setError("Error reading file.");
    reader.readAsText(file);
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
      const response = await fetch("https://collab-space-5a9w.vercel.app/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription, resume_text: resume }),
      });

      if (!response.ok) throw new Error("Failed to analyze. Try again due to eroor.");
      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#4caf50";
    if (score >= 50) return "#ff9800";
    return "#f44336";
  };

  return (
    <div className="ats-container">
      <h1 className="ats-title">ATS Resume Scanner</h1>

      {error && <div className="ats-error">{error}</div>}

      <div className="ats-form">
        <label>Job Description</label>
        <textarea
          rows="4"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste job description here..."
        />

        <label>Upload Resume (.txt/.pdf)</label>
        <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} />
        {fileName && <span className="file-name">📎 {fileName}</span>}

        <div className="ats-buttons">
          <button onClick={analyzeResume} disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
          <button className="clear-btn" onClick={handleClear} disabled={isLoading}>
            Clear
          </button>
        </div>
      </div>

      {analysisResult && (
        <div className="ats-result">
          <h2>Match Score: {analysisResult.ats_score}%</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Match", value: analysisResult.ats_score },
                  { name: "Gap", value: 100 - analysisResult.ats_score },
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                <Cell fill={getScoreColor(analysisResult.ats_score)} />
                <Cell fill="#ddd" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="ats-stats">
            <p>📄 Content Similarity: {analysisResult.similarity_score}%</p>
            <p>🧠 Skills Matched: {analysisResult.skills_matched} / {analysisResult.total_skills_required}</p>
          </div>

          {analysisResult.matching_skills?.length > 0 && (
            <div className="skill-box match">
              <h3>✅ Matching Skills</h3>
              {analysisResult.matching_skills.map((skill, i) => (
                <span key={i} className="skill-chip">{skill}</span>
              ))}
            </div>
          )}

          {analysisResult.missing_skills?.length > 0 && (
            <div className="skill-box miss">
              <h3>⚠️ Missing Skills</h3>
              {analysisResult.missing_skills.map((skill, i) => (
                <span key={i} className="skill-chip miss-chip">{skill}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeATS;
