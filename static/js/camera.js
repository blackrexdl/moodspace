// Pure Real-Time Face Expression (Expression Only, No Confidence)
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("camera-status");
const emotionBadge = document.getElementById("emotion-badge");
const emotionIcon = document.getElementById("emotion-icon-live");

let stream = null;
let animationId = null;
let lastExpression = "neutral";
let frameCount = 0;
let faceVisible = false;

// Emotion map
const emotionEmojis = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprised: "😮",
  anxious: "😰",
  calm: "😌",
  neutral: "😐",
};

// Auto-start camera
async function initCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: 640,
        height: 480,
      },
    });
    video.srcObject = stream;
    video.play();
    status.textContent = "Tracking expression...";
    startRealTimeDetection();
  } catch (err) {
    status.textContent = "Camera permission required";
  }
}

// Real-time 30fps face expression tracking
function startRealTimeDetection() {
  function detectFrame() {
    if (!video.videoWidth) {
      animationId = requestAnimationFrame(detectFrame);
      return;
    }

    canvas.width = 320;
    canvas.height = 240;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const expression = getCurrentExpression();
    if (expression !== lastExpression) {
      updateExpressionBadge(expression);
      lastExpression = expression;
    }

    frameCount++;
    animationId = requestAnimationFrame(detectFrame);
  }
  detectFrame();
}

// Face-aware expression detection (pixel analysis)
function getCurrentExpression() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const brightness = getAverageBrightness(imageData);
  const smileVariance = getSmileVariance(imageData);
  const eyeVariance = getEyeRegionVariance(imageData);

  // Face visibility check
  if (brightness < 30 || brightness > 240) return "neutral";

  // Smile detection (bottom center variance)
  if (smileVariance > 35) return "happy";

  // Sad (low brightness + low variance)
  if (brightness < 110 && eyeVariance < 20) return "sad";

  // Surprised (high eye variance)
  if (eyeVariance > 50) return "surprised";

  // Calm (high brightness, low variance)
  if (brightness > 160) return "calm";

  return "neutral";
}

function getAverageBrightness(imageData) {
  let total = 0,
    count = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    total += (r + g + b) / 3;
    count++;
  }
  return total / count;
}

function getSmileVariance(imageData) {
  // Bottom center region (mouth area)
  let sum = 0,
    sumSq = 0,
    count = 0;
  const mouthY = canvas.height * 0.65;
  const mouthH = canvas.height * 0.15;
  for (let y = mouthY; y < mouthY + mouthH; y++) {
    for (let x = canvas.width * 0.3; x < canvas.width * 0.7; x++) {
      const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
      if (i < imageData.data.length) {
        const avg =
          (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) /
          3;
        sum += avg;
        sumSq += avg * avg;
        count++;
      }
    }
  }
  const mean = sum / count;
  return Math.sqrt(sumSq / count - mean * mean);
}

function getEyeRegionVariance(imageData) {
  // Eye region (top center)
  let sum = 0,
    sumSq = 0,
    count = 0;
  const eyeY = canvas.height * 0.25;
  const eyeH = canvas.height * 0.1;
  for (let y = eyeY; y < eyeY + eyeH; y++) {
    for (let x = canvas.width * 0.25; x < canvas.width * 0.75; x++) {
      const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
      if (i < imageData.data.length) {
        const avg =
          (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) /
          3;
        sum += avg;
        sumSq += avg * avg;
        count++;
      }
    }
  }
  const mean = sum / count;
  return Math.sqrt(sumSq / count - mean * mean);
}

// Instant badge update
function updateExpressionBadge(expression) {
  emotionBadge.textContent = expression.toUpperCase();
  emotionBadge.className = `emotion-badge ${expression}`;
  emotionIcon.textContent = emotionEmojis[expression] || "😐";
}

// Start everything
document.addEventListener("DOMContentLoaded", initCamera);

// Cleanup
window.addEventListener("pagehide", () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (stream) stream.getTracks().forEach((track) => track.stop());
});
