console.log("Script loaded successfully!");

// Canvas setup
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

// Use FIELD_MAP2.svg as a raster background (for user preview only)
const backgroundImage = new Image();
backgroundImage.src = "FIELD_MAP2.svg"; // Background image vector

// Use addEventListener instead of onload for CSP complianc
backgroundImage.addEventListener("load", () => {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
});

//Destination CSV
const CSV_ENDPOINT = "https://github.com/jennyMiller-7426/AutoPathV2/blob/4536015fbd0a26fa174ec43222b176de8d97e68e/Auto%20Path%20Test%20%20-%20Sheet1.csv";  // <--- Update me!

// Variables for drawing on the canvas
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Store all strokes: each stroke is an array of {x, y} points
let strokes = [];
let currentStroke = [];

/**
 * Utility: Get pointer position relative to the canvas
 */
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

/**
 * Start drawing
 */
function startDrawing(e) {
  e.preventDefault();
  isDrawing = true;

  const { x, y } = getPointerPos(e);
  [lastX, lastY] = [x, y];

  // Begin a new stroke array
  currentStroke = [{ x, y }];
}

/**
 * Draw on the canvas (real-time feedback)
 */
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

  // Update last position
  [lastX, lastY] = [x, y];

  // Record the point in the current stroke
  currentStroke.push({ x, y });
}

/**
 * Stop drawing
 */
function stopDrawing(e) {
  e.preventDefault();
  if (!isDrawing) return;
  isDrawing = false;

  // Finish this stroke and add it to the strokes array
  strokes.push(currentStroke);
  currentStroke = [];
}

/**
 * Clear the canvas and redraw background
 */
document.getElementById("clearCanvas").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  strokes = []; // Clear recorded strokes
});

/**
 * Convert all strokes into <path> elements
 */
function buildSVGPaths() {
  let pathElements = "";
  for (const stroke of strokes) {
    if (stroke.length < 2) continue; // single point, skip

    // Build the 'd' attribute of the path
    let d = `M${stroke[0].x},${stroke[0].y}`;
    for (let i = 1; i < stroke.length; i++) {
      d += ` L${stroke[i].x},${stroke[i].y}`;
    }

    // Add a <path> with the stroke geometry
    pathElements += `<path d="${d}" stroke="red" stroke-width="2" fill="none" />`;
  }
  return pathElements;
}

/**
 * Build an SVG string referencing FIELD_MAP2.svg as the background
 * plus all user-drawn paths.
 */
function buildFinalSVG() {
  const width = canvas.width;
  const height = canvas.height;

  const svgContent = `
<svg width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">
  <image href="FIELD_MAP2.svg" x="0" y="0" width="${width}" height="${height}" />
  ${buildSVGPaths()}
</svg>
    `;

  return svgContent.trim();
}

/**
 * Submit the drawing as CSV: 
 * The CSV columns: Team Number, Match Number, SVG
 */
document.getElementById("submitDrawing").addEventListener("click", () => {
  // 1. Retrieve user inputs for Team and Match
  const teamNumber = document.getElementById("teamNumber").value.trim();  // <--- Update your HTML
  const matchNumber = document.getElementById("matchNumber").value.trim(); // <--- Update your HTML

  // 2. Build the final SVG string
  const finalSVG = buildFinalSVG();
  console.log("Final SVG:", finalSVG);

  // 3. Base64-encode the SVG
  const svgBlob = new Blob([finalSVG], { type: "image/svg+xml" });
  const reader = new FileReader();

  reader.onload = function () {
    const base64SVG = reader.result; // e.g. "data:image/svg+xml;base64,PHN2ZyB..."

    // 4. Construct the CSV line: "Team Number,Match Number,SVG"
    // We'll URL-encode the CSV line to send it safely in a request
    const csvLine = `${teamNumber},${matchNumber},${base64SVG}\n`;
    console.log("CSV line:", csvLine);

    // 5. SEND CSV LINE TO YOUR SERVER
    // =========== YOU MUST UPDATE CSV_ENDPOINT WITH YOUR SERVER LOGIC ===========
    // Example: A POST request that your backend handles to append lines to a CSV file.
    fetch(CSV_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, // or application/json, depending on your backend
      body: csvLine,
    })
      .then(() => {
        console.log("Submission successful!");
        alert("Drawing submitted successfully!");

        // Reset the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        strokes = [];

        // Clear input fields
        document.getElementById("teamNumber").value = "";
        document.getElementById("matchNumber").value = "";
      })
      .catch((err) => {
        console.error("Submission failed:", err.message);
        alert("Submission failed: " + err.message);
      });
  };

  reader.readAsDataURL(svgBlob);
});

/**
 * Use pointer events for drawing
 */
canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
