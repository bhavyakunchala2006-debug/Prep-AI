const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { dbQuery } = require('../db/database');
const { extractTextFromResume } = require('../services/resumeService');
const { generateInterviewQuestions, analyzeJobAndResume } = require('../services/aiService');
const { getInterviewSession, submitCandidateAnswer, finalizeInterviewSession, STATES } = require('../services/interviewStateService');

// Configure Multer for file upload
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Please upload PDF or DOCX file.'));
    }
  }
});

const optionalUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('resume')(req, res, next);
  } else {
    next();
  }
};

/**
 * 1. CREATE INTERVIEW SESSION
 * POST /api/interviews/create
 */
router.post('/create', optionalUpload, async (req, res) => {
  try {
    const { targetRole, jobDescription, userEmail, resumeTextDirect } = req.body;

    let resumeText = resumeTextDirect || '';

    if (req.file) {
      resumeText = await extractTextFromResume(req.file);
    }

    const role = targetRole || 'Software Engineer';
    const interviewId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // AI Resume & JD Analysis
    const analysis = await analyzeJobAndResume(resumeText, role, jobDescription);

    // AI Question Generation
    const questions = await generateInterviewQuestions(resumeText, role, jobDescription, 5);

    // Store in Database
    await dbQuery.run(`
      INSERT INTO interviews (id, user_email, target_role, job_description, resume_summary, status, current_question_index, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      interviewId,
      userEmail || 'guest@prepai.ai',
      role,
      jobDescription || '',
      JSON.stringify({ summary: analysis.summary, skills: analysis.skillsExtracted }),
      STATES.READY,
      0
    ]);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await dbQuery.run(`
        INSERT INTO questions (id, interview_id, question_text, type, difficulty, order_index, expected_topics)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        q.id,
        interviewId,
        q.question,
        q.type,
        q.difficulty,
        i,
        JSON.stringify(q.expectedTopics || [])
      ]);
    }

    return res.json({
      success: true,
      message: 'Interview session created successfully',
      data: {
        interviewId,
        targetRole: role,
        totalQuestions: questions.length,
        analysis,
        firstQuestion: questions[0]
      }
    });
  } catch (err) {
    console.error('Error creating interview session:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate interview session'
    });
  }
});

/**
 * Helper to check interview authorization
 */
function isAuthorizedUser(interview, req) {
  const requestEmail = req.headers['x-user-email'] || req.body.userEmail || req.query.userEmail;
  if (!requestEmail || !interview.user_email || interview.user_email === 'guest@prepai.ai') {
    return true;
  }
  return interview.user_email === requestEmail;
}

/**
 * 2. GET INTERVIEW SESSION DETAILS
 * GET /api/interviews/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const session = await getInterviewSession(req.params.id);
    if (!isAuthorizedUser(session.interview, req)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this interview session.' });
    }
    return res.json({
      success: true,
      data: session
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Interview session not found'
    });
  }
});

/**
 * 3. SUBMIT ANSWER TO CURRENT QUESTION
 * POST /api/interviews/:id/answer
 */
router.post('/:id/answer', async (req, res) => {
  try {
    const { questionId, transcript, durationSeconds } = req.body;
    const interviewId = req.params.id;

    if (!questionId) {
      return res.status(400).json({ success: false, message: 'Question ID is required' });
    }

    const { interview } = await getInterviewSession(interviewId);
    if (!isAuthorizedUser(interview, req)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this interview session.' });
    }

    const result = await submitCandidateAnswer(interviewId, questionId, transcript, durationSeconds);

    return res.json({
      success: true,
      message: 'Answer submitted and evaluated successfully',
      data: result
    });
  } catch (err) {
    console.error('Error processing answer:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error processing answer'
    });
  }
});

/**
 * 4. END INTERVIEW & GENERATE FINAL REPORT
 * POST /api/interviews/:id/end
 */
router.post('/:id/end', async (req, res) => {
  try {
    const interviewId = req.params.id;
    const { interview } = await getInterviewSession(interviewId);
    if (!isAuthorizedUser(interview, req)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this interview session.' });
    }

    const report = await finalizeInterviewSession(interviewId);

    return res.json({
      success: true,
      message: 'Interview completed successfully',
      data: report
    });
  } catch (err) {
    console.error('Error finalizing interview:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to finalize interview report'
    });
  }
});

/**
 * 5. GET FINAL REPORT RESULT
 * GET /api/interviews/:id/result
 */
router.get('/:id/result', async (req, res) => {
  try {
    const interviewId = req.params.id;
    const { interview } = await getInterviewSession(interviewId);
    if (!isAuthorizedUser(interview, req)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this interview session.' });
    }

    const resultRow = await dbQuery.get('SELECT * FROM interview_results WHERE interview_id = ?', [interviewId]);

    if (!resultRow) {
      // If report not yet generated, attempt to generate
      const report = await finalizeInterviewSession(interviewId);
      return res.json({ success: true, data: report });
    }

    const parsedReport = {
      interviewId: resultRow.interview_id,
      overallScore: resultRow.overall_score,
      technicalScore: resultRow.technical_score,
      communicationScore: resultRow.communication_score,
      problemSolvingScore: resultRow.problem_solving_score,
      relevanceScore: resultRow.relevance_score,
      confidenceScore: resultRow.confidence_score,
      strengths: JSON.parse(resultRow.strengths || '[]'),
      weaknesses: JSON.parse(resultRow.weaknesses || '[]'),
      recommendations: JSON.parse(resultRow.recommendations || '[]'),
      topicsToImprove: JSON.parse(resultRow.topics_to_improve || '[]'),
      summary: resultRow.summary
    };

    return res.json({
      success: true,
      data: parsedReport
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Interview results not found'
    });
  }
});

/**
 * 6. GET USER INTERVIEW HISTORY
 * GET /api/interviews/user/:email
 */
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const interviews = await dbQuery.all(`
      SELECT i.*, r.overall_score, r.summary
      FROM interviews i
      LEFT JOIN interview_results r ON i.id = r.interview_id
      WHERE i.user_email = ?
      ORDER BY i.created_at DESC
    `, [email]);

    return res.json({
      success: true,
      data: interviews
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch user interviews'
    });
  }
});

module.exports = router;
