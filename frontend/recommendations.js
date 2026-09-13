/**
 * PrepAI Unified Personalization & Recommendation Engine
 * 
 * CORE SEPARATION RULES:
 * 1. USER CAREER GOAL -> LEARNING RECOMMENDATIONS
 * 2. USER CURRENT SKILLS -> PROJECT GUIDANCE
 * 3. USER CURRENT SKILLS + CAREER GOAL -> INTERNSHIP RECOMMENDATIONS
 * 4. CAREER READINESS -> CENTRALIZED DETERMINISTIC FORMULA (100% MAX)
 */

// Skill Normalization Dictionary & Display Formatting
const SKILL_ALIASES = {
  "js": "javascript",
  "javascript": "javascript",
  "py": "python",
  "python": "python",
  "java": "java",
  "html": "html",
  "html5": "html",
  "css": "css",
  "css3": "css",
  "react": "react",
  "reactjs": "react",
  "node": "node.js",
  "nodejs": "node.js",
  "node.js": "node.js",
  "express": "express",
  "sql": "sql",
  "mysql": "sql",
  "postgresql": "sql",
  "sqlite": "sql",
  "mongo": "mongodb",
  "mongodb": "mongodb",
  "dsa": "dsa",
  "data structures": "dsa",
  "algorithms": "dsa",
  "ml": "machine learning",
  "machine learning": "machine learning",
  "ai": "ai",
  "artificial intelligence": "ai",
  "data science": "data science",
  "android": "android",
  "cloud": "cloud",
  "aws": "cloud",
  "cybersecurity": "cybersecurity",
  "security": "cybersecurity",
  "git": "git",
  "github": "git",
  "pandas": "pandas",
  "numpy": "numpy",
  "scikit-learn": "scikit-learn",
  "nltk": "nlp",
  "nlp": "nlp",
  "testing": "testing"
};

const SKILL_DISPLAY_NAMES = {
  "javascript": "JavaScript",
  "python": "Python",
  "java": "Java",
  "html": "HTML",
  "css": "CSS",
  "react": "React",
  "node.js": "Node.js",
  "express": "Express",
  "sql": "SQL",
  "mongodb": "MongoDB",
  "dsa": "DSA",
  "machine learning": "Machine Learning",
  "ai": "AI",
  "data science": "Data Science",
  "android": "Android",
  "cloud": "Cloud",
  "cybersecurity": "Cybersecurity",
  "git": "Git",
  "pandas": "Pandas",
  "numpy": "NumPy",
  "scikit-learn": "Scikit-learn",
  "nlp": "NLP",
  "testing": "Testing"
};

function normalizeSkillKey(rawSkill) {
  if (!rawSkill) return "";
  const cleaned = String(rawSkill).trim().toLowerCase();
  return SKILL_ALIASES[cleaned] || cleaned;
}

function formatSkillName(rawSkill) {
  const key = normalizeSkillKey(rawSkill);
  return SKILL_DISPLAY_NAMES[key] || (rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1));
}

function getUserProfile() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || "Student",
      email: parsed.email || "",
      branch: parsed.branch || "Computer Science",
      goal: (parsed.goal || "").trim(),
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
      completedProjects: Array.isArray(parsed.completedProjects) ? parsed.completedProjects : [],
      bio: parsed.bio || "",
      lastInterviewScore: parsed.lastInterviewScore || null
    };
  } catch (e) {
    console.error("Error reading user profile from localStorage:", e);
    return null;
  }
}

/**
 * 1. PROJECT GUIDANCE RECOMMENDATION ENGINE
 * Driven strictly by USER'S CURRENT SKILLS
 */
function getSkillRecommendedProjects(userSkillsRaw, projectDatabase) {
  if (!userSkillsRaw || userSkillsRaw.length === 0 || !projectDatabase || projectDatabase.length === 0) {
    return [];
  }

  const userSkillKeys = new Set(userSkillsRaw.map(normalizeSkillKey).filter(Boolean));

  const scoredProjects = projectDatabase.map(project => {
    const reqSkillsRaw = Array.isArray(project.skills) ? project.skills : [];
    const matchingSkills = [];
    const missingSkills = [];

    reqSkillsRaw.forEach(req => {
      const key = normalizeSkillKey(req);
      if (userSkillKeys.has(key)) {
        matchingSkills.push(formatSkillName(req));
      } else {
        missingSkills.push(formatSkillName(req));
      }
    });

    const matchCount = matchingSkills.length;
    const totalReq = reqSkillsRaw.length || 1;
    const matchPct = Math.round((matchCount / totalReq) * 100);

    return {
      ...project,
      matchingSkills,
      missingSkills,
      matchCount,
      matchPct
    };
  });

  // Filter projects to only those with at least 1 matching skill
  const matchingProjects = scoredProjects.filter(p => p.matchCount > 0);

  // Rank by matchCount descending, then matchPct descending
  matchingProjects.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return b.matchPct - a.matchPct;
  });

  return matchingProjects;
}

/**
 * 2. LEARNING RECOMMENDATIONS ENGINE
 * Driven strictly by USER'S CAREER GOAL
 */
function getGoalLearningRecommendations(careerGoal) {
  const goal = (careerGoal || "").trim().toLowerCase();

  if (!goal) {
    return {
      hasGoal: false,
      message: "Set a career goal in your profile to get personalized learning recommendations.",
      resources: []
    };
  }

  let resources = [];

  if (goal.includes("machine learning") || goal.includes("ml") || goal.includes("data science") || goal.includes("ai")) {
    resources = [
      {
        tag: "Math & Fundamentals",
        title: "Linear Algebra & Calculus for ML",
        desc: "Essential mathematical foundations required for Machine Learning Engineer and Data Science roles."
      },
      {
        tag: "Core Concept",
        title: "Machine Learning Basics",
        desc: "Supervised and unsupervised learning concepts, regression, classification, and model evaluation."
      },
      {
        tag: "Library",
        title: "Scikit-Learn & Data Analysis",
        desc: "Hands-on implementation of ML algorithms, feature engineering, and model validation in Python."
      },
      {
        tag: "Advanced",
        title: "Deep Learning & Neural Networks",
        desc: "Introduction to PyTorch/TensorFlow, deep neural architectures, and computer vision fundamentals."
      }
    ];
  } else if (goal.includes("frontend") || goal.includes("web developer") && !goal.includes("backend")) {
    resources = [
      {
        tag: "Core Concept",
        title: "Modern JavaScript (ES6+)",
        desc: "Async/await, Promises, DOM manipulation, closures, and ES modules essential for Frontend Developers."
      },
      {
        tag: "UI Architecture",
        title: "React & Component State",
        desc: "Building interactive user interfaces using React hooks, context API, and component state management."
      },
      {
        tag: "Styling",
        title: "Responsive Web Layouts (CSS Grid & Flexbox)",
        desc: "Designing modern, fluid layouts across mobile, tablet, and desktop viewports."
      },
      {
        tag: "Performance",
        title: "Web Performance & Core Web Vitals",
        desc: "Optimizing render times, image delivery, and client-side page load speed."
      }
    ];
  } else if (goal.includes("backend")) {
    resources = [
      {
        tag: "Core Concept",
        title: "RESTful API Architecture",
        desc: "Designing scalable, stateless REST APIs, request validation, and HTTP status code standards."
      },
      {
        tag: "Database",
        title: "SQL & Database Schema Design",
        desc: "Relational database modeling, indexing, query optimization, and transaction management."
      },
      {
        tag: "Framework",
        title: "Node.js & Express / Java Spring Boot",
        desc: "Building robust, production-grade backend server microservices and middleware."
      },
      {
        tag: "System Design",
        title: "System Design & Caching Fundamentals",
        desc: "Caching strategies with Redis, load balancing, and scalable architecture design."
      }
    ];
  } else if (goal.includes("full stack") || goal.includes("fullstack")) {
    resources = [
      {
        tag: "Architecture",
        title: "Full Stack Web Roadmap",
        desc: "Integrating client-side React UI with server-side REST APIs and relational databases."
      },
      {
        tag: "Security",
        title: "JWT Authentication & Session Security",
        desc: "Implementing secure user authentication, password hashing, and token authorization."
      },
      {
        tag: "Database",
        title: "Relational SQL & NoSQL Modeling",
        desc: "Choosing between structured SQL and document-based NoSQL database models."
      },
      {
        tag: "DevOps",
        title: "Deployment & CI/CD Pipelines",
        desc: "Containerizing web applications with Docker and setting up automated deployment pipelines."
      }
    ];
  } else if (goal.includes("cybersecurity") || goal.includes("security")) {
    resources = [
      {
        tag: "Networking",
        title: "Network Security & Protocols",
        desc: "Understanding TCP/IP, DNS, SSL/TLS, firewalls, and packet inspection fundamentals."
      },
      {
        tag: "Web Security",
        title: "OWASP Top 10 Web Vulnerabilities",
        desc: "Identifying and mitigating SQL injection, XSS, CSRF, and broken authentication."
      },
      {
        tag: "Cryptography",
        title: "Applied Cryptography Fundamentals",
        desc: "Symmetric/asymmetric encryption, hashing algorithms, and digital signatures."
      }
    ];
  } else if (goal.includes("android") || goal.includes("mobile")) {
    resources = [
      {
        tag: "Language",
        title: "Java / Kotlin Fundamentals for Android",
        desc: "Core object-oriented programming concepts tailored for mobile application development."
      },
      {
        tag: "Mobile UI",
        title: "Android SDK & Jetpack Components",
        desc: "Building responsive mobile layouts using ViewHolders, RecyclerViews, and Navigation."
      },
      {
        tag: "Data",
        title: "Android SQLite & Room Database",
        desc: "Local data persistence, offline storage, and background thread synchronization."
      }
    ];
  } else if (goal.includes("cloud") || goal.includes("devops")) {
    resources = [
      {
        tag: "Cloud Fundamentals",
        title: "AWS & Cloud Infrastructure Basics",
        desc: "EC2 instances, S3 storage, IAM security roles, and cloud networking architecture."
      },
      {
        tag: "Containers",
        title: "Docker & Container Orchestration",
        desc: "Packaging microservices into lightweight, portable containers."
      },
      {
        tag: "CI/CD",
        title: "Automated Build & Deployment Pipelines",
        desc: "Setting up GitHub Actions and automated software testing pipelines."
      }
    ];
  } else {
    resources = [
      {
        tag: "Core Concept",
        title: "Data Structures & Algorithms (DSA)",
        desc: "Mastering arrays, linked lists, trees, graphs, sorting, and problem solving efficiency for " + careerGoal + "."
      },
      {
        tag: "Software Engineering",
        title: "Object-Oriented Programming & Clean Code",
        desc: "Designing modular, reusable code structures using clean architecture principles."
      },
      {
        tag: "Database",
        title: "SQL & Data Persistence",
        desc: "Writing relational database queries, table joins, and database design fundamentals."
      },
      {
        tag: "Tools",
        title: "Git Version Control & Collaboration",
        desc: "Managing code repositories, branching strategies, and pull requests on GitHub."
      }
    ];
  }

  return {
    hasGoal: true,
    message: `Personalized for your career goal: "${careerGoal}"`,
    resources
  };
}

/**
 * 3. INTERNSHIP RECOMMENDATIONS ENGINE
 * Driven by USER'S CURRENT SKILLS + CAREER GOAL (India-focused)
 */
function getPersonalizedInternships(userSkillsRaw, careerGoal, internshipsDb) {
  const userSkillKeys = new Set((userSkillsRaw || []).map(normalizeSkillKey).filter(Boolean));
  const goalLower = (careerGoal || "").trim().toLowerCase();

  const scoredInternships = (internshipsDb || []).map(item => {
    const reqSkillsRaw = Array.isArray(item.requiredSkills) ? item.requiredSkills : [];
    const matchingSkills = [];
    const missingSkills = [];

    reqSkillsRaw.forEach(req => {
      const key = normalizeSkillKey(req);
      if (userSkillKeys.has(key)) {
        matchingSkills.push(formatSkillName(req));
      } else {
        missingSkills.push(formatSkillName(req));
      }
    });

    const matchCount = matchingSkills.length;
    const totalReq = reqSkillsRaw.length || 1;

    const skillMatchScore = (matchCount / totalReq) * 85;
    const roleLower = (item.title || item.role || "").toLowerCase();
    const isGoalMatch = goalLower && (roleLower.includes(goalLower) || goalLower.includes(roleLower.split(" ")[0]));
    const goalBonus = isGoalMatch ? 15 : 0;

    let matchScore = 0;
    if (userSkillsRaw.length === 0) {
      matchScore = isGoalMatch ? 20 : 0;
    } else {
      matchScore = Math.min(100, Math.round(skillMatchScore + goalBonus));
    }

    return {
      ...item,
      matchingSkills,
      missingSkills,
      matchCount,
      matchScore
    };
  });

  scoredInternships.sort((a, b) => b.matchScore - a.matchScore);
  return scoredInternships;
}

/**
 * 4. CENTRALIZED CAREER READINESS CALCULATOR
 * 
 * Recommended Weighting (Total = 100%):
 * - Career Goal Alignment: 10%
 * - Skills: 30% (5 pts per normalized unique skill, max 30 pts)
 * - Core Concepts: 20% (4 pts per unique concept, max 20 pts)
 * - Projects / Practical Work: 15% (5 pts per completed project, max 15 pts)
 * - Mock Interview: 25% (25% * (lastInterviewScore / 100), 0 if no real interview)
 * 
 * Maximum Rule: Without a completed mock interview, max possible score is 75% (or 60% without completed projects).
 */
function calculateReadiness(user) {
  if (!user) {
    return {
      total: 0,
      breakdown: { goal: 0, skills: 0, concepts: 0, projects: 0, interview: 0 }
    };
  }

  // 1. Goal Alignment (10%)
  const hasGoal = user.goal && String(user.goal).trim().length > 0;
  const goalPts = hasGoal ? 10 : 0;

  // 2. Skills (30%) - Normalized unique skills
  const uniqueSkills = new Set((user.skills || []).map(normalizeSkillKey).filter(Boolean));
  const skillPts = Math.min(30, uniqueSkills.size * 5);

  // 3. Core Concepts (20%)
  const uniqueConcepts = new Set((user.concepts || []).map(c => String(c).trim().toLowerCase()).filter(Boolean));
  const conceptPts = Math.min(20, uniqueConcepts.size * 4);

  // 4. Projects (15%) - Uses completedProjects array if tracked
  const completedProjects = Array.isArray(user.completedProjects) ? user.completedProjects : [];
  const projectPts = Math.min(15, completedProjects.length * 5);

  // 5. Mock Interview (25%) - Only when real lastInterviewScore exists (> 0)
  const hasRealInterview = typeof user.lastInterviewScore === 'number' && user.lastInterviewScore > 0;
  const interviewPts = hasRealInterview ? Math.round((user.lastInterviewScore / 100) * 25) : 0;

  const total = Math.min(100, goalPts + skillPts + conceptPts + projectPts + interviewPts);

  return {
    total,
    breakdown: {
      goal: goalPts,
      skills: skillPts,
      concepts: conceptPts,
      projects: projectPts,
      interview: interviewPts
    }
  };
}

// Export for browser global usage or Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeSkillKey,
    formatSkillName,
    getUserProfile,
    getSkillRecommendedProjects,
    getGoalLearningRecommendations,
    getPersonalizedInternships,
    calculateReadiness
  };
}
