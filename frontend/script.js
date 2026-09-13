function showForm(formId, button){

document.querySelectorAll(".form-section").forEach(function(form){
form.classList.remove("active");
});

document.querySelectorAll(".tab-btn").forEach(function(btn){
btn.classList.remove("active");
});

document.getElementById(formId).classList.add("active");
button.classList.add("active");

}


/* CREATE ACCOUNT */

function createAccount(){

let name=document.getElementById("signupName").value;
let email=document.getElementById("signupEmail").value;
let password=document.getElementById("signupPassword").value;

if(name==="" || email==="" || password===""){
alert("Please fill all fields");
return;
}

let user={
name:name,
email:email,
password:password
};

localStorage.setItem("user",JSON.stringify(user));

alert("Account created successfully!");

window.location.href="profile.html";

}


/* LOGIN */

function loginUser(){

let email=document.getElementById("loginEmail").value;
let password=document.getElementById("loginPassword").value;

let storedUser=JSON.parse(localStorage.getItem("user"));

if(!storedUser){
alert("No account found. Please sign up.");
return;
}

if(email===storedUser.email && password===storedUser.password){

window.location.href="dashboard.html";

}else{

alert("Invalid login credentials");

}

}