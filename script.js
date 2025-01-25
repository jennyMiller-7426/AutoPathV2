console.log("Script loaded successfully!");

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

// Form details
const formEntryID = "entry.28848329"; // Replace with your question's entry ID
const formAction = "https://docs.google.com/forms/d/e/1FAIpQLScyZBBnuLBsynXzh-MH5aqHvMKN9PiJF334ruH6wgDipnqD6w/formResponse"; // Replace with your Form's ID

// Variables for drawing
let isDrawing = false;
let lastX = 0;
let lastY = 0;

/**
 * Utility: Get pointer position relative to the canvas
 * Works for mouse, touch, and stylus.
 */
function getPointerPos(e) {
    const rect = e.target.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Start drawing
function startDrawing(e) {
    e.preventDefault(); // Prevent scrolling on touch devices
    isDrawing = true;
    
    // Get initial pointer position
    const { x, y } = getPointerPos(e);
    [lastX, lastY] = [x, y];
}

// Draw on the canvas
function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getPointerPos(e);

    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
}

// Stop drawing
function stopDrawing(e) {
    e.preventDefault();
    isDrawing = false;
}

// Clear canvas (and redraw the background image)
document.getElementById("clearCanvas").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Redraw the background
});

// Submit drawing
document.getElementById("submitDrawing").addEventListener("click", () => {
    // Resize canvas
    const resizedCanvas = document.createElement("canvas");
    const resizedCtx = resizedCanvas.getContext("2d");
    resizedCanvas.width = canvas.width / 2; // Reduce width by half
    resizedCanvas.height = canvas.height / 2; // Reduce height by half
    resizedCtx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

    const resizedImageData = resizedCanvas.toDataURL("image/png", 0.5); // Smaller, compressed image
    console.log("Base64 image data:", resizedImageData); // Log the Base64 data

    const formData = new FormData();
    formData.append(formEntryID, resizedImageData); // Attach the drawing data
    console.log("FormData content:", formData.get(formEntryID)); // Log the appended data

    // Submit the form
    fetch(formAction, {
        method: "POST",
        body: formData,
        mode: "no-cors" // Required for Google Forms
    })
    .then(() => {
        console.log("Submission successful!");
        alert("Drawing submitted successfully!");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Reset canvas
    })
    .catch((err) => {
        console.error("Submission failed:", err.message);
        alert("Submission failed: " + err.message);
    });
});

/**
 * Replace old mouse events with pointer events
 * to unify mouse, touch, and stylus drawing.
 */
canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
