import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./Hardik.css";

const ResumeATS = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size too large. Please upload a file smaller than 5MB.');
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          if (text.length > 50000) {
            setError('File content too large. Please upload a shorter resume.');
            return;
          }
          setResume(text);
          setError(null);
        } catch (error) {
          setError('Error reading file. Please ensure it\'s a valid text document.');
          console.error('File reading error:', error);
        }
      };
      reader.onerror = (error) => {
        setError('Error reading file. Please try again.');
        console.error('FileReader error:', error);
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    setJobDescription("");
    setResume(null);
    setAnalysisResult(null);
    setError(null);
    setFileName("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const analyzeResume = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }
    if (!resume) {
      setError("Please upload a resume");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('http://localhost:5000/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resume,
          job_description: jobDescription
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to analyze resume. Please try again.');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#28a745";  // Green
    if (score >= 50) return "#ffc107";  // Yellow
    return "#dc3545";                   // Red
  };

  return (
    <div className="resume-container">
      <h2 className="title">AI-Powered ATS Resume Scanner</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="form-section">
        <div className="input-group">
          <label>Job Description:</label>
          <textarea 
            rows="5" 
            placeholder="Paste the job description here..." 
            value={jobDescription} 
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label>Resume Upload:</label>
          <div className="file-upload-container">
            <input 
              type="file" 
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="file-input"
            />
            {fileName && (
              <div className="file-name">
                File loaded: {fileName}
              </div>
            )}
          </div>
        </div>

        <div className="button-group">
          <button 
            onClick={analyzeResume} 
            className="analyze-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
          <button 
            onClick={handleClear} 
            className="clear-btn"
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </div>
      
      {analysisResult && (
        <div className="result-container">
          <h3>ATS Match Score: {analysisResult.ats_score}%</h3>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Match", value: analysisResult.ats_score },
                    { name: "Gap", value: 100 - analysisResult.ats_score }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill={getScoreColor(analysisResult.ats_score)} />
                  <Cell fill="#cccccc" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="score-details">
            <div className="score-item">
              <span className="score-label">Content Match:</span>
              <span className="score-value">{analysisResult.similarity_score}%</span>
            </div>
            <div className="score-item">
              <span className="score-label">Skills Match:</span>
              <span className="score-value">
                {analysisResult.skills_matched} / {analysisResult.total_skills_required}
              </span>
            </div>
          </div>

          {analysisResult.missing_skills?.length > 0 && (
            <div className="missing-keywords">
              <h4>Missing Key Skills:</h4>
              <div className="skills-list">
                {analysisResult.missing_skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysisResult.matching_skills?.length > 0 && (
            <div className="matching-keywords">
              <h4>Matching Skills:</h4>
              <div className="skills-list">
                {analysisResult.matching_skills.map((skill, index) => (
                  <span key={index} className="skill-tag matching">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeATS;