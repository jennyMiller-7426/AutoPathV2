// Canvas setup
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

// Load the background image
const backgroundImage = new Image();
backgroundImage.src = "background.jpg"; // Replace with your image file name

// Draw the background image when it loads
backgroundImage.onload = () => {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
};

const formEntryID = "entry.YPqjbf"; // Replace with your question's entry ID
const formAction = "https://docs.google.com/forms/d/e/1FAIpQLScyZBBnuLBsynXzh-MH5aqHvMKN9PiJF334ruH6wgDipnqD6w/formResponse"; // Replace with your Form's ID

// Variables for drawing
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Start drawing
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

// Draw on the canvas
function draw(e) {
    if (!isDrawing) return;
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

// Stop drawing
function stopDrawing() {
    isDrawing = false;
}

// Clear canvas (and redraw the background image)
document.getElementById("clearCanvas").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Redraw the background
});

// Submit drawing
document.getElementById("submitDrawing").addEventListener("click", () => {
    const imageData = canvas.toDataURL("image/png"); // Convert drawing to Base64 image

    // Create form data
    const formData = new FormData();
    formData.append(formEntryID, imageData);

    // Submit to Google Form
    fetch(formAction, {
        method: "POST",
        body: formData,
        mode: "no-cors" // Required for Google Forms
    })
    .then(() => {
        alert("Drawing submitted successfully!");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Reset canvas
    })
    .catch((err) => {
        alert("Submission failed: " + err.message);
    });
});

// Event listeners for drawing
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
