// Premium Real-Time Face Expression Analyzer
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("camera-status");
const rtEmoji = document.getElementById("rt-emoji");
const rtLabel = document.getElementById("rt-label");
const rtBar = document.getElementById("rt-bar");
const rtPercent = document.getElementById("rt-percent");
const timelineItems = document.getElementById("timeline-items");
const faceFrame = document.getElementById("face-frame");
const scanLine = document.getElementById("scan-line");

let stream = null;
let animationId = null;
let lastExpression = "neutral";
let expressionHistory = [];
let frameCount = 0;
let updateTimer = null;
let isProcessing = false;

// Emotion configuration
const emotions = {
  happy: {
    emoji: "😊",
    color: "#f59e0b",
    label: "Happy",
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  },
  sad: {
    emoji: "😢",
    color: "#3b82f6",
    label: "Sad",
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
  },
  angry: {
    emoji: "😠",
    color: "#ef4444",
    label: "Angry",
    gradient: "linear-gradient(135deg, #ef4444, #f87171)",
  },
  surprised: {
    emoji: "😮",
    color: "#8b5cf6",
    label: "Surprised",
    gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
  },
  anxious: {
    emoji: "😰",
    color: "#ec4899",
    label: "Anxious",
    gradient: "linear-gradient(135deg, #ec4899, #f472b6)",
  },
  calm: {
    emoji: "😌",
    color: "#10b981",
    label: "Calm",
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
  },
  neutral: {
    emoji: "😐",
    color: "#64748b",
    label: "Neutral",
    gradient: "linear-gradient(135deg, #64748b, #94a3b8)",
  },
};

// Initialize camera
async function initCamera() {
  try {
    statusEl.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Requesting camera...';
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
    });
    video.srcObject = stream;
    await video.play();
    statusEl.innerHTML =
      '<i class="fas fa-check-circle" style="color: #10b981;"></i> Camera active - Analyzing expressions';
    startDetectionLoop();
  } catch (err) {
    statusEl.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Camera access denied';
  }
}

// Main detection loop with throttled updates
function startDetectionLoop() {
  canvas.width = 320;
  canvas.height = 240;

  function loop() {
    if (!video.videoWidth) {
      animationId = requestAnimationFrame(loop);
      return;
    }

    // Draw frame to canvas
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Analyze every 10 frames (~300ms at 30fps)
    frameCount++;
    if (frameCount % 10 === 0 && !isProcessing) {
      analyzeExpression();
    }

    animationId = requestAnimationFrame(loop);
  }
  loop();
}

// Analyze expression with confidence scoring
function analyzeExpression() {
  isProcessing = true;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const analysis = performAnalysis(imageData);

  // Only update if confidence is high enough and expression changed
  if (analysis.confidence > 60 && analysis.expression !== lastExpression) {
    // Add delay before updating to avoid flickering
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      updateExpressionDisplay(analysis);
      addToTimeline(analysis);
      lastExpression = analysis.expression;
    }, 500);
  }

  // Always update confidence bar
  updateConfidenceBar(analysis.confidence);

  // Update face frame visibility
  faceFrame.style.opacity = analysis.faceDetected ? "1" : "0.3";

  isProcessing = false;
}

// Advanced pixel analysis
function performAnalysis(imageData) {
  const brightness = getAverageBrightness(imageData);
  const mouthRegion = getRegionAnalysis(imageData, 0.3, 0.7, 0.6, 0.85);
  const eyeRegion = getRegionAnalysis(imageData, 0.2, 0.8, 0.15, 0.45);
  const browRegion = getRegionAnalysis(imageData, 0.25, 0.75, 0.1, 0.3);

  // Face detection check
  const faceDetected = brightness > 40 && brightness < 230;
  if (!faceDetected) {
    return { expression: "neutral", confidence: 0, faceDetected: false };
  }

  // Expression scoring
  const scores = {
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    anxious: 0,
    calm: 0,
    neutral: 50,
  };

  // Happy: High mouth variance, medium-high brightness
  if (mouthRegion.variance > 30 && brightness > 100) {
    scores.happy += mouthRegion.variance * 2;
  }

  // Sad: Low brightness, low mouth variance, droopy eyes
  if (
    brightness < 120 &&
    mouthRegion.variance < 20 &&
    eyeRegion.variance < 25
  ) {
    scores.sad += 150 - brightness + (30 - mouthRegion.variance);
  }

  // Angry: High brow variance, tense mouth
  if (browRegion.variance > 35 && mouthRegion.variance < 25) {
    scores.angry += browRegion.variance * 1.5;
  }

  // Surprised: High eye variance, wide eyes
  if (eyeRegion.variance > 40 && browRegion.variance > 30) {
    scores.surprised += eyeRegion.variance * 2;
  }

  // Anxious: Medium-high eye variance, tense features
  if (eyeRegion.variance > 30 && eyeRegion.variance < 50 && brightness < 150) {
    scores.anxious += eyeRegion.variance * 1.5;
  }

  // Calm: High brightness, low overall variance
  if (
    brightness > 150 &&
    mouthRegion.variance < 20 &&
    eyeRegion.variance < 30
  ) {
    scores.calm += brightness - 100;
  }

  // Find highest scoring expression
  let maxScore = 0;
  let bestExpression = "neutral";

  for (const [expr, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestExpression = expr;
    }
  }

  // Calculate confidence (cap at 95%)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence =
    totalScore > 0
      ? Math.min(95, Math.round((maxScore / totalScore) * 100))
      : 50;

  return { expression: bestExpression, confidence, faceDetected };
}

function getAverageBrightness(imageData) {
  let total = 0;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 16) {
    // Sample every 4th pixel for speed
    total += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return total / (data.length / 16);
}

function getRegionAnalysis(imageData, xStart, xEnd, yStart, yEnd) {
  let sum = 0,
    sumSq = 0,
    count = 0;
  const w = canvas.width;
  const h = canvas.height;
  const data = imageData.data;

  for (let y = h * yStart; y < h * yEnd; y += 2) {
    for (let x = w * xStart; x < w * xEnd; x += 2) {
      const i = (Math.floor(y) * w + Math.floor(x)) * 4;
      if (i < data.length) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        sum += avg;
        sumSq += avg * avg;
        count++;
      }
    }
  }

  const mean = sum / count;
  const variance = Math.sqrt(sumSq / count - mean * mean);
  return { mean, variance: variance || 0 };
}

// Update the real-time display
function updateExpressionDisplay(analysis) {
  const emotion = emotions[analysis.expression];
  if (!emotion) return;

  rtEmoji.textContent = emotion.emoji;
  rtLabel.textContent = emotion.label;
  rtLabel.style.color = emotion.color;

  const badge = document.getElementById("emotion-badge-rt");
  badge.style.background = emotion.gradient;

  // Animate scan line
  scanLine.style.animation = "none";
  scanLine.offsetHeight; // Trigger reflow
  scanLine.style.animation = "scanAnimation 1s ease";
}

// Update confidence bar
function updateConfidenceBar(confidence) {
  rtBar.style.width = `${confidence}%`;
  rtBar.style.background =
    confidence > 70
      ? "linear-gradient(90deg, #10b981, #34d399)"
      : confidence > 40
        ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
        : "linear-gradient(90deg, #ef4444, #f87171)";
  rtPercent.textContent = `${confidence}%`;
}

// Add to expression timeline
function addToTimeline(analysis) {
  const emotion = emotions[analysis.expression];
  if (!emotion) return;

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const item = document.createElement("div");
  item.className = "timeline-item";
  item.innerHTML = `
    <span class="timeline-emoji">${emotion.emoji}</span>
    <div class="timeline-info">
      <span class="timeline-expression" style="color: ${emotion.color}">${emotion.label}</span>
      <span class="timeline-time">${time}</span>
    </div>
    <span class="timeline-confidence">${analysis.confidence}%</span>
  `;

  timelineItems.insertBefore(item, timelineItems.firstChild);

  // Keep only last 10 items
  while (timelineItems.children.length > 10) {
    timelineItems.removeChild(timelineItems.lastChild);
  }

  // Animate in
  item.style.animation = "slideInRight 0.3s ease";
}

// Capture button
document.getElementById("capture")?.addEventListener("click", () => {
  const analysis = performAnalysis(
    ctx.getImageData(0, 0, canvas.width, canvas.height),
  );
  const emotion = emotions[analysis.expression];

  // Flash effect
  const flash = document.createElement("div");
  flash.style.cssText =
    "position: fixed; inset: 0; background: white; opacity: 0.8; z-index: 999; pointer-events: none; transition: opacity 0.5s;";
  document.body.appendChild(flash);
  setTimeout(() => (flash.style.opacity = "0"), 50);
  setTimeout(() => flash.remove(), 550);

  // Show captured emotion
  statusEl.innerHTML = `<i class="fas fa-camera" style="color: ${emotion.color};"></i> Captured: ${emotion.label} (${analysis.confidence}% confidence)`;

  addToTimeline(analysis);
});

// Start on load
document.addEventListener("DOMContentLoaded", initCamera);

// Cleanup
window.addEventListener("pagehide", () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (stream) stream.getTracks().forEach((track) => track.stop());
});
