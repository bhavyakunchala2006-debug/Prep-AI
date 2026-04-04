window.onload=function(){

let user=JSON.parse(localStorage.getItem("user"));

if(!user){
window.location.href="index.html";
return;
}

document.getElementById("name").innerText=user.name;
document.getElementById("branch").innerText=user.branch;

document.getElementById("topName").innerText=user.name;
document.getElementById("topBranch").innerText=user.branch;

document.getElementById("currentGoal").innerText=user.goal || "Not set";
let letter=user.name.charAt(0).toUpperCase();

document.getElementById("avatar").innerText=letter;
document.getElementById("topAvatar").innerText=letter;

displayTags("skills",user.skills || []);
displayTags("concepts",user.concepts || []);

document.getElementById("bio").value=user.bio || "";

}


/* DISPLAY TAGS */

function displayTags(id,list){

let container=document.getElementById(id);
container.innerHTML="";

list.forEach(item=>{

let div=document.createElement("div");
div.className="tag";

div.innerHTML=item+
` <button onclick="removeTag('${id}','${item}')">x</button>`;

container.appendChild(div);

});

}


/* ADD SKILL */

function addSkill(){

let user=JSON.parse(localStorage.getItem("user"));

let input=document.getElementById("skillInput");

if(!user.skills) user.skills=[];

user.skills.push(input.value);

localStorage.setItem("user",JSON.stringify(user));

displayTags("skills",user.skills);

input.value="";
}


/* ADD CONCEPT */

function addConcept(){

let user=JSON.parse(localStorage.getItem("user"));

let input=document.getElementById("conceptInput");

if(!user.concepts) user.concepts=[];

user.concepts.push(input.value);

localStorage.setItem("user",JSON.stringify(user));

displayTags("concepts",user.concepts);

input.value="";
}


/* REMOVE TAG */

function removeTag(type,value){

let user=JSON.parse(localStorage.getItem("user"));

user[type]=user[type].filter(v=>v!==value);

localStorage.setItem("user",JSON.stringify(user));

displayTags(type,user[type]);

}


function updateGoal(){

let user=JSON.parse(localStorage.getItem("user"));

let goalInput=document.getElementById("goalInput");

let goal=goalInput.value.trim();

if(goal==="") return;

user.goal=goal;

localStorage.setItem("user",JSON.stringify(user));

document.getElementById("currentGoal").innerText=goal;

goalInput.value="";

}

function saveProfile(){

let user = JSON.parse(localStorage.getItem("user")) || {};

/* Save Bio */
user.bio = document.getElementById("bio").value;

/* Save Goal */
let goalInput = document.getElementById("goalInput");
if(goalInput){
user.goal = goalInput.value;
}

/* Save to localStorage */
localStorage.setItem("user", JSON.stringify(user));

alert("Profile saved successfully!");

}