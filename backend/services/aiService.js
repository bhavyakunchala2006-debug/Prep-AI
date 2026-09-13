const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

function parseJsonFromText(text) {
  if (!text) return null;
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {}
    }
    return null;
  }
}

/**
 * 1. AI Resume & Job Description Analysis
 */
async function analyzeJobAndResume(resumeText, targetRole, jobDescription) {
  const model = getGeminiModel();
  if (!model) {
    throw new Error('AI_UNAVAILABLE: Gemini API key is missing or not configured in .env.');
  }

  const prompt = `
You are an expert AI Career Mentor and Tech Interviewer.
Analyze the following candidate resume and target role.

Target Role: ${targetRole || 'Software Engineer'}
Job Description: ${jobDescription || 'Standard requirements for the role'}
Resume Content:
${resumeText ? resumeText.slice(0, 3000) : 'No resume uploaded.'}

Provide output strictly as JSON with this schema:
{
  "skillsExtracted": ["skill1", "skill2"],
  "projectHighlights": ["project1", "project2"],
  "targetRole": "${targetRole}",
  "matchScore": 85,
  "summary": "Brief summary of candidate readiness"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseJsonFromText(text);
  if (parsed) return parsed;

  throw new Error('AI_RESPONSE_MALFORMED: Failed to parse AI resume analysis response.');
}

/**
 * 2. Generate Structured Interview Questions
 */
async function generateInterviewQuestions(resumeText, targetRole, jobDescription, questionCount = 5) {
  const model = getGeminiModel();
  if (!model) {
    throw new Error('AI_UNAVAILABLE: Gemini API key is missing or not configured in .env.');
  }

  const prompt = `
You are an experienced technical interviewer. Generate a structured ${questionCount}-question interview for a candidate applying for:
Target Role: ${targetRole || 'Software Engineer'}
Job Description: ${jobDescription || 'Standard software engineering role'}
Resume Summary: ${resumeText ? resumeText.slice(0, 2000) : 'Candidate with relevant tech skills.'}

Instructions:
1. Question 1 must be behavioral / background introduction.
2. Question 2 must be core technical concepts for the target role.
3. Question 3 must ask about a project from their resume or relevant practical project implementation.
4. Question 4 must be situational / problem solving.
5. Question 5 must be an advanced technical scenario or system design question.

Return ONLY a valid JSON array of question objects matching this exact schema:
[
  {
    "question": "Clear interview question prompt",
    "type": "behavioral" | "technical" | "project" | "situational",
    "difficulty": "easy" | "medium" | "hard",
    "expectedTopics": ["topic1", "topic2"]
  }
]
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseJsonFromText(text);

  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((q, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      question: q.question || `Tell me about your experience as a ${targetRole}.`,
      type: q.type || 'technical',
      difficulty: q.difficulty || 'medium',
      expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics : ['general concept'],
      orderIndex: idx
    }));
  }

  throw new Error('AI_RESPONSE_MALFORMED: Failed to generate structured interview questions from Gemini.');
}

/**
 * 3. AI Answer Evaluation & Dynamic Adaptive Follow-up
 */
async function evaluateAnswer(questionText, questionType, expectedTopics, candidateTranscript, durationSeconds, targetRole) {
  const model = getGeminiModel();
  if (!model) {
    throw new Error('AI_UNAVAILABLE: Gemini API key is missing or not configured in .env.');
  }

  const transcript = (candidateTranscript || '').trim();

  const prompt = `
You are an expert interviewer evaluating a candidate's answer for the role of ${targetRole || 'Software Engineer'}.

Interview Question: "${questionText}"
Question Type: ${questionType || 'technical'}
Expected Topics: ${JSON.stringify(expectedTopics || [])}
Candidate Spoken Answer Transcript: "${transcript}"
Answer Duration: ${durationSeconds || 30} seconds

Evaluate the response objectively on 0-100 scale:
1. Technical correctness & depth
2. Relevance to question asked
3. Communication clarity & structure
4. Completeness

Also determine if an adaptive follow-up question is warranted (e.g. if the answer is vague, incomplete, or missed an important nuance).

Return ONLY valid JSON matching this schema:
{
  "technicalScore": 85,
  "communicationScore": 80,
  "relevanceScore": 90,
  "completenessScore": 75,
  "overallScore": 82,
  "feedback": "Concise summary feedback for the candidate.",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "shouldFollowUp": false,
  "followUpQuestion": null,
  "followUpReason": null
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseJsonFromText(text);

  if (parsed && typeof parsed.overallScore === 'number') {
    return {
      technicalScore: Math.max(0, Math.min(100, parsed.technicalScore || 70)),
      communicationScore: Math.max(0, Math.min(100, parsed.communicationScore || 70)),
      relevanceScore: Math.max(0, Math.min(100, parsed.relevanceScore || 70)),
      completenessScore: Math.max(0, Math.min(100, parsed.completenessScore || 70)),
      overallScore: Math.max(0, Math.min(100, parsed.overallScore || 70)),
      feedback: parsed.feedback || 'Answer evaluated successfully.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Good communication'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Provide more technical depth'],
      shouldFollowUp: Boolean(parsed.shouldFollowUp),
      followUpQuestion: parsed.shouldFollowUp ? (parsed.followUpQuestion || null) : null,
      followUpReason: parsed.shouldFollowUp ? (parsed.followUpReason || null) : null
    };
  }

  throw new Error('AI_RESPONSE_MALFORMED: Failed to parse Gemini evaluation output.');
}

/**
 * 4. Generate Comprehensive Final Interview Report
 */
async function generateFinalReport(targetRole, questionsAndAnswers) {
  const model = getGeminiModel();
  if (!model) {
    throw new Error('AI_UNAVAILABLE: Gemini API key is missing or not configured in .env.');
  }

  let totalTech = 0, totalComm = 0, totalRel = 0, totalComp = 0, count = 0;
  const qaSummary = questionsAndAnswers.map(qa => {
    if (qa.answer) {
      totalTech += (qa.answer.technical_score || qa.answer.technicalScore || 70);
      totalComm += (qa.answer.communication_score || qa.answer.communicationScore || 70);
      totalRel += (qa.answer.relevance_score || qa.answer.relevanceScore || 70);
      totalComp += (qa.answer.completeness_score || qa.answer.completenessScore || 70);
      count++;
    }
    return {
      question: qa.question.question_text || qa.question.question,
      transcript: qa.answer ? qa.answer.transcript : 'No response provided.',
      feedback: qa.answer ? qa.answer.feedback : 'N/A'
    };
  });

  const avgTech = count > 0 ? Math.round(totalTech / count) : 0;
  const avgComm = count > 0 ? Math.round(totalComm / count) : 0;
  const avgRel = count > 0 ? Math.round(totalRel / count) : 0;
  const avgComp = count > 0 ? Math.round(totalComp / count) : 0;
  const overall = Math.round((avgTech * 0.35) + (avgComm * 0.25) + (avgRel * 0.2) + (avgComp * 0.2));

  const prompt = `
You are a senior tech hiring manager creating the final candidate assessment report.

Target Role: ${targetRole}
Interview Performance Summary:
- Average Technical: ${avgTech}
- Average Communication: ${avgComm}
- Average Relevance: ${avgRel}
- Overall Score: ${overall}

Questions & Answers Detail:
${JSON.stringify(qaSummary, null, 2)}

Provide a detailed structured evaluation JSON:
{
  "overallScore": ${overall},
  "technicalScore": ${avgTech},
  "communicationScore": ${avgComm},
  "problemSolvingScore": ${Math.round((avgTech + avgComp) / 2)},
  "relevanceScore": ${avgRel},
  "confidenceScore": ${Math.round((avgComm + avgRel) / 2)},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["actionable advice 1", "actionable advice 2"],
  "topicsToImprove": ["topic 1", "topic 2"],
  "summary": "Comprehensive 2-3 sentence performance executive summary."
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseJsonFromText(text);
  if (parsed && typeof parsed.overallScore === 'number') {
    return parsed;
  }

  throw new Error('AI_RESPONSE_MALFORMED: Failed to parse Gemini final report output.');
}

module.exports = {
  analyzeJobAndResume,
  generateInterviewQuestions,
  evaluateAnswer,
  generateFinalReport
};
