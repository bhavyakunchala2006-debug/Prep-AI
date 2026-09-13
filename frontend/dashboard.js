// Dashboard logic powered by unified PrepAI recommendations.js engine

let projectDatabase = [];

// Fetch master projects dataset
fetch("projects.json")
  .then(res => res.json())
  .then(data => {
    projectDatabase = data;
    renderDashboardComponents();
  })
  .catch(err => {
    console.error("Error loading projects database:", err);
  });

window.onload = function() {
  const user = getUserProfile();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  renderUserProfileHeader(user);
  renderDashboardComponents();
};

function renderUserProfileHeader(user) {
  if (!user) return;

  // Header & avatar
  const welcomeName = document.getElementById("welcomeName");
  const profileName = document.getElementById("profileName");
  const profileBranch = document.getElementById("profileBranch");
  const avatar = document.getElementById("avatar");

  if (welcomeName) welcomeName.innerText = user.name;
  if (profileName) profileName.innerText = user.name;
  if (profileBranch) profileBranch.innerText = user.branch || "Student";
  if (avatar) avatar.innerText = user.name.charAt(0).toUpperCase();

  // Career Goal
  const goalElem = document.getElementById("goal");
  if (goalElem) goalElem.innerText = user.goal || "Not set";

  // Skills
  const skillsContainer = document.getElementById("skills");
  if (skillsContainer) {
    skillsContainer.innerHTML = "";
    if (user.skills.length === 0) {
      skillsContainer.innerHTML = `<span style="font-size:13px; color:#888;">No skills added yet. Add skills in Profile!</span>`;
    } else {
      user.skills.forEach(skill => {
        const tag = document.createElement("div");
        tag.className = "skill";
        tag.innerText = formatSkillName(skill);
        skillsContainer.appendChild(tag);
      });
    }
  }

  // Career Readiness Score
  updateCareerReadiness(user);
}

function updateCareerReadiness(user) {
  if (!user) return;

  const readiness = calculateReadiness(user);
  const totalScore = readiness.total;
  const breakdown = readiness.breakdown;

  const scoreText = document.getElementById("scoreText");
  const progress = document.getElementById("progress");
  const breakdownElem = document.getElementById("readinessBreakdown");

  if (scoreText) scoreText.innerText = totalScore + "% Ready";
  if (progress) progress.style.width = totalScore + "%";

  if (breakdownElem) {
    breakdownElem.innerHTML = `
      <div style="font-size:11px; color:#666; margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
        <span>Goal: <strong>${breakdown.goal}/10</strong></span>
        <span>Skills: <strong>${breakdown.skills}/30</strong></span>
        <span>Concepts: <strong>${breakdown.concepts}/20</strong></span>
        <span>Projects: <strong>${breakdown.projects}/15</strong></span>
        <span>Interview: <strong>${breakdown.interview}/25</strong></span>
      </div>
    `;
  }
}

function renderDashboardComponents() {
  const user = getUserProfile();
  if (!user) return;

  // 1. RECOMMENDED PROJECTS (Driven strictly by USER'S CURRENT SKILLS)
  const projectContainer = document.getElementById("projectList");
  if (projectContainer && projectDatabase.length > 0) {
    projectContainer.innerHTML = "";

    const matchedProjects = getSkillRecommendedProjects(user.skills, projectDatabase);

    if (matchedProjects.length === 0) {
      projectContainer.innerHTML = `
        <div style="padding:16px; background:#f8f9fe; border-radius:10px; font-size:13px; color:#666;">
          No projects match your current skills yet. Add more skills in your Profile to unlock tailored project recommendations!
        </div>
      `;
    } else {
      // Display top 3 matched projects
      matchedProjects.slice(0, 3).forEach(p => {
        const card = document.createElement("div");
        card.className = "project-card";

        const matchingBadges = p.matchingSkills.map(s => `<span class="tech">${s}</span>`).join(" ");
        const missingBadges = p.missingSkills.length > 0 
          ? `<div style="font-size:11px; color:#888; margin-top:4px;">Missing: ${p.missingSkills.map(s => `<span style="background:#fff0f0; color:#e53e3e; padding:2px 6px; border-radius:6px;">${s}</span>`).join(" ")}</div>`
          : "";

        card.innerHTML = `
          <div style="display:flex; justify-size:space-between; align-items:center;">
            <span class="project-badge">Skill Match</span>
            <span style="font-size:12px; font-weight:bold; color:#6a5af9;">${p.matchPct}% Match</span>
          </div>

          <div class="project-title" style="margin-top:6px;">${p.title}</div>
          <div class="project-desc">Requires: ${p.skills.map(s => formatSkillName(s)).join(", ")}</div>

          <div class="project-footer" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <div class="tech-stack" style="flex-wrap:wrap;">
              <span style="font-size:11px; color:#666; font-weight:bold; margin-right:4px;">Matching:</span>
              ${matchingBadges}
            </div>
            ${missingBadges}
            <button class="start-btn" style="margin-top:4px;" onclick="window.location.href='projects.html'">Start Project</button>
          </div>
        `;

        projectContainer.appendChild(card);
      });
    }
  }

  // 2. LEARNING RECOMMENDATIONS (Driven strictly by USER'S CAREER GOAL)
  const learningContainer = document.getElementById("learningList");
  if (learningContainer) {
    learningContainer.innerHTML = "";

    const learningData = getGoalLearningRecommendations(user.goal);

    if (!learningData.hasGoal) {
      learningContainer.innerHTML = `
        <div style="padding:16px; background:#fff5f5; border:1px solid #feb2b2; border-radius:10px; font-size:13px; color:#c53030;">
          📌 ${learningData.message}
        </div>
      `;
    } else {
      learningData.resources.forEach(l => {
        const card = document.createElement("div");
        card.className = "learning-card";

        card.innerHTML = `
          <div class="learning-info">
            <span class="learning-tag">${l.tag}</span>
            <div class="learning-title">${l.title}</div>
            <div class="learning-desc">${l.desc}</div>
          </div>
          <div class="arrow">→</div>
        `;

        learningContainer.appendChild(card);
      });
    }
  }
}

function goToProfile() {
  window.location.href = "viewProfile.html";
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
