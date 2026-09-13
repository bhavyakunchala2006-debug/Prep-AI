const { calculateReadiness } = require('./recommendations.js');

console.log("=================================================");
console.log("RUNNING PREPAI CAREER READINESS TEST SUITE");
console.log("=================================================\n");

let passedCount = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] Test ${totalTests}: ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${message}`);
  }
}

// Test Case 1: New user with empty profile
const user1 = {
  goal: "",
  skills: [],
  concepts: [],
  completedProjects: [],
  lastInterviewScore: null
};
const res1 = calculateReadiness(user1);
assert(res1.total === 0, `Empty profile total score should be 0 (got ${res1.total}%)`);
assert(res1.breakdown.goal === 0 && res1.breakdown.skills === 0 && res1.breakdown.concepts === 0 && res1.breakdown.projects === 0 && res1.breakdown.interview === 0,
  `Empty profile breakdown should be all zeros: ${JSON.stringify(res1.breakdown)}`);

// Test Case 2: User with 5 skills, no interview
const user2 = {
  goal: "",
  skills: ["JavaScript", "Python", "HTML", "CSS", "React"],
  concepts: [],
  completedProjects: [],
  lastInterviewScore: null
};
const res2 = calculateReadiness(user2);
assert(res2.total === 25, `5 skills (5x5=25) with no interview should equal 25% (got ${res2.total}%)`);
assert(res2.breakdown.skills === 25, `Skills breakdown should be 25/30 (got ${res2.breakdown.skills})`);
assert(res2.breakdown.interview === 0, `Interview breakdown without score should be 0/25 (got ${res2.breakdown.interview})`);

// Test Case 3: User with goal, 5 skills, 3 concepts, no interview (Max 75% rule check)
const user3 = {
  goal: "Full Stack Developer",
  skills: ["js", "python", "html", "css", "react"],
  concepts: ["DOM", "Async/Await", "REST APIs"],
  completedProjects: [],
  lastInterviewScore: null
};
const res3 = calculateReadiness(user3);
// Goal: 10, Skills: 25, Concepts: 12, Projects: 0, Interview: 0 -> Total: 47%
assert(res3.total === 47, `Goal (10) + 5 skills (25) + 3 concepts (12) should equal 47% (got ${res3.total}%)`);
assert(res3.total <= 75, `Without mock interview, score must be <= 75% (got ${res3.total}%)`);

// Test Case 4: User with real interview score (80%)
const user4 = {
  goal: "Frontend Developer",
  skills: ["javascript", "react", "css"],
  concepts: ["DOM"],
  completedProjects: [1],
  lastInterviewScore: 80
};
const res4 = calculateReadiness(user4);
// Goal: 10, Skills: 15, Concepts: 4, Projects: 5, Interview: 20 (80% of 25) -> Total: 54%
assert(res4.breakdown.interview === 20, `Interview score 80% should give 20 pts (got ${res4.breakdown.interview})`);
assert(res4.total === 54, `Total score with interview should equal 54% (got ${res4.total}%)`);

// Test Case 5: User with high interview score (90%) and complete profile -> 100%
const user5 = {
  goal: "Machine Learning Engineer",
  skills: ["Python", "Machine Learning", "SQL", "Pandas", "NumPy", "Scikit-Learn"], // 6 skills = 30 pts
  concepts: ["Linear Algebra", "Regression", "Neural Networks", "Classification", "Feature Engineering"], // 5 concepts = 20 pts
  completedProjects: ["p1", "p2", "p3"], // 3 projects = 15 pts
  lastInterviewScore: 100 // 100% of 25 = 25 pts
};
const res5 = calculateReadiness(user5);
// Goal: 10 + Skills: 30 + Concepts: 20 + Projects: 15 + Interview: 25 = 100%
assert(res5.total === 100, `Fully maxed profile with 100% interview should reach 100% (got ${res5.total}%)`);

// Test Case 6: User with low interview score (40%)
const user6 = {
  goal: "Backend Developer",
  skills: ["Java", "Node.js", "Express", "SQL", "MongoDB", "Git"], // 6 skills = 30 pts
  concepts: ["REST APIs", "SQL Joins", "Authentication", "Caching", "Microservices"], // 5 concepts = 20 pts
  completedProjects: ["p1", "p2", "p3"], // 3 projects = 15 pts
  lastInterviewScore: 40 // 40% of 25 = 10 pts
};
const res6 = calculateReadiness(user6);
// Goal: 10 + Skills: 30 + Concepts: 20 + Projects: 15 + Interview: 10 = 85%
assert(res6.breakdown.interview === 10, `Interview score 40% should give 10 pts (got ${res6.breakdown.interview})`);
assert(res6.total === 85, `Profile with 40% interview score should equal 85% (got ${res6.total}%)`);

console.log("\n-------------------------------------------------");
console.log(`SUMMARY: ${passedCount}/${totalTests} tests passed.`);
console.log("-------------------------------------------------");

if (passedCount !== totalTests) {
  process.exit(1);
}
