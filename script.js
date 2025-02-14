console.log("test 9!");

// Google Apps Script URL (web app)
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwpIFWcCiNOXdmGTKQLQG9qyo2s9EUsJ_JX7mCT89oYkkbFrqqIlQp2lXHCGL_9el6i/exec";

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

/**
 * Get pointer position
 */
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
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

/**
 * Convert strokes into <path> elements
 */
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

/**
 * Build final SVG as a single string (no multiline backticks)
 */
function buildFinalSVG() {
  const width = canvas.width;
  const height = canvas.height;
  
  // Construct the SVG in one line or by concatenating strings
  const svgStart = '<svg width="' + width + '" height="' + height + '" ' +
                   'viewBox="0 0 ' + width + ' ' + height + '" ' +
                   'xmlns="http://www.w3.org/2000/svg">';
  const svgImage = '<image href="FIELD_MAP2.svg" x="0" y="0" width="' +
                   width + '" height="' + height + '" />';
  const svgPaths = buildSVGPaths();
  const svgEnd = '</svg>';

  // Combine everything
  return svgStart + svgImage + svgPaths + svgEnd;
}

// Submit data to Google Sheet
document.getElementById("submitDrawing").addEventListener("click", () => {
  const teamNumber = document.getElementById("teamNumber").value.trim();
  const matchNumber = document.getElementById("matchNumber").value.trim();

  // 1) Build the final SVG string
  const finalSVG = buildFinalSVG();

  // 2) Convert SVG to Base64
  const svgBlob = new Blob([finalSVG], { type: "image/svg+xml" });
  const reader = new FileReader();

  reader.onload = function () {
    const base64SVG = reader.result; // e.g. "data:image/svg+xml;base64,..."

    // 3) Construct the data to send
    const payload = {
      teamNumber: teamNumber,
      matchNumber: matchNumber,
      svgData: base64SVG,
    };

    // 4) POST to the Apps Script Web App
    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Submission successful!");
          // Reset or clear the canvas, etc.
        } else {
          alert("Submission failed: " + data.message);
        }
      })
      .catch((err) => alert("Submission failed: " + err));
  };

  reader.readAsDataURL(svgBlob);
});

// Pointer events
canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
