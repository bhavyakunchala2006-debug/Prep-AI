let projectDatabase = [];

fetch("projects.json")
.then(res => res.json())
.then(data => {
projectDatabase = data;
displayProjects();
});


let user = JSON.parse(localStorage.getItem("user"));

let userSkills = (user.skills || []).map(s => s.toLowerCase());


function getRecommendedProjects(){

return projectDatabase.filter(project =>
project.skills.some(skill => userSkills.includes(skill))
);

}


window.onload=function(){

let user=JSON.parse(localStorage.getItem("user"));
updateCareerReadiness(); 

if(!user){ 
window.location.href="index.html";
return;
}

 /* Welcome name */
  document.getElementById("welcomeName").innerText = user.name;

  /* Profile section (top right) */
  document.getElementById("profileName").innerText = user.name;
  document.getElementById("profileBranch").innerText = user.branch;

  /* Avatar letter */
  document.getElementById("avatar").innerText =
    user.name.charAt(0).toUpperCase();
    
document.getElementById("welcomeName").innerText=user.name;

/* Career Goal */

document.getElementById("goal").innerText=user.goal || "Not set";

/* Skills */

let skills=user.skills || [];

let container=document.getElementById("skills");

skills.forEach(skill=>{
let tag=document.createElement("div");
tag.className="skill";
tag.innerText=skill;
container.appendChild(tag);
});

/* Career Readiness */

let score=Math.min(skills.length*20,100);

document.getElementById("scoreText").innerText=score+"% Ready";

document.getElementById("progress").style.width=score+"%";

function updateCareerReadiness(){

let score = calculateReadiness();

document.getElementById("progress").style.width = score + "%";

document.getElementById("scoreText").innerText =
score + "% Ready";

}

/* Recommended Projects */

let projectContainer=document.getElementById("projectList");

let projects=[];

skills.forEach(skill=>{

skill=skill.toLowerCase();

if(skill.includes("python")){
projects.push("Build a Data Analysis Tool using Python");
}


if(skill.includes("html")){
projects.push("Personal Portfolio Website");
}

});


projects.forEach(p=>{
let div=document.createElement("div");
div.className="project-item";
div.innerText=p;
projectContainer.appendChild(div);
});


/* Learning Resources */

let resourceContainer=document.getElementById("resourceList");

let goal=(user.goal || "").toLowerCase();

let resources=[];

if(goal.includes("ai") || goal.includes("machine")){
resources=[
"Machine Learning by Andrew Ng",
"DeepLearning.ai Specialization",
"Linear Algebra for ML"
];
}

else if(goal.includes("web")){
resources=[
"Frontend Developer Roadmap",
"JavaScript Mastery",
"React Full Course"
];
}

else{
resources=[
"Programming Fundamentals",
"Git & GitHub Guide",
"Problem Solving Practice"
];
}

resources.forEach(r=>{
let div=document.createElement("div");
div.className="resource-item";
div.innerText=r;
resourceContainer.appendChild(div);
});

}


function goToProfile(){
window.location.href="viewProfile.html";
}

function logout(){
window.location.href="index.html";
}

const learning = [
{
tag:"Math",
title:"Linear Algebra for ML",
desc:"Required for Machine Learning Engineer goal"
},
{
tag:"Core Concept",
title:"Machine Learning Basics",
desc:"Next step after Python & NumPy"
},
{
tag:"Library",
title:"Scikit-learn Tutorials",
desc:"Learn ML models implementation"
}
];

const learningContainer=document.getElementById("learningList");

learning.forEach(l=>{
const card=document.createElement("div");

card.className="learning-card";

card.innerHTML=`
<div class="learning-info">
<span class="learning-tag">${l.tag}</span>
<div class="learning-title">${l.title}</div>
<div class="learning-desc">${l.desc}</div>
</div>

<div class="arrow">→</div>
`;

learningContainer.appendChild(card);
});

const projects = [

{
badge:"Perfect Match",
title:"Movie Recommendation System",
desc:"Apply your Python and NumPy skills to build a collaborative filtering engine.",
tech:["Py","Np"]
},

{
badge:"Recommended",
title:"Spam Email Classifier",
desc:"Introduction to NLP using Scikit-learn.",
tech:["Python","NLP"]
},

{
badge:"Recommended",
title:"Library Management System",
desc:"Build a system to manage book records, issue tracking, and returns.",
tech:["Java","SQL"]
},

{
badge:"Recommended",
title:"Algorithm Visualizer Tool",
desc:"Visualize sorting and graph algorithms interactively.",
tech:["JavaScript","DSA"]
}

];

const projectContainer=document.getElementById("projectList");

projects.forEach(p=>{

const card=document.createElement("div");
card.className="project-card";

card.innerHTML=`
<span class="project-badge">${p.badge}</span>

<div class="project-title">${p.title}</div>
<div class="project-desc">${p.desc}</div>

<div class="project-footer">

<div class="tech-stack">
${p.tech.map(t=>`<span class="tech">${t}</span>`).join("")}
</div>

<button class="start-btn">Start Project</button>

</div>
`;

projectContainer.appendChild(card);

});



function displayProjects(){

let container = document.getElementById("projectList");

let projects = getRecommendedProjects();

card.innerHTML = `

<span class="project-badge">Recommended</span>

<div class="project-title">
${p.title}
</div>

<div class="project-desc">
Build a project using ${p.skills.join(", ")}.
</div>

<div class="project-footer">

<div class="tech-stack">
${p.skills.map(s=>`<span class="tech">${s}</span>`).join("")}
</div>

<button class="start-btn">
Start Project
</button>

</div>

`;

projects.forEach(p=>{

let card=document.createElement("div");

card.className="project-card";

card.innerHTML=`
<h3>${p.title}</h3>
<span class="badge">${p.level}</span>
`;

container.appendChild(card);

});

}

function calculateReadiness(){

let user = JSON.parse(localStorage.getItem("user"));

let skills = user.skills || [];
let concepts = user.concepts || [];

/* scoring */

let skillScore = Math.min(skills.length * 10, 60);
let conceptScore = Math.min(concepts.length * 8, 40);

let totalScore = skillScore + conceptScore;

return totalScore;

}

