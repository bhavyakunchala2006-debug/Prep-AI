// Internships page logic powered by unified PrepAI recommendations.js engine

let masterInternships = [];

fetch("internships.json")
  .then(res => res.json())
  .then(data => {
    masterInternships = data;
    renderInternships();
  })
  .catch(err => {
    console.error("Error loading internships.json:", err);
  });

document.addEventListener("DOMContentLoaded", () => {
  renderInternships();
});

function renderInternships() {
  const user = getUserProfile();
  const subtitle = document.getElementById("internshipSubtitle");
  const grid = document.getElementById("internshipGrid");

  if (!grid) return;

  if (!user || !user.skills || user.skills.length === 0) {
    if (subtitle) subtitle.innerText = "Add skills to your profile to get personalized internship recommendations.";
  } else {
    const formattedSkills = user.skills.map(s => formatSkillName(s)).join(", ");
    if (subtitle) subtitle.innerText = `Curated roles based on your ${formattedSkills} skills.`;
  }

  applyFilterAndSort();
}

function applyFilterAndSort() {
  const user = getUserProfile() || { skills: [], goal: "" };
  const grid = document.getElementById("internshipGrid");
  if (!grid || masterInternships.length === 0) return;

  grid.innerHTML = "";

  // 1. Calculate Match Score & Personalized Data
  let personalizedList = getPersonalizedInternships(user.skills, user.goal, masterInternships);

  // 2. Filter by Location
  const locFilter = document.getElementById("locationFilter") ? document.getElementById("locationFilter").value : "ALL";
  if (locFilter && locFilter !== "ALL") {
    personalizedList = personalizedList.filter(item => {
      const loc = (item.location || "").toLowerCase();
      const query = locFilter.toLowerCase();
      return loc.includes(query);
    });
  }

  // 3. Filter by Search Query
  const searchInput = document.getElementById("searchInput");
  const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : "";
  if (searchVal) {
    personalizedList = personalizedList.filter(item => {
      const text = `${item.title} ${item.company} ${item.location} ${(item.requiredSkills || []).join(" ")}`.toLowerCase();
      return text.includes(searchVal);
    });
  }

  // 4. Sort
  const sortSelect = document.getElementById("sortSelect");
  const sortVal = sortSelect ? sortSelect.value : "MATCH_DESC";

  if (sortVal === "MATCH_DESC") {
    personalizedList.sort((a, b) => b.matchScore - a.matchScore);
  } else if (sortVal === "MATCH_ASC") {
    personalizedList.sort((a, b) => a.matchScore - b.matchScore);
  } else if (sortVal === "TITLE_ASC") {
    personalizedList.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (personalizedList.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding:35px; background:white; border-radius:14px; text-align:center; box-shadow:0 4px 14px rgba(0,0,0,0.05);">
        <h3 style="color:#2d3748; margin-bottom:8px;">No Internships Match Your Filter</h3>
        <p style="color:#718096; font-size:14px; margin-bottom:16px;">Try adjusting your location filter or search query.</p>
        <button class="apply" style="width:auto; padding:8px 20px;" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  personalizedList.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    // Match percentage badge color
    let matchClass = "";
    if (item.matchScore >= 80) matchClass = "green";
    else if (item.matchScore >= 50) matchClass = "";
    else matchClass = "";

    const matchingTags = item.matchingSkills.length > 0 
      ? item.matchingSkills.map(s => `<span>${s}</span>`).join(" ")
      : `<span style="background:#f7fafc; color:#a0aec0; border:1px solid #e2e8f0;">None</span>`;

    const missingTags = item.missingSkills.length > 0 
      ? item.missingSkills.map(s => `<span>${s}</span>`).join(" ")
      : `<span style="background:#f0fff4; color:#38a169; border:1px solid #c6f6d5;">None ✓</span>`;

    card.innerHTML = `
      <div class="card-header">
        <h3>${item.title}</h3>
        <span class="match ${matchClass}">${item.matchScore}% Match</span>
      </div>

      <p class="company">${item.company}</p>
      <p class="details">📍 ${item.location} • ${item.type} • 💰 ${item.stipend}</p>

      <div class="skills">
        <p>Matching Skills (From Profile)</p>
        ${matchingTags}
      </div>

      <div class="missing">
        <p>Missing Skills (Required)</p>
        ${missingTags}
      </div>

      <button class="apply" onclick="applyInternship('${item.title}', '${item.company}')">Apply Now</button>
    `;

    grid.appendChild(card);
  });
}

function resetFilters() {
  if (document.getElementById("locationFilter")) document.getElementById("locationFilter").value = "ALL";
  if (document.getElementById("sortSelect")) document.getElementById("sortSelect").value = "MATCH_DESC";
  if (document.getElementById("searchInput")) document.getElementById("searchInput").value = "";
  applyFilterAndSort();
}

function applyInternship(title, company) {
  alert(`Application Submitted for "${title}" at ${company}!`);
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}