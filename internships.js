const buttons = document.querySelectorAll(".apply");

buttons.forEach(btn => {
btn.addEventListener("click", () => {
alert("Application Submitted!");
});
});