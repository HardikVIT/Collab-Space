import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from typing import List, Dict
import json
import sys

class ATSAnalyzer:
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Error: Spacy model 'en_core_web_sm' not found. Please install it using:")
            print("python -m spacy download en_core_web_sm")
            sys.exit(1)
    
    def preprocess_text(self, text: str) -> str:
        # Remove special characters and normalize text
        text = re.sub(r'[^\w\s]', ' ', text)
        text = text.lower().strip()
        
        # Use SpaCy for lemmatization and removing stop words
        doc = self.nlp(text)
        tokens = [token.lemma_ for token in doc if not token.is_stop and token.is_alpha]
        return " ".join(tokens)

    def extract_skills_from_job_description(self, text: str) -> List[str]:
        doc = self.nlp(text.lower())
        skills = set()
        
        # Custom patterns to identify skills
        skill_patterns = [
            # Look for words after "proficient in", "experience with", etc.
            r'(?:proficient in|experience with|knowledge of|skilled in|expertise in|background in|understanding of)\s+([\w\s,]+)(?=\.|,|\s|$)',
            # Look for bullet points with technical terms
            r'[•\-\*]\s*([\w\s]+)(?=\.|,|\s|$)',
            # Look for requirements
            r'(?:required|requirements|qualifications):\s*([\w\s,]+)(?=\.|,|\s|$)',
            # Look for years of experience patterns
            r'(\d+\+?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience\s*(?:in|with))?\s*([\w\s,]+))(?=\.|,|\s|$)'
        ]

        # Extract skills using patterns
        for pattern in skill_patterns:
            matches = re.finditer(pattern, text.lower())
            for match in matches:
                if len(match.groups()) > 1:
                    skill_text = match.group(2)  # Get the skill part from year pattern
                else:
                    skill_text = match.group(1)  # Get the entire match
                
                # Clean and split the skills
                skill_terms = skill_text.strip().split(',')
                for term in skill_terms:
                    term = term.strip()
                    if term and len(term) > 2:  # Avoid too short terms
                        skills.add(term)

        # Extract noun phrases as potential skills
        for chunk in doc.noun_chunks:
            if not any(token.is_stop for token in chunk):
                skill = chunk.text.strip()
                if skill and len(skill) > 2:
                    skills.add(skill)

        # Extract technical terms and frameworks
        technical_patterns = [
            r'\b[A-Za-z]+[\+\#]?\+{2}\b',  # C++, C#
            r'\b[A-Za-z]+\.?[jJ][sS]\b',    # JavaScript, Node.js
            r'\b[A-Za-z]+\.?[pP][yY]\b',    # Python, NumPy
            r'\b[A-Za-z]+\.?[nN][eE][tT]\b', # .NET
            r'\b[A-Za-z]+[vV][3-6]?\b',     # Angular, HTML5
        ]

        for pattern in technical_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                skills.add(match.group().lower())

        return list(skills)

    def analyze_resume(self, resume_text: str, job_desc: str) -> Dict:
        try:
            # Input validation
            if not resume_text or not job_desc:
                raise ValueError("Missing resume text or job description")
            
            # Extract skills from job description
            required_skills = self.extract_skills_from_job_description(job_desc)
            
            # Extract skills from resume using the same method
            candidate_skills = self.extract_skills_from_job_description(resume_text)
            
            # Calculate skills match
            required_skills_set = set(required_skills)
            candidate_skills_set = set(candidate_skills)
            matching_skills = required_skills_set.intersection(candidate_skills_set)
            missing_skills = required_skills_set - candidate_skills_set
            
            # Calculate skills match score (30% of total)
            skills_score = len(matching_skills) / len(required_skills_set) if required_skills_set else 0
            
            # Calculate content similarity (70% of total)
            processed_resume = self.preprocess_text(resume_text)
            processed_jd = self.preprocess_text(job_desc)
            
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([processed_jd, processed_resume])
            similarity_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Calculate final score
            final_score = (similarity_score * 0.7 + skills_score * 0.3) * 100
            
            return {
                "ats_score": round(final_score, 2),
                "similarity_score": round(similarity_score * 100, 2),
                "skills_score": round(skills_score * 100, 2),
                "required_skills": sorted(list(required_skills_set)),
                "missing_skills": sorted(list(missing_skills)),
                "matching_skills": sorted(list(matching_skills)),
                "total_skills_required": len(required_skills_set),
                "skills_matched": len(matching_skills)
            }
            
        except Exception as e:
            print(f"Error in analyze_resume: {str(e)}", file=sys.stderr)
            raise

if __name__ == "__main__":
    try:
        # Read input from stdin or command line argument
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            input_data = json.loads(sys.stdin.read())
        
        analyzer = ATSAnalyzer()
        result = analyzer.analyze_resume(
            input_data.get('resume_text', ''),
            input_data.get('job_description', '')
        )
        
        print(json.dumps(result))
        
    except Exception as e:
        error_response = {
            "error": str(e),
            "status": "error"
        }
        print(json.dumps(error_response))
        sys.exit(1)