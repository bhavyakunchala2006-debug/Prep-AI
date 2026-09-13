// Project Guidance Logic powered by unified PrepAI recommendations.js engine

let projectDatabase = [];

fetch("projects.json")
  .then(res => res.json())
  .then(data => {
    projectDatabase = data;
    showRecommended();
  })
  .catch(err => {
    console.error("Error loading projects.json:", err);
  });

function showRecommended() {
  setActiveTab("tabRecommended");
  const user = getUserProfile();
  const container = document.getElementById("projectContainer");
  const subtitle = document.getElementById("projectSubtitle");

  if (!container) return;
  container.innerHTML = "";

  if (!user || !user.skills || user.skills.length === 0) {
    if (subtitle) subtitle.innerText = "No skills added to your profile yet.";
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding:30px; background:white; border-radius:14px; text-align:center; box-shadow:0 4px 14px rgba(0,0,0,0.05);">
        <h3 style="color:#6a5af9; margin-bottom:8px;">No Skills Added Yet</h3>
        <p style="color:#666; font-size:14px; margin-bottom:16px;">Add skills to your profile to receive personalized project recommendations!</p>
        <button class="start-btn" onclick="window.location.href='viewProfile.html'">Go to Profile →</button>
      </div>
    `;
    return;
  }

  const formattedSkillsList = user.skills.map(s => formatSkillName(s)).join(", ");
  if (subtitle) subtitle.innerText = `Curated projects matching your skills: ${formattedSkillsList}`;

  const matchedProjects = getSkillRecommendedProjects(user.skills, projectDatabase);

  if (matchedProjects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding:30px; background:white; border-radius:14px; text-align:center; box-shadow:0 4px 14px rgba(0,0,0,0.05);">
        <h3 style="color:#2d3748; margin-bottom:8px;">No Matching Projects Found</h3>
        <p style="color:#718096; font-size:14px; margin-bottom:16px;">No projects match your current skills yet. Add more skills to your profile or explore all projects.</p>
        <button class="start-btn" onclick="showAll()">Explore All Projects</button>
      </div>
    `;
    return;
  }

  matchedProjects.forEach(p => {
    const card = document.createElement("div");
    card.className = "project-card";

    const isPerfect = p.missingSkills.length === 0;
    const badgeText = isPerfect ? "Perfect Match" : "Recommended";

    const matchingTags = p.matchingSkills.map(s => `<span class="tech">${s}</span>`).join(" ");
    const missingTags = p.missingSkills.length > 0 
      ? p.missingSkills.map(s => `<span class="tech" style="background:#fff0f0; color:#e53e3e;">${s}</span>`).join(" ")
      : `<span style="font-size:12px; color:#38a169;">None ✓</span>`;

    card.innerHTML = `
      <div class="card-top" style="display:flex; justify-content:space-between; align-items:center;">
        <span class="project-badge">${badgeText}</span>
        <span class="level" style="font-weight:bold; color:#6a5af9;">${p.matchPct}% Skill Match</span>
      </div>

      <h3 class="project-title" style="margin-top:10px;">${p.title}</h3>
      <p class="project-desc" style="font-size:13px; color:#666; margin-bottom:12px;">Difficulty Level: <strong>${p.level}</strong></p>

      <div style="margin-bottom:10px;">
        <div style="font-size:12px; font-weight:600; color:#4a5568; margin-bottom:4px;">Matching Skills (From Profile):</div>
        <div class="tech-stack">${matchingTags}</div>
      </div>

      <div style="margin-bottom:14px;">
        <div style="font-size:12px; font-weight:600; color:#4a5568; margin-bottom:4px;">Missing Skills (Required):</div>
        <div class="tech-stack">${missingTags}</div>
      </div>

      <div class="project-footer">
        <button class="start-btn" onclick="startProjectPrompt('${p.title}')">Start Project</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function showAll() {
  setActiveTab("tabAll");
  const container = document.getElementById("projectContainer");
  const subtitle = document.getElementById("projectSubtitle");

  if (subtitle) subtitle.innerText = "Exploring all available projects in the database.";
  if (!container) return;
  container.innerHTML = "";

  projectDatabase.forEach(p => {
    const card = document.createElement("div");
    card.className = "project-card";

    const allSkillsTags = (p.skills || []).map(s => `<span class="tech">${formatSkillName(s)}</span>`).join(" ");

    card.innerHTML = `
      <div class="card-top" style="display:flex; justify-content:space-between; align-items:center;">
        <span class="badge" style="background:#edf2f7; color:#4a5568;">Project</span>
        <span class="level">${p.level}</span>
      </div>

      <h3 class="project-title" style="margin-top:10px;">${p.title}</h3>
      
      <div style="margin-top:10px; margin-bottom:14px;">
        <div style="font-size:12px; font-weight:600; color:#4a5568; margin-bottom:4px;">Required Skills:</div>
        <div class="tech-stack">${allSkillsTags}</div>
      </div>

      <div class="project-footer">
        <button class="start-btn" onclick="startProjectPrompt('${p.title}')">Start Project</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function setActiveTab(tabId) {
  const btnRec = document.getElementById("tabRecommended");
  const btnAll = document.getElementById("tabAll");

  if (btnRec) btnRec.classList.remove("active");
  if (btnAll) btnAll.classList.remove("active");

  const activeBtn = document.getElementById(tabId);
  if (activeBtn) activeBtn.classList.add("active");
}

function startProjectPrompt(title) {
  alert(`Starting Project Guidance Roadmap for "${title}"! Follow step-by-step guidance in your dashboard.`);
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}