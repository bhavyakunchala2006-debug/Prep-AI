let projectDatabase = [];

fetch("projects.json")
.then(res => res.json())
.then(data => {
projectDatabase = data;
showRecommended();
});

let user = JSON.parse(localStorage.getItem("user"));

let userSkills = (user.skills || []).map(s => s.toLowerCase());


function getRecommendedProjects(){

return projectDatabase.filter(project =>
project.skills.some(skill => userSkills.includes(skill))
);

}


/* PROJECT DATABASE */

const projects = [

{
title:"Movie Recommendation System",
level:"Intermediate",
skills:["python"],
stack:["Python","Pandas","Scikit-learn"],
concepts:["Cosine Similarity","Matrix Factorization","Data Cleaning"]
},

{
title:"Spam Email Classifier",
level:"Beginner",
skills:["python"],
stack:["Python","NLTK","Scikit-learn"],
concepts:["TF-IDF","Naive Bayes","Model Evaluation"]
},

{
title:"Student Database Manager",
level:"Beginner",
skills:["sql"],
stack:["SQL","Java"],
concepts:["Database Design","CRUD Operations"]
},

{
title:"Portfolio Website",
level:"Beginner",
skills:["html","css"],
stack:["HTML","CSS","React"],
concepts:["Responsive Design","Frontend Development"]
}

];



/* RENDER PROJECT CARD */

function renderProject(project,badge){

let stack = project.stack
.map(s => `<span class="tech">${s}</span>`)
.join("");

let concepts = project.concepts
.map(c => `<li>${c}</li>`)
.join("");

return `

<div class="project-card">

<div class="card-top">

<span class="badge">${badge}</span>

<span class="level">${project.level}</span>

</div>

<h3 class="project-title">${project.title}</h3>

<div class="stack">${stack}</div>

<ul class="concepts">
${concepts}
</ul>

<button class="roadmap">
View Step-by-Step Roadmap
</button>

</div>

`;

}



/* SHOW RECOMMENDED PROJECTS */
function showRecommended(){

let container = document.getElementById("projectContainer");

let projects = getRecommendedProjects();

container.innerHTML="";

projects.forEach(p=>{

let card=document.createElement("div");

card.className="project-card";

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
${p.skills.map(skill => `<span class="tech">${skill}</span>`).join("")}
</div>

<button class="start-btn">
Start Project
</button>

</div>

`;

container.appendChild(card);

});

}



/* SHOW ALL PROJECTS */

function showAll(){

let container = document.getElementById("projectContainer");

container.innerHTML="";

projectDatabase.forEach(p=>{

let card=document.createElement("div");

card.className="project-card";

card.innerHTML=`

<div class="badge">Project</div>

<h3>${p.title}</h3>

<p>Level: ${p.level}</p>

<button class="start-btn">Start Project</button>

`;

container.appendChild(card);

});

}



/* INITIAL LOAD */

document.addEventListener("DOMContentLoaded",()=>{

showRecommended();

/* TAB SWITCH */

const tabs = document.querySelectorAll(".tabs button");

tabs.forEach(btn=>{

btn.addEventListener("click",function(){

tabs.forEach(b=>b.classList.remove("active"));

this.classList.add("active");

});

});

});

function logout(){
window.location.href="index.html";
}