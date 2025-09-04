const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { type } = require("os");
const { request } = require("http");
const { error } = require("console");

app.use(bodyParser.json());
app.use(express.json());
app.use(cors()); 

let SKILL_DATABASE = [];
const Users=mongoose.model('Users',{
      name:{
            type:String
      },
      password:{
            type:String
      },
      email:{
            type:String
      },
      cartData:{
            type:Object
      },
      date:{
            type:Date
      }

})
app.post('/signup',async (req,res)=>{
      let check=await Users.findOne({email:req.body.email});
      if(check){
            return res.status(400).json({success:false,errors:"existing users found with same username"})
      }
      let cart ={};
      for(let i=0;i<300;i++){
            cart[i]=0
      }
      const user=new Users({
      name:req.body.username,
      email:req.body.email,
      password:req.body.password,
      cartData:cart,
})
await user.save();
const data={
      user:{
            id:user.id
      }
}
const token=jwt.sign(data,'secret-ecom');
res.json({success:true,token})
})


app.post('/login',async (req,res)=>{
let user=await Users.findOne({email:req.body.email});
if(user){
      const passCompare=req.body.password===user.password;
      if(passCompare){
            const data={
                  user :{
                        id:user.id
                  }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
      }
      else{
            res.json({success:false,errors:"Wrong password"})
      }
}
else{
      res.json({success:false,errors:"Wrong email id"})
}

})


//Database connectio with mongo DB
mongoose.connect("mongodb+srv://aarshjain2022:aarshjain@cluster0.grnmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

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


app.post("/", (req, res) => {
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
app.get("/", (req, res) => {
    res.send("✅ Resume Matcher Backend is running.");
});

// Don't use app.listen — instead export the handler
module.exports = app;
