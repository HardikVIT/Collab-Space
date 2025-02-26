const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');
const path = require('path');

const app = express();
const port = 5000;

// Configure CORS to allow requests from frontend
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Configure body parser with limits
app.use(bodyParser.json({ 
    limit: '50mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch(e) {
            res.status(400).json({ error: 'Invalid JSON' });
            throw new Error('Invalid JSON');
        }
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API endpoint for resume analysis
app.post('/api/analyze-resume', async (req, res) => {
    console.log('Received resume analysis request');
    const { resume_text, job_description } = req.body;

    // Input validation
    if (!resume_text || !job_description) {
        console.log('Missing required fields');
        return res.status(400).json({ 
            error: 'Missing required fields', 
            details: 'Both resume text and job description are required' 
        });
    }

    // Check input length
    if (resume_text.length > 50000 || job_description.length > 50000) {
        return res.status(400).json({ 
            error: 'Input too long',
            details: 'Resume or job description exceeds maximum length of 50,000 characters'
        });
    }

    console.log('Processing with Python script...');

    try {
        let options = {
            mode: 'json',
            pythonPath: 'python',
            pythonOptions: ['-u'], // unbuffered output
            scriptPath: path.join(__dirname),
            args: [JSON.stringify({ resume_text, job_description })],
        };

        // Set timeout for Python script execution
        const timeoutMs = 30000; // 30 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Analysis timed out'));
            }, timeoutMs);
        });

        // Execute Python script with timeout
        const analysisPromise = new Promise((resolve, reject) => {
            PythonShell.run('ats.py', options, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // Race between timeout and analysis
        const results = await Promise.race([analysisPromise, timeoutPromise]);
        
        if (!results || results.length === 0) {
            throw new Error('No results returned from analysis');
        }

        const result = results[results.length - 1];

        // Validate result structure
        if (!result || typeof result.ats_score !== 'number') {
            throw new Error('Invalid analysis result format');
        }

        console.log('Analysis completed successfully');
        res.json(result);

    } catch (error) {
        console.error('Error processing resume:', error);
        
        // Handle different types of errors
        if (error.message.includes('timed out')) {
            res.status(504).json({ 
                error: 'Analysis timed out',
                details: 'The analysis took too long to complete. Please try again.'
            });
        } else if (error.message.includes('No such file or directory')) {
            res.status(500).json({ 
                error: 'Server configuration error',
                details: 'Could not find the analysis script. Please contact support.'
            });
        } else {
            res.status(500).json({ 
                error: 'Analysis failed',
                details: error.message || 'An unexpected error occurred during analysis'
            });
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Server error',
        details: 'An unexpected error occurred'
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});