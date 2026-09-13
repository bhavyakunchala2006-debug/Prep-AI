const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

/**
 * Parses uploaded resume file (PDF or DOCX) and returns raw text.
 */
async function extractTextFromResume(file) {
  if (!file) {
    throw new Error('No resume file provided');
  }

  const ext = path.extname(file.originalname).toLowerCase();
  let rawText = '';

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(file.path);
    try {
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData ? (pdfData.text || '') : '';
    } catch (pdfErr) {
      console.warn('pdf-parse warning/fallback:', pdfErr.message);
      rawText = dataBuffer.toString('utf8').replace(/[^\x20-\x7E\n]/g, ' ');
    }
  } else if (ext === '.docx' || ext === '.doc') {
    const dataBuffer = fs.readFileSync(file.path);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    rawText = result.value || '';
  } else if (ext === '.txt') {
    rawText = fs.readFileSync(file.path, 'utf8');
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }

  // Clean up uploaded file from disk after reading
  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (err) {
    console.warn('Could not delete temporary upload file:', err.message);
  }

  return rawText.trim();
}

/**
 * Basic heuristic parsing to extract key resume details if AI parsing fails or as pre-pass.
 */
function parseResumeHeuristics(text) {
  if (!text) return { rawText: '', skills: [], projects: [], summary: '' };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const skills = [];
  const projects = [];

  // Simple keyword detection for fallback
  const commonSkills = [
    'javascript', 'python', 'java', 'c++', 'c#', 'html', 'css', 'react', 'node.js',
    'express', 'sql', 'mongodb', 'postgresql', 'aws', 'docker', 'git', 'machine learning',
    'data analysis', 'deep learning', 'pandas', 'numpy', 'scikit-learn', 'tensorflow'
  ];

  const textLower = text.toLowerCase();
  commonSkills.forEach(skill => {
    if (textLower.includes(skill)) {
      skills.push(skill);
    }
  });

  return {
    rawText: text,
    skills,
    summary: text.slice(0, 1000)
  };
}

module.exports = {
  extractTextFromResume,
  parseResumeHeuristics
};
