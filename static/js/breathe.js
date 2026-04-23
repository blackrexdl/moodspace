// Premium Breathing Exercise Engine - Fixed with proper pause/resume
class BreathingApp {
  constructor() {
    this.modes = {
      478: {
        name: "4-7-8 Technique",
        icon: "🧘",
        desc: "Best for sleep & anxiety",
        phases: [
          { name: "inhale", label: "Inhale", duration: 4, color: "#3b82f6" },
          { name: "hold", label: "Hold", duration: 7, color: "#8b5cf6" },
          { name: "exhale", label: "Exhale", duration: 8, color: "#10b981" },
        ],
        totalTime: 19,
      },
      box: {
        name: "Box Breathing",
        icon: "📦",
        desc: "Used by Navy SEALs",
        phases: [
          { name: "inhale", label: "Inhale", duration: 4, color: "#3b82f6" },
          { name: "hold", label: "Hold", duration: 4, color: "#f59e0b" },
          { name: "exhale", label: "Exhale", duration: 4, color: "#10b981" },
          { name: "hold2", label: "Hold", duration: 4, color: "#f59e0b" },
        ],
        totalTime: 16,
      },
      calm: {
        name: "Calm Breath",
        icon: "😌",
        desc: "Gentle daily practice",
        phases: [
          { name: "inhale", label: "Inhale", duration: 5, color: "#3b82f6" },
          { name: "exhale", label: "Exhale", duration: 5, color: "#10b981" },
        ],
        totalTime: 10,
      },
      coherent: {
        name: "Coherent Breathing",
        icon: "🫀",
        desc: "Heart rate variability",
        phases: [
          { name: "inhale", label: "Inhale", duration: 6, color: "#3b82f6" },
          { name: "exhale", label: "Exhale", duration: 6, color: "#10b981" },
        ],
        totalTime: 12,
      },
      deep: {
        name: "Deep Relaxation",
        icon: "🌊",
        desc: "Stress relief deep breaths",
        phases: [
          { name: "inhale", label: "Inhale", duration: 4, color: "#3b82f6" },
          { name: "hold", label: "Hold", duration: 2, color: "#8b5cf6" },
          { name: "exhale", label: "Exhale", duration: 6, color: "#10b981" },
        ],
        totalTime: 12,
      },
    };

    this.currentMode = "478";
    this.isRunning = false;
    this.isPaused = false;
    this.currentPhase = 0;
    this.currentCycle = 0;
    this.targetCycles = 10;

    // Timing state
    this.phaseStartTime = null;
    this.phaseRemaining = 0;
    this.totalPausedTime = 0;
    this.pauseStartTime = null;
    this.animationFrameId = null;
    this.sessionStart = null;

    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadSessions();
    this.renderPhaseBars();
  }

  bindElements() {
    this.circle = document.getElementById("breathing-circle");
    this.circleText = document.getElementById("breath-text");
    this.circleCount = document.getElementById("current-cycles");
    this.targetCyclesDisplay = document.getElementById("target-cycles-display");
    this.startBtn = document.getElementById("start-breathing");
    this.pauseBtn = document.getElementById("pause-breathing");
    this.stopBtn = document.getElementById("stop-breathing");
    this.phaseBars = document.getElementById("phase-bars");
    this.timerDisplay = document.getElementById("timer-display");
    this.totalCyclesEl = document.getElementById("total-cycles");
    this.sessionsList = document.getElementById("sessions-list");
    this.streakEl = document.getElementById("streak-count");
    this.weeklyEl = document.getElementById("weekly-count");
    this.progressRing = document.getElementById("progress-ring");
  }

  bindEvents() {
    document.querySelectorAll(".exercise-card").forEach((card) => {
      card.addEventListener("click", () => this.switchMode(card.dataset.mode));
    });

    this.startBtn.addEventListener("click", () => this.start());
    this.pauseBtn.addEventListener("click", () => this.togglePause());
    this.stopBtn.addEventListener("click", () => this.stop());

    document.querySelectorAll(".cycle-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (this.isRunning) return;
        document
          .querySelectorAll(".cycle-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.targetCycles = parseInt(e.target.dataset.cycles);
        this.targetCyclesDisplay.textContent = this.targetCycles;
      });
    });
  }

  switchMode(mode) {
    if (this.isRunning) this.stop();
    this.currentMode = mode;
    document
      .querySelectorAll(".exercise-card")
      .forEach((c) => c.classList.remove("active"));
    document.querySelector(`[data-mode="${mode}"]`).classList.add("active");
    this.renderPhaseBars();
    this.resetUI();
  }

  renderPhaseBars() {
    const mode = this.modes[this.currentMode];
    this.phaseBars.innerHTML = mode.phases
      .map(
        (phase, i) => `
      <div class="phase-bar-item ${phase.name}" data-phase="${i}">
        <div class="phase-bar-track">
          <div class="phase-bar-fill" id="bar-${i}"></div>
        </div>
        <div class="phase-bar-label">
          <span class="phase-name">${phase.label}</span>
          <span class="phase-duration">${phase.duration}s</span>
        </div>
      </div>
    `,
      )
      .join("");
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.currentPhase = 0;
    this.currentCycle = 0;
    this.totalPausedTime = 0;
    this.sessionStart = Date.now();

    this.startBtn.style.display = "none";
    this.pauseBtn.style.display = "inline-flex";
    this.stopBtn.style.display = "inline-flex";

    this.runPhase();
  }

  runPhase() {
    if (!this.isRunning) return;

    const mode = this.modes[this.currentMode];
    const phase = mode.phases[this.currentPhase];

    this.phaseRemaining = phase.duration;
    this.phaseStartTime = Date.now();

    // Update UI
    this.circleText.textContent = phase.label;
    this.circle.style.setProperty("--phase-color", phase.color);

    // Highlight current phase bar
    document.querySelectorAll(".phase-bar-item").forEach((el, i) => {
      el.classList.toggle("active", i === this.currentPhase);
    });

    // Animate circle with exact duration
    this.setCircleAnimation(phase.name, phase.duration);

    // Start the game loop
    this.tick();
  }

  tick() {
    if (!this.isRunning || this.isPaused) return;

    const now = Date.now();
    const elapsed = (now - this.phaseStartTime - this.totalPausedTime) / 1000;
    const mode = this.modes[this.currentMode];
    const phase = mode.phases[this.currentPhase];
    const remaining = Math.max(0, phase.duration - elapsed);

    // Update timer display
    this.timerDisplay.textContent = Math.ceil(remaining) + "s";

    // Update progress ring
    const circumference = 2 * Math.PI * 140;
    const progress = Math.min(1, elapsed / phase.duration);
    this.progressRing.style.strokeDashoffset = circumference * (1 - progress);

    // Update bar fill
    const barFill = document.getElementById(`bar-${this.currentPhase}`);
    if (barFill) {
      barFill.style.width = `${progress * 100}%`;
    }

    if (remaining <= 0) {
      // Phase complete
      this.totalPausedTime = 0;
      this.nextPhase();
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  setCircleAnimation(phaseName, duration) {
    const durationMs = duration * 1000;
    this.circle.style.transition = `transform ${durationMs}ms ease-in-out, box-shadow ${durationMs}ms ease-in-out`;

    switch (phaseName) {
      case "inhale":
        this.circle.style.transform = "scale(1.5)";
        this.circle.style.boxShadow = `0 0 80px rgba(59, 130, 246, 0.5)`;
        break;
      case "hold":
      case "hold2":
        this.circle.style.transform = "scale(1.5)";
        this.circle.style.boxShadow = `0 0 80px rgba(139, 92, 246, 0.4)`;
        break;
      case "exhale":
        this.circle.style.transform = "scale(1)";
        this.circle.style.boxShadow = "0 0 30px rgba(0,0,0,0.1)";
        break;
    }
  }

  nextPhase() {
    const mode = this.modes[this.currentMode];
    this.currentPhase++;

    // Reset bar for completed phase
    const completedBar = document.getElementById(
      `bar-${this.currentPhase - 1}`,
    );
    if (completedBar) completedBar.style.width = "100%";

    if (this.currentPhase >= mode.phases.length) {
      this.currentPhase = 0;
      this.currentCycle++;
      this.circleCount.textContent = this.currentCycle;

      // Reset all bars for next cycle
      document
        .querySelectorAll(".phase-bar-fill")
        .forEach((bar) => (bar.style.width = "0%"));

      if (this.currentCycle >= this.targetCycles) {
        this.complete();
        return;
      }
    }

    this.runPhase();
  }

  togglePause() {
    if (!this.isRunning) return;

    if (this.isPaused) {
      // RESUME
      this.isPaused = false;
      this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
      this.circleText.textContent =
        this.modes[this.currentMode].phases[this.currentPhase].label;

      // Calculate how long we were paused
      const pauseDuration = Date.now() - this.pauseStartTime;
      this.totalPausedTime += pauseDuration;

      // Resume animation from where we left off
      const mode = this.modes[this.currentMode];
      const phase = mode.phases[this.currentPhase];
      const elapsed =
        (Date.now() - this.phaseStartTime - this.totalPausedTime) / 1000;
      const remaining = phase.duration - elapsed;

      // Update circle transition to match remaining time
      this.circle.style.transition = `transform ${remaining * 1000}ms ease-in-out, box-shadow ${remaining * 1000}ms ease-in-out`;

      // Continue the loop
      this.tick();
    } else {
      // PAUSE
      this.isPaused = true;
      this.pauseStartTime = Date.now();
      this.pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
      this.circleText.textContent = "Paused";

      // Cancel the animation frame
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // Freeze circle animation
      const computedTransform = getComputedStyle(this.circle).transform;
      const computedShadow = getComputedStyle(this.circle).boxShadow;
      this.circle.style.transition = "none";
      this.circle.style.transform = computedTransform;
      this.circle.style.boxShadow = computedShadow;
    }
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.currentCycle > 0) {
      this.saveSession();
    }

    this.resetUI();
  }

  complete() {
    this.isRunning = false;
    this.isPaused = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.saveSession();

    this.circleText.textContent = "Complete!";
    this.circle.style.transition =
      "transform 1s ease-in-out, box-shadow 1s ease-in-out";
    this.circle.style.transform = "scale(1)";
    this.circle.style.boxShadow = "0 0 60px rgba(16, 185, 129, 0.6)";
    this.timerDisplay.textContent = "✓";
    this.timerDisplay.style.color = "#10b981";

    // Fill progress ring completely
    const circumference = 2 * Math.PI * 140;
    this.progressRing.style.strokeDashoffset = 0;

    setTimeout(() => this.resetUI(), 3000);
  }

  resetUI() {
    this.startBtn.style.display = "inline-flex";
    this.pauseBtn.style.display = "none";
    this.stopBtn.style.display = "none";
    this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';

    this.circleText.textContent = "Ready to begin";
    this.circleCount.textContent = "0";
    this.timerDisplay.textContent = "--";
    this.timerDisplay.style.color = "";
    this.circle.style.transition =
      "transform 0.5s ease-in-out, box-shadow 0.5s ease-in-out";
    this.circle.style.transform = "scale(1)";
    this.circle.style.boxShadow = "none";

    const circumference = 2 * Math.PI * 140;
    this.progressRing.style.strokeDashoffset = circumference;

    document.querySelectorAll(".phase-bar-item").forEach((el) => {
      el.classList.remove("active");
    });
    document.querySelectorAll(".phase-bar-fill").forEach((el) => {
      el.style.width = "0%";
    });
  }

  saveSession() {
    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      mode: this.currentMode,
      modeName: this.modes[this.currentMode].name,
      cycles: this.currentCycle,
      targetCycles: this.targetCycles,
      duration: Math.round((Date.now() - this.sessionStart) / 1000),
    };

    let sessions = JSON.parse(
      localStorage.getItem("breathingSessions") || "[]",
    );
    sessions.unshift(session);
    if (sessions.length > 50) sessions = sessions.slice(0, 50);

    localStorage.setItem("breathingSessions", JSON.stringify(sessions));
    this.loadSessions();

    if (window.showToast) {
      window.showToast(
        `Session saved: ${session.cycles} cycles completed!`,
        "success",
      );
    }
  }

  loadSessions() {
    const sessions = JSON.parse(
      localStorage.getItem("breathingSessions") || "[]",
    );
    const totalCycles = sessions.reduce((sum, s) => sum + s.cycles, 0);
    if (this.totalCyclesEl) this.totalCyclesEl.textContent = totalCycles;

    const streak = this.calculateStreak(sessions);
    if (this.streakEl) this.streakEl.textContent = streak;

    const weekly = this.calculateWeekly(sessions);
    if (this.weeklyEl) this.weeklyEl.textContent = weekly;

    if (sessions.length === 0) {
      if (this.sessionsList) {
        this.sessionsList.innerHTML =
          '<div class="empty-sessions"><i class="fas fa-wind"></i><p>No sessions yet. Start your first one!</p></div>';
      }
      return;
    }

    if (this.sessionsList) {
      this.sessionsList.innerHTML = sessions
        .slice(0, 10)
        .map((s) => {
          const date = new Date(s.date);
          const timeStr =
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const durationMin = Math.round((s.duration / 60) * 10) / 10;
          const percent = Math.round((s.cycles / s.targetCycles) * 100);

          return `
          <div class="session-item">
            <div class="session-info">
              <div class="session-mode">${this.modes[s.mode]?.icon || "🫁"} ${s.modeName}</div>
              <div class="session-time">${timeStr} • ${durationMin} min</div>
            </div>
            <div class="session-progress">
              <div class="progress-ring-small" style="--progress: ${percent}">
                <span>${s.cycles}/${s.targetCycles}</span>
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    }
  }

  calculateStreak(sessions) {
    if (sessions.length === 0) return 0;
    const dates = [
      ...new Set(sessions.map((s) => new Date(s.date).toDateString())),
    ].sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev - curr) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }

  calculateWeekly(sessions) {
    const weekAgo = Date.now() - 7 * 86400000;
    return sessions.filter((s) => new Date(s.date).getTime() > weekAgo).length;
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("breathing-circle")) {
    new BreathingApp();
  }
});
