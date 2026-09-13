const { dbQuery } = require('../db/database');
const { evaluateAnswer, generateFinalReport } = require('./aiService');

const STATES = {
  CREATED: 'CREATED',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  PROCESSING_ANSWER: 'PROCESSING_ANSWER',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

async function getInterviewSession(interviewId) {
  const interview = await dbQuery.get('SELECT * FROM interviews WHERE id = ?', [interviewId]);
  if (!interview) {
    throw new Error('Interview session not found');
  }

  const questions = await dbQuery.all('SELECT * FROM questions WHERE interview_id = ? ORDER BY order_index ASC', [interviewId]);
  const answers = await dbQuery.all('SELECT * FROM answers WHERE interview_id = ?', [interviewId]);

  return {
    interview,
    questions,
    answers
  };
}

async function submitCandidateAnswer(interviewId, questionId, transcript, durationSeconds) {
  const { interview, questions } = await getInterviewSession(interviewId);

  if (interview.status === STATES.COMPLETED) {
    throw new Error('Interview session is already completed.');
  }

  const question = questions.find(q => q.id === questionId);
  if (!question) {
    throw new Error('Question not found in this interview session.');
  }

  // Update state to processing
  await dbQuery.run('UPDATE interviews SET status = ? WHERE id = ?', [STATES.PROCESSING_ANSWER, interviewId]);

  let expectedTopics = [];
  try {
    expectedTopics = JSON.parse(question.expected_topics || '[]');
  } catch (e) {
    expectedTopics = [];
  }

  // AI Evaluation
  const evalResult = await evaluateAnswer(
    question.question_text,
    question.type,
    expectedTopics,
    transcript,
    durationSeconds,
    interview.target_role
  );

  const answerId = `ans_${Date.now()}`;
  await dbQuery.run(`
    INSERT INTO answers (
      id, question_id, interview_id, transcript, duration_seconds,
      technical_score, communication_score, relevance_score, completeness_score,
      overall_score, feedback
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    answerId,
    questionId,
    interviewId,
    transcript || '',
    durationSeconds || 0,
    evalResult.technicalScore,
    evalResult.communicationScore,
    evalResult.relevanceScore,
    evalResult.completenessScore,
    evalResult.overallScore,
    evalResult.feedback
  ]);

  // Check if adaptive follow-up is recommended
  let followUpAdded = false;
  let newQuestion = null;

  if (evalResult.shouldFollowUp && evalResult.followUpQuestion) {
    const followUpId = `q_followup_${Date.now()}`;
    const nextIndex = question.order_index + 1;

    // Shift higher order indices up by 1
    await dbQuery.run('UPDATE questions SET order_index = order_index + 1 WHERE interview_id = ? AND order_index >= ?', [interviewId, nextIndex]);

    await dbQuery.run(`
      INSERT INTO questions (id, interview_id, question_text, type, difficulty, order_index, expected_topics, follow_up_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      followUpId,
      interviewId,
      evalResult.followUpQuestion,
      'followup',
      'medium',
      nextIndex,
      JSON.stringify(expectedTopics),
      evalResult.followUpReason || 'Elaborating on previous answer'
    ]);

    followUpAdded = true;
  }

  // Move to next question index
  const newQuestionIndex = interview.current_question_index + 1;
  const updatedQuestions = await dbQuery.all('SELECT * FROM questions WHERE interview_id = ? ORDER BY order_index ASC', [interviewId]);

  let status = STATES.IN_PROGRESS;
  if (newQuestionIndex >= updatedQuestions.length) {
    status = STATES.IN_PROGRESS; // client can call end explicitly or when last question reached
  }

  await dbQuery.run('UPDATE interviews SET current_question_index = ?, status = ? WHERE id = ?', [newQuestionIndex, status, interviewId]);

  if (newQuestionIndex < updatedQuestions.length) {
    newQuestion = updatedQuestions[newQuestionIndex];
  }

  return {
    evaluation: evalResult,
    followUpAdded,
    nextQuestionIndex: newQuestionIndex,
    totalQuestions: updatedQuestions.length,
    nextQuestion: newQuestion,
    isFinished: newQuestionIndex >= updatedQuestions.length
  };
}

async function finalizeInterviewSession(interviewId) {
  const { interview, questions } = await getInterviewSession(interviewId);

  const answers = await dbQuery.all('SELECT * FROM answers WHERE interview_id = ?', [interviewId]);

  const qaPairs = questions.map(q => {
    const ans = answers.find(a => a.question_id === q.id);
    return { question: q, answer: ans };
  });

  const finalReport = await generateFinalReport(interview.target_role, qaPairs);

  // Store final result
  await dbQuery.run(`
    INSERT OR REPLACE INTO interview_results (
      interview_id, overall_score, technical_score, communication_score,
      problem_solving_score, relevance_score, confidence_score,
      strengths, weaknesses, recommendations, topics_to_improve, summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    interviewId,
    finalReport.overallScore,
    finalReport.technicalScore,
    finalReport.communicationScore,
    finalReport.problemSolvingScore,
    finalReport.relevanceScore,
    finalReport.confidenceScore,
    JSON.stringify(finalReport.strengths || []),
    JSON.stringify(finalReport.weaknesses || []),
    JSON.stringify(finalReport.recommendations || []),
    JSON.stringify(finalReport.topicsToImprove || []),
    finalReport.summary || 'Interview completed.'
  ]);

  // Update interview status to COMPLETED
  await dbQuery.run(`
    UPDATE interviews
    SET status = ?, overall_score = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [STATES.COMPLETED, finalReport.overallScore, interviewId]);

  return finalReport;
}

module.exports = {
  STATES,
  getInterviewSession,
  submitCandidateAnswer,
  finalizeInterviewSession
};
