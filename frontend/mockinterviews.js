// PrepAI - AI Video Mock Interview Client Logic

let activeSession = null;
let currentQuestionIndex = 0;
let totalQuestions = 0;
let questionsList = [];
let answersList = [];

// Media Stream & Speech State
let mediaStream = null;
let isMicMuted = false;
let isCamOff = false;
let isRecordingAnswer = false;
let answerStartTime = null;
let speechRecognition = null;
let currentTranscript = "";
let speechSynth = window.speechSynthesis;
let timerInterval = null;
let sessionSeconds = 0;

// DOM Elements
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("resume");
const uploadText = document.getElementById("uploadText");
const roleInput = document.getElementById("role");
const descInput = document.getElementById("desc");
const generateBtn = document.getElementById("generateBtn");
const setupLoading = document.getElementById("setupLoading");
const setupLoadingText = document.getElementById("setupLoadingText");

// Sections
const setupSection = document.getElementById("setupSection");
const lobbySection = document.getElementById("lobbySection");
const interviewSection = document.getElementById("interviewSection");
const resultsSection = document.getElementById("resultsSection");

// Global User Info Sync
window.addEventListener("DOMContentLoaded", () => {
  syncUserProfile();
  setupUploadListeners();
  initSpeechRecognition();
});

function syncUserProfile() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  if (user.name) {
    document.getElementById("profileName").innerText = user.name;
    document.getElementById("avatar").innerText = user.name.charAt(0).toUpperCase();
  }
  if (user.branch) {
    document.getElementById("profileBranch").innerText = user.branch;
  }
  if (user.goal && (!roleInput.value || roleInput.value.trim() === "")) {
    roleInput.value = user.goal;
  }
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function showNotification(msg) {
  const banner = document.getElementById("notificationBanner");
  document.getElementById("notificationMsg").innerText = msg;
  banner.classList.remove("hidden");
}

function hideNotification() {
  document.getElementById("notificationBanner").classList.add("hidden");
}

// Upload Area Events
function setupUploadListeners() {
  uploadArea.addEventListener("click", () => fileInput.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#6a5af9";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.borderColor = "#d6d6d6";
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#d6d6d6";
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelected();
    }
  });

  fileInput.addEventListener("change", handleFileSelected);
}

function handleFileSelected() {
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    uploadText.innerHTML = `<strong>Resume Selected:</strong> ${file.name} ✔`;
  }
}

// 1. GENERATE INTERVIEW SESSION
async function handleGenerateInterview() {
  const role = roleInput.value.trim();
  const desc = descInput.value.trim();
  const file = fileInput.files[0];

  if (!role) {
    showNotification("Please enter your target job role (e.g. Junior Software Engineer).");
    return;
  }

  hideNotification();
  generateBtn.disabled = true;
  setupLoading.classList.remove("hidden");
  setupLoadingText.innerText = "Analyzing resume & generating interview questions...";

  const formData = new FormData();
  formData.append("targetRole", role);
  formData.append("jobDescription", desc);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  formData.append("userEmail", user.email || "guest@prepai.ai");

  if (file) {
    formData.append("resume", file);
  }

  try {
    const response = await fetch("/api/interviews/create", {
      method: "POST",
      body: formData
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      throw new Error(resData.message || "Failed to create interview session.");
    }

    activeSession = resData.data;
    setupLobbyView(activeSession);
  } catch (err) {
    console.error("Error creating interview:", err);
    showNotification(err.message || "Network or server error during session creation.");
  } finally {
    generateBtn.disabled = false;
    setupLoading.classList.add("hidden");
  }
}

// 2. SETUP LOBBY VIEW
function setupLobbyView(sessionData) {
  setupSection.classList.add("hidden");
  lobbySection.classList.remove("hidden");

  document.getElementById("lobbyRole").innerText = sessionData.targetRole;
  document.getElementById("lobbyQuestionCount").innerText = `${sessionData.totalQuestions} Questions`;
  document.getElementById("lobbyResumeStatus").innerText = fileInput.files[0] ? "Parsed & Analyzed ✓" : "Default Profile";

  // Auto request media stream in lobby
  enableMediaDevices();
}

// Media Stream Request (Camera + Mic)
async function enableMediaDevices() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    const previewVideo = document.getElementById("previewVideo");
    previewVideo.srcObject = mediaStream;
    document.getElementById("previewPlaceholder").style.display = "none";

    const camBadge = document.getElementById("camBadge");
    const micBadge = document.getElementById("micBadge");

    camBadge.classList.add("active");
    camBadge.innerHTML = "<span>📷</span> Camera: Active";

    micBadge.classList.add("active");
    micBadge.innerHTML = "<span>🎙️</span> Microphone: Active";
  } catch (err) {
    console.warn("Camera/microphone permission denied or unavailable:", err.message);
    const camBadge = document.getElementById("camBadge");
    const micBadge = document.getElementById("micBadge");

    camBadge.classList.add("denied");
    camBadge.innerHTML = "<span>📷</span> Camera: Denied/Off";

    micBadge.classList.add("denied");
    micBadge.innerHTML = "<span>🎙️</span> Microphone: Denied/Off";

    showNotification("Camera/microphone access denied. You can still proceed using text input fallback.");
  }
}

// 3. START INTERVIEW SESSION
async function startInterviewSession() {
  lobbySection.classList.add("hidden");
  interviewSection.classList.remove("hidden");

  // Connect video stream to candidate video element
  if (mediaStream) {
    const candidateVideo = document.getElementById("candidateVideo");
    candidateVideo.srcObject = mediaStream;
  }

  // Fetch complete session details from server
  try {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const res = await fetch(`/api/interviews/${activeSession.interviewId}`, {
      headers: { "x-user-email": user.email || "guest@prepai.ai" }
    });
    const data = await res.json();
    if (data.success) {
      questionsList = data.data.questions;
      totalQuestions = questionsList.length;
      currentQuestionIndex = 0;
      answersList = [];
    }
  } catch (e) {
    console.error("Error fetching session questions:", e);
  }

  document.getElementById("interviewHeaderRole").innerText = activeSession.targetRole;
  startSessionTimer();
  loadQuestion(currentQuestionIndex);
}

function startSessionTimer() {
  sessionSeconds = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    sessionSeconds++;
    const mins = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
    const secs = String(sessionSeconds % 60).padStart(2, '0');
    document.getElementById("timerDisplay").innerText = `${mins}:${secs}`;
  }, 1000);
}

// 4. LOAD & SPEAK QUESTION
function loadQuestion(index) {
  if (index >= questionsList.length) {
    finalizeInterview();
    return;
  }

  const q = questionsList[index];
  document.getElementById("questionProgressText").innerText = `Question ${index + 1} of ${questionsList.length}`;
  document.getElementById("questionTypeBadge").innerText = (q.type || "technical").toUpperCase();
  document.getElementById("currentQuestionText").innerText = q.question_text || q.question;
  document.getElementById("liveTranscript").innerText = "Click 'Start Answer' to speak your response...";

  // Reset answer controls
  isRecordingAnswer = false;
  currentTranscript = "";
  const answerBtn = document.getElementById("answerBtn");
  answerBtn.classList.remove("recording");
  document.getElementById("answerBtnText").innerText = "Start Answer";
  document.getElementById("recordingIndicator").style.display = "none";

  // AI Voice TTS
  speakText(q.question_text || q.question);
}

function speakText(text) {
  if (!speechSynth) return;

  // Cancel any ongoing speech
  speechSynth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const aiStatusDot = document.getElementById("aiStatusDot");
  const aiStatusText = document.getElementById("aiStatusText");
  const aiAvatarCircle = document.getElementById("aiAvatarCircle");

  utterance.onstart = () => {
    aiStatusDot.classList.add("active");
    aiStatusText.innerText = "AI Speaking...";
    aiAvatarCircle.classList.add("speaking");
  };

  utterance.onend = () => {
    aiStatusDot.classList.remove("active");
    aiStatusText.innerText = "AI Listening";
    aiAvatarCircle.classList.remove("speaking");
  };

  utterance.onerror = () => {
    aiStatusDot.classList.remove("active");
    aiStatusText.innerText = "AI Ready";
    aiAvatarCircle.classList.remove("speaking");
  };

  speechSynth.speak(utterance);
}

// 5. SPEECH RECOGNITION (STT) INITIALIZATION & CONTROLS
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Web SpeechRecognition is not supported in this browser. Enabling text fallback.");
    document.getElementById("manualTextFallback").classList.remove("hidden");
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = "en-US";

  speechRecognition.onresult = (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      currentTranscript += " " + finalTranscript;
    }

    const display = (currentTranscript + " " + interimTranscript).trim();
    document.getElementById("liveTranscript").innerText = display || "Listening to your response...";
    document.getElementById("manualAnswerInput").value = display;
  };

  speechRecognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      document.getElementById("manualTextFallback").classList.remove("hidden");
    }
  };

  speechRecognition.onend = () => {
    if (isRecordingAnswer) {
      // Auto restart if recording is still active
      try { speechRecognition.start(); } catch (e) {}
    }
  };
}

function toggleAnswerRecording() {
  if (!isRecordingAnswer) {
    startAnswerRecording();
  } else {
    stopAnswerRecordingAndSubmit();
  }
}

function startAnswerRecording() {
  isRecordingAnswer = true;
  answerStartTime = Date.now();
  currentTranscript = "";

  // Stop AI speech if still talking
  if (speechSynth) speechSynth.cancel();

  const answerBtn = document.getElementById("answerBtn");
  answerBtn.classList.add("recording");
  document.getElementById("answerBtnText").innerText = "Stop & Submit Answer";
  document.getElementById("recordingIndicator").style.display = "flex";

  if (speechRecognition) {
    try {
      speechRecognition.start();
    } catch (e) {
      console.warn("Speech recognition start issue:", e.message);
    }
  } else {
    document.getElementById("manualTextFallback").classList.remove("hidden");
  }
}

async function stopAnswerRecordingAndSubmit() {
  isRecordingAnswer = false;
  const answerDuration = Math.max(5, Math.round((Date.now() - (answerStartTime || Date.now())) / 1000));

  const answerBtn = document.getElementById("answerBtn");
  answerBtn.classList.remove("recording");
  document.getElementById("answerBtnText").innerText = "Processing Answer...";
  document.getElementById("recordingIndicator").style.display = "none";

  if (speechRecognition) {
    try { speechRecognition.stop(); } catch (e) {}
  }

  // Get final transcript text
  const finalTranscript = currentTranscript.trim() || document.getElementById("manualAnswerInput").value.trim();

  const currentQ = questionsList[currentQuestionIndex];

  document.getElementById("liveTranscript").innerText = "Evaluating response with AI...";

  try {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const res = await fetch(`/api/interviews/${activeSession.interviewId}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user.email || "guest@prepai.ai"
      },
      body: JSON.stringify({
        questionId: currentQ.id,
        transcript: finalTranscript,
        durationSeconds: answerDuration
      })
    });

    const data = await res.json();

    if (data.success) {
      const evalData = data.data;

      // Handle dynamic follow-up question if added by backend AI engine
      if (evalData.followUpAdded && evalData.nextQuestion) {
        // Refresh questions list to include follow-up
        const sessionRes = await fetch(`/api/interviews/${activeSession.interviewId}`, {
          headers: { "x-user-email": user.email || "guest@prepai.ai" }
        });
        const sessionData = await sessionRes.json();
        if (sessionData.success) {
          questionsList = sessionData.data.questions;
        }
      }

      currentQuestionIndex++;
      if (currentQuestionIndex < questionsList.length) {
        loadQuestion(currentQuestionIndex);
      } else {
        finalizeInterview();
      }
    } else {
      showNotification(data.message || "Error evaluating answer.");
    }
  } catch (err) {
    console.error("Error submitting answer:", err);
    showNotification("Network error submitting answer. Proceeding to next question.");
    currentQuestionIndex++;
    if (currentQuestionIndex < questionsList.length) {
      loadQuestion(currentQuestionIndex);
    } else {
      finalizeInterview();
    }
  }
}

function submitTextAnswerDirect() {
  if (isRecordingAnswer) {
    stopAnswerRecordingAndSubmit();
  } else {
    currentTranscript = document.getElementById("manualAnswerInput").value;
    stopAnswerRecordingAndSubmit();
  }
}

// Media Controls Toggle
function toggleMicrophone() {
  if (!mediaStream) return;
  const audioTrack = mediaStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    isMicMuted = !audioTrack.enabled;
    const btn = document.getElementById("toggleMicBtn");
    btn.classList.toggle("off", isMicMuted);
    btn.innerText = isMicMuted ? "🔇" : "🎙️";
  }
}

function toggleCamera() {
  if (!mediaStream) return;
  const videoTrack = mediaStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    isCamOff = !videoTrack.enabled;
    const btn = document.getElementById("toggleCamBtn");
    btn.classList.toggle("off", isCamOff);
    btn.innerText = isCamOff ? "🚫" : "📷";
  }
}

function endInterviewEarly() {
  if (confirm("Are you sure you want to end the interview early and generate your evaluation report?")) {
    finalizeInterview();
  }
}

// 6. FINALIZE INTERVIEW & SHOW RESULTS
async function finalizeInterview() {
  clearInterval(timerInterval);
  if (speechSynth) speechSynth.cancel();

  interviewSection.classList.add("hidden");
  resultsSection.classList.remove("hidden");

  try {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const res = await fetch(`/api/interviews/${activeSession.interviewId}/end`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user.email || "guest@prepai.ai"
      }
    });
    const data = await res.json();

    if (data.success) {
      renderInterviewResults(data.data);
      updateUserCareerReadinessAndProfile(data.data);
    } else {
      showNotification("Failed to fetch interview final results.");
    }
  } catch (err) {
    console.error("Error finalizing interview session:", err);
    showNotification("Error completing interview report generation.");
  }
}

function renderInterviewResults(report) {
  document.getElementById("resOverallScore").innerText = report.overallScore || 75;
  document.getElementById("scoreCircle").style.setProperty("--score-pct", `${report.overallScore || 75}%`);
  document.getElementById("resSummaryText").innerText = report.summary || "Interview session completed.";

  document.getElementById("resTechScore").innerText = report.technicalScore || 75;
  document.getElementById("resCommScore").innerText = report.communicationScore || 80;
  document.getElementById("resProbScore").innerText = report.problemSolvingScore || 75;
  document.getElementById("resRelScore").innerText = report.relevanceScore || 80;
  document.getElementById("resConfScore").innerText = report.confidenceScore || 78;

  // Strengths
  const strengthsContainer = document.getElementById("resStrengthsList");
  strengthsContainer.innerHTML = "";
  (report.strengths || []).forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `<span>✔</span> ${s}`;
    strengthsContainer.appendChild(li);
  });

  // Weaknesses
  const weaknessesContainer = document.getElementById("resWeaknessesList");
  weaknessesContainer.innerHTML = "";
  (report.weaknesses || []).forEach(w => {
    const li = document.createElement("li");
    li.innerHTML = `<span>⚠️</span> ${w}`;
    weaknessesContainer.appendChild(li);
  });

  // Recommendations
  const recsContainer = document.getElementById("resRecommendationsList");
  recsContainer.innerHTML = "";
  (report.recommendations || []).forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `<span>📌</span> ${r}`;
    recsContainer.appendChild(li);
  });

  // Topics
  const topicsCloud = document.getElementById("resTopicsCloud");
  topicsCloud.innerHTML = "";
  (report.topicsToImprove || []).forEach(t => {
    const tag = document.createElement("span");
    tag.className = "rec-tag";
    tag.innerText = t;
    topicsCloud.appendChild(tag);
  });
}

// Synchronize interview performance with user localStorage for Dashboard & Profile
function updateUserCareerReadinessAndProfile(report) {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  user.lastInterviewScore = report.overallScore;
  user.lastInterviewDate = new Date().toLocaleDateString();

  if (!user.interviewHistory) {
    user.interviewHistory = [];
  }

  user.interviewHistory.unshift({
    role: activeSession.targetRole,
    score: report.overallScore,
    date: new Date().toLocaleDateString()
  });

  localStorage.setItem("user", JSON.stringify(user));
}

function resetInterviewSession() {
  resultsSection.classList.add("hidden");
  setupSection.classList.remove("hidden");
}