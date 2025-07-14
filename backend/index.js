const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let SKILL_DATABASE = [];

function loadSkillsFromCSV(filePath) {
  const fileData = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(fileData, {
    header: true,
    skipEmptyLines: true
  });
  SKILL_DATABASE = parsed.data
    .map(row => row.skill?.toLowerCase().trim())
    .filter(Boolean);
  console.log(`✅ Loaded ${SKILL_DATABASE.length} skills from CSV.`);
}

const filePath = path.join(__dirname, "skills.csv");
loadSkillsFromCSV(filePath);

function extractSkills(text) {
  const lowerText = text.toLowerCase();
  return SKILL_DATABASE.filter(skill => lowerText.includes(skill));
}
app.get("/", (req, res) => {
    res.send("✅ Resume Matcher Backend is running.");
  });
  
app.post("/api/analyze-resume", (req, res) => {
  const { resume_text, job_description } = req.body;

  if (!resume_text || !job_description) {
    return res.status(400).json({ error: "Resume text and job description are required." });
  }

  const jdSkills = extractSkills(job_description);
  const resumeSkills = extractSkills(resume_text);

  const matchingSkills = resumeSkills.filter(skill => jdSkills.includes(skill));
  const missingSkills = jdSkills.filter(skill => !resumeSkills.includes(skill));

  const totalSkillsRequired = jdSkills.length;
  const skillsMatched = matchingSkills.length;

  const atsScore = totalSkillsRequired > 0
    ? Math.round((skillsMatched / totalSkillsRequired) * 100)
    : 0;

  const jdWords = job_description.toLowerCase().split(/\W+/);
  const resumeWords = resume_text.toLowerCase().split(/\W+/);
  const commonWords = jdWords.filter(word => resumeWords.includes(word));
  const similarityScore = Math.min(100, Math.round((commonWords.length / jdWords.length) * 100));

  res.json({
    ats_score: atsScore,
    similarity_score: similarityScore,
    skills_matched: skillsMatched,
    total_skills_required: totalSkillsRequired,
    matching_skills: matchingSkills,
    missing_skills: missingSkills
  });
});

// Don't use app.listen — instead export the handler
module.exports = app;
