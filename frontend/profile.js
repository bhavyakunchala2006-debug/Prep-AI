function createProfile(event){

event.preventDefault();

/* get existing user from signup */
let user = JSON.parse(localStorage.getItem("user"));

if(!user){
alert("Please create an account first.");
window.location.href = "index.html";
return;
}

/* collect profile details */
user.college = document.getElementById("college").value;
user.degree = document.getElementById("degree").value;
user.branch = document.getElementById("branch").value;
user.year = document.getElementById("year").value;
user.goal = document.getElementById("goal").value;

/* process skills */
let skillsInput = document.getElementById("skills").value;

user.skills = skillsInput
? skillsInput.split(",").map(s => s.trim()).filter(s => s !== "")
: [];

/* save updated user */
localStorage.setItem("user", JSON.stringify(user));

alert("Profile created successfully!");

/* go to dashboard */
window.location.href = "dashboard.html";

}