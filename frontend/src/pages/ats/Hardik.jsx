import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 animate-fade-in">
              ATS Resume Scanner
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Advanced AI-powered resume analysis to optimize your job application success
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                <span className="text-red-300 font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Input Section */}
            <div className="glass-card p-8 rounded-2xl backdrop-blur-lg border border-white/10 shadow-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Job Description
                  </label>
                  <textarea
                    rows="6"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here to analyze compatibility..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 resize-none backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Upload Resume (.txt/.docx)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".txt,.docx"
                      onChange={handleFileUpload}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-purple-500 file:text-white file:font-medium hover:file:from-cyan-600 hover:file:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 backdrop-blur-sm"
                    />
                  </div>
                  {fileName && (
                    <div className="mt-3 flex items-center text-green-400 font-medium">
                      <svg className="w-5 h-5 mr-2 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {fileName}
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={analyzeResume}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Analyze Resume</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Resume Preview Section */}
            {resume && (
              <div className="glass-card p-8 rounded-2xl backdrop-blur-lg border border-white/10 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                  Resume Preview
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-80 overflow-y-auto custom-scrollbar">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed font-mono">
                    {resume}
                  </pre>
                </div>
                <div className="mt-4 text-sm text-gray-400 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Text extracted from your resume document
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {analysisResult && (
            <div className="space-y-8">
              {/* Score Display */}
              <div className="glass-card p-8 rounded-2xl backdrop-blur-lg border border-white/10 shadow-2xl text-center">
                <div className="relative inline-block">
                  <div 
                    className="w-48 h-48 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden shadow-2xl"
                    style={{ background: getScoreGradient(analysisResult.ats_score) }}
                  >
                    <div className="absolute inset-2 bg-slate-900/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-2">
                          {analysisResult.ats_score}%
                        </div>
                        <div className="text-sm text-gray-300 font-medium">
                          Match Score
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Chart */}
                <div className="mt-8">
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl backdrop-blur-lg border border-white/10 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{analysisResult.similarity_score}%</p>
                      <p className="text-gray-400 font-medium">Content Similarity</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card p-6 rounded-2xl backdrop-blur-lg border border-white/10 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {analysisResult.skills_matched} / {analysisResult.total_skills_required}
                      </p>
                      <p className="text-gray-400 font-medium">Skills Matched</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Sections */}
              <div className="grid lg:grid-cols-2 gap-8">
                {analysisResult.matching_skills?.length > 0 && (
                  <div className="glass-card p-8 rounded-2xl backdrop-blur-lg border border-green-500/20 shadow-xl">
                    <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Matching Skills
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {analysisResult.matching_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 rounded-xl font-medium backdrop-blur-sm hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 transform hover:scale-105"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.missing_skills?.length > 0 && (
                  <div className="glass-card p-8 rounded-2xl backdrop-blur-lg border border-red-500/20 shadow-xl">
                    <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Missing Skills
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {analysisResult.missing_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-300 rounded-xl font-medium backdrop-blur-sm hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 transform hover:scale-105"
                        >
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

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8);
        }

        .container {
          max-width: 1200px;
        }
      `}</style>
    </div>
  );
};

export default ResumeATS;