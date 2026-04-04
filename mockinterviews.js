const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("resume");

uploadArea.addEventListener("click", () => {
fileInput.click();
});

fileInput.addEventListener("change", () => {
uploadArea.innerHTML = "<p>Resume Uploaded ✔</p>";
});