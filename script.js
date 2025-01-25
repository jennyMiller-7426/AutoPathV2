console.log("Script loaded successfully!");

//Google Apps Script URL (web app) 
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFypmvmKxnJwyNRcdtDbDn71IcIf6AdYtHT6IJ2arSmD8-7RSrxQkraLwuldgpNP53/exec";

// Canvas setup
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

// Load the background image 
const backgroundImage = new Image();
backgroundImage.src = "FIELD_MAP2.svg"; 
backgroundImage.addEventListener("load", () => {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
});

// Variables for drawing
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let strokes = [];
let currentStroke = [];

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Start drawing
function startDrawing(e) {
  e.preventDefault();
  isDrawing = true;
  const { x, y } = getPointerPos(e);
  [lastX, lastY] = [x, y];
  currentStroke = [{ x, y }];
}

// Draw
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
  currentStroke.push({ x, y });
}

// Stop drawing
function stopDrawing(e) {
  e.preventDefault();
  if (!isDrawing) return;
  isDrawing = false;
  strokes.push(currentStroke);
  currentStroke = [];
}

// Clear canvas
document.getElementById("clearCanvas").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  strokes = [];
});

// Convert strokes to <path> elements
function buildSVGPaths() {
  let pathElements = "";
  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    let d = `M${stroke[0].x},${stroke[0].y}`;
    for (let i = 1; i < stroke.length; i++) {
      d += ` L${stroke[i].x},${stroke[i].y}`;
    }
    pathElements += `<path d="${d}" stroke="red" stroke-width="2" fill="none" />`;
  }
  return pathElements;
}

// Build final SVG
function buildFinalSVG() {
  const width = canvas.width;
  const height = canvas.height;
  return `
<svg width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">
  <image href="FIELD_MAP2.svg" x="0" y="0" width="${width}" height="${height}" />
  ${buildSVGPaths()}
</svg>
  `.trim();
}

// Submit data to Google Sheet
document.getElementById("submitDrawing").addEventListener("click", () => {
  const teamNumber = document.getElementById("teamNumber").value.trim();
  const matchNumber = document.getElementById("matchNumber").value.trim();

  // Build SVG
  const finalSVG = buildFinalSVG();

  // Convert SVG to Base64
  const svgBlob = new Blob([finalSVG], { type: "image/svg+xml" });
  const reader = new FileReader();
  reader.onload = function () {
    const base64SVG = reader.result;  // e.g. data:image/svg+xml;base64,...

    // Construct the data to send
    const payload = {
      teamNumber: teamNumber,
      matchNumber: matchNumber,
      svgData: base64SVG
    };

    // POST to the Apps Script Web App
    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload), 
      headers: { "Content-Type": "application/json" }
    })
      .then(response => response.json())
      .then(data => {
        console.log("Response from Apps Script:", data);
        if (data.status === "success") {
          alert("Drawing submitted successfully!");
          // Reset canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
          strokes = [];
          // Clear input fields
          document.getElementById("teamNumber").value = "";
          document.getElementById("matchNumber").value = "";
        } else {
          alert("Submission failed: " + JSON.stringify(data));
        }
      })
      .catch(err => {
        console.error("Submission failed:", err);
        alert("Submission failed: " + err.message);
      });
  };
  reader.readAsDataURL(svgBlob);
});

// Pointer events
canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
