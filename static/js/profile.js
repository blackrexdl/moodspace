// Premium Profile Manager with localStorage persistence
class ProfileManager {
  constructor() {
    this.profile = this.loadProfile();
    this.activities = this.loadActivities();
    this.settings = this.loadSettings();
    this.achievements = this.loadAchievements();

    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.renderProfile();
    this.renderActivities();
    this.renderStats();
    this.renderMoodDistribution();
    this.renderAchievements();
    this.renderWeeklyChart();
    this.renderInsights();
    this.checkAchievements();
  }

  // Data Management
  loadProfile() {
    const defaultProfile = {
      name: "",
      email: "",
      bio: "Your wellness journey starts here",
      location: "Earth",
      occupation: "",
      interests: [],
      avatar: null,
      memberSince: new Date().toISOString(),
      joinYear: new Date().getFullYear(),
    };
    const saved = localStorage.getItem("moodspaceProfile");
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  }

  saveProfile() {
    localStorage.setItem("moodspaceProfile", JSON.stringify(this.profile));
  }

  loadActivities() {
    const saved = localStorage.getItem("moodspaceActivities");
    return saved ? JSON.parse(saved) : [];
  }

  saveActivity(type, title, detail = "") {
    const activity = {
      id: Date.now(),
      type,
      title,
      detail,
      timestamp: new Date().toISOString(),
    };
    this.activities.unshift(activity);
    if (this.activities.length > 50)
      this.activities = this.activities.slice(0, 50);
    localStorage.setItem(
      "moodspaceActivities",
      JSON.stringify(this.activities),
    );
    this.renderActivities();
    this.checkAchievements();
  }

  loadSettings() {
    const defaultSettings = {
      reminders: true,
      sound: true,
      report: false,
      privacy: false,
    };
    const saved = localStorage.getItem("moodspaceSettings");
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  }

  saveSettings() {
    localStorage.setItem("moodspaceSettings", JSON.stringify(this.settings));
  }

  loadAchievements() {
    const defaultAchievements = {
      "first-post": { unlocked: false, date: null },
      "streak-7": { unlocked: false, date: null },
      "breathe-10": { unlocked: false, date: null },
      analyzer: { unlocked: false, date: null },
      "journal-30": { unlocked: false, date: null },
      "camera-5": { unlocked: false, date: null },
    };
    const saved = localStorage.getItem("moodspaceAchievements");
    return saved
      ? { ...defaultAchievements, ...JSON.parse(saved) }
      : defaultAchievements;
  }

  saveAchievements() {
    localStorage.setItem(
      "moodspaceAchievements",
      JSON.stringify(this.achievements),
    );
  }

  // DOM Binding
  bindElements() {
    this.avatarPreview = document.getElementById("avatar-preview");
    this.profileImage = document.getElementById("profile-image");
    this.displayName = document.getElementById("display-name");
    this.displayBio = document.getElementById("display-bio");
    this.displayLocation = document.getElementById("display-location");
    this.memberSince = document.getElementById("member-since");

    this.viewName = document.getElementById("view-name");
    this.viewEmail = document.getElementById("view-email");
    this.viewBio = document.getElementById("view-bio");
    this.viewLocation = document.getElementById("view-location");
    this.viewOccupation = document.getElementById("view-occupation");
    this.viewInterests = document.getElementById("view-interests");

    this.profileForm = document.getElementById("profile-form");
    this.profileView = document.getElementById("profile-view");
    this.btnEdit = document.getElementById("btn-edit-profile");
    this.btnCancel = document.getElementById("btn-cancel-edit");

    this.nameInput = document.getElementById("profile-name-input");
    this.emailInput = document.getElementById("profile-email");
    this.bioInput = document.getElementById("profile-bio");
    this.locationInput = document.getElementById("profile-location");
    this.occupationInput = document.getElementById("profile-occupation");
    this.interestsInput = document.getElementById("profile-interests");

    this.activityTimeline = document.getElementById("activity-timeline");

    // Settings toggles
    this.toggleReminders = document.getElementById("setting-reminders");
    this.toggleSound = document.getElementById("setting-sound");
    this.toggleReport = document.getElementById("setting-report");
    this.togglePrivacy = document.getElementById("setting-privacy");
  }

  bindEvents() {
    // Avatar upload
    this.profileImage?.addEventListener("change", (e) =>
      this.handleAvatarUpload(e),
    );

    // Edit profile
    this.btnEdit?.addEventListener("click", () => this.enterEditMode());
    this.btnCancel?.addEventListener("click", () => this.cancelEdit());
    this.profileForm?.addEventListener("submit", (e) =>
      this.saveProfileData(e),
    );

    // Tab navigation
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    // Settings toggles
    this.toggleReminders?.addEventListener("change", (e) => {
      this.settings.reminders = e.target.checked;
      this.saveSettings();
    });
    this.toggleSound?.addEventListener("change", (e) => {
      this.settings.sound = e.target.checked;
      this.saveSettings();
    });
    this.toggleReport?.addEventListener("change", (e) => {
      this.settings.report = e.target.checked;
      this.saveSettings();
    });
    this.togglePrivacy?.addEventListener("change", (e) => {
      this.settings.privacy = e.target.checked;
      this.saveSettings();
    });

    // Danger zone
    document
      .getElementById("btn-clear-data")
      ?.addEventListener("click", () => this.clearAllData());
    document
      .getElementById("btn-reset-profile")
      ?.addEventListener("click", () => this.resetProfile());

    // Initialize settings toggles
    if (this.toggleReminders)
      this.toggleReminders.checked = this.settings.reminders;
    if (this.toggleSound) this.toggleSound.checked = this.settings.sound;
    if (this.toggleReport) this.toggleReport.checked = this.settings.report;
    if (this.togglePrivacy) this.togglePrivacy.checked = this.settings.privacy;
  }

  // Rendering
  renderProfile() {
    this.displayName.textContent =
      this.profile.name || document.getElementById("display-name").textContent;
    this.displayBio.textContent =
      this.profile.bio || "Your wellness journey starts here";
    this.displayLocation.textContent = this.profile.location || "Earth";
    this.memberSince.textContent =
      this.profile.joinYear || new Date().getFullYear();

    if (this.profile.avatar) {
      this.avatarPreview.src = this.profile.avatar;
    }

    this.viewName.textContent = this.profile.name || "-";
    this.viewEmail.textContent = this.profile.email || "-";
    this.viewBio.textContent = this.profile.bio || "-";
    this.viewLocation.textContent = this.profile.location || "-";
    this.viewOccupation.textContent = this.profile.occupation || "-";
    this.viewInterests.textContent = this.profile.interests?.join(", ") || "-";
  }

  renderActivities() {
    if (this.activities.length === 0) {
      this.activityTimeline.innerHTML = `
        <div class="empty-activity">
          <i class="fas fa-wind"></i>
          <p>No activity yet. Start your wellness journey!</p>
        </div>
      `;
      return;
    }

    const icons = {
      post: "📝",
      breathe: "🌬️",
      analyze: "🧠",
      camera: "📷",
      login: "🔑",
      profile: "👤",
    };

    this.activityTimeline.innerHTML = this.activities
      .slice(0, 20)
      .map((act) => {
        const time = this.timeAgo(new Date(act.timestamp));
        return `
        <div class="timeline-item">
          <div class="timeline-icon">${icons[act.type] || "✨"}</div>
          <div class="timeline-content">
            <div class="timeline-title">${act.title}</div>
            ${act.detail ? `<div class="timeline-detail">${act.detail}</div>` : ""}
            <div class="timeline-time">${time}</div>
        </div>
      `;
      })
      .join("");
  }

  renderStats() {
    // Load from various localStorage sources
    const breathingSessions = JSON.parse(
      localStorage.getItem("breathingSessions") || "[]",
    );
    const totalBreaths = breathingSessions.reduce(
      (sum, s) => sum + (s.cycles || 0),
      0,
    );

    const posts = JSON.parse(localStorage.getItem("moodspacePosts") || "[]");
    const postCount = posts.length;

    // Calculate streak
    const streak = this.calculateStreak();

    // Check-ins (simulate from activities)
    const checkins = this.activities.filter(
      (a) => a.type === "post" || a.type === "breathe",
    ).length;

    document.getElementById("stat-streak").textContent = streak;
    document.getElementById("stat-posts").textContent = postCount;
    document.getElementById("stat-breathe").textContent = totalBreaths;
    document.getElementById("stat-checkins").textContent = checkins;

    // Insights
    document.getElementById("insight-streak").textContent = streak + " days";

    // Mindful minutes
    const mindfulMinutes = breathingSessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0,
    );
    document.getElementById("insight-time").textContent =
      Math.round(mindfulMinutes / 60) + " min";

    // Weekly goal (7 check-ins per week)
    const weekly = this.activities.filter((a) => {
      const daysAgo =
        (Date.now() - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    }).length;
    const goalPercent = Math.min(100, Math.round((weekly / 7) * 100));
    document.getElementById("insight-goal").textContent = goalPercent + "%";
  }

  renderMoodDistribution() {
    const posts = JSON.parse(localStorage.getItem("moodspacePosts") || "[]");
    if (posts.length === 0) return;

    const moods = {};
    posts.forEach((p) => {
      const emotion = p.emotion || "neutral";
      moods[emotion] = (moods[emotion] || 0) + 1;
    });

    const total = posts.length;
    const moodItems = document.querySelectorAll(".mood-item");

    const moodTypes = ["happy", "calm", "anxious", "sad"];
    moodItems.forEach((item, i) => {
      const mood = moodTypes[i];
      const count = moods[mood] || 0;
      const percent = Math.round((count / total) * 100);
      const fill = item.querySelector(".mood-fill");
      if (fill) fill.style.width = percent + "%";
    });

    // Dominant mood
    const dominant = Object.entries(moods).sort((a, b) => b[1] - a[1])[0];
    if (dominant) {
      document.getElementById("insight-mood").textContent =
        dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1);
    }
  }

  renderAchievements() {
    document.querySelectorAll(".achievement").forEach((el) => {
      const key = el.dataset.achievement;
      if (this.achievements[key]?.unlocked) {
        el.classList.remove("locked");
        el.classList.add("unlocked");
      }
    });
  }

  checkAchievements() {
    const posts = JSON.parse(localStorage.getItem("moodspacePosts") || "[]");
    const breathingSessions = JSON.parse(
      localStorage.getItem("breathingSessions") || "[]",
    );
    const streak = this.calculateStreak();

    const checks = {
      "first-post": posts.length >= 1,
      "streak-7": streak >= 7,
      "breathe-10": breathingSessions.length >= 10,
      analyzer: this.activities.filter((a) => a.type === "analyze").length >= 5,
      "journal-30": posts.length >= 30,
      "camera-5":
        this.activities.filter((a) => a.type === "camera").length >= 5,
    };

    let newUnlock = false;
    Object.entries(checks).forEach(([key, condition]) => {
      if (condition && !this.achievements[key].unlocked) {
        this.achievements[key] = {
          unlocked: true,
          date: new Date().toISOString(),
        };
        newUnlock = true;

        // Show toast
        const names = {
          "first-post": "First Post",
          "streak-7": "Week Warrior",
          "breathe-10": "Breathing Master",
          analyzer: "Emotion Analyst",
          "journal-30": "Journal Keeper",
          "camera-5": "Self Explorer",
        };
        if (window.showToast) {
          window.showToast(`Achievement Unlocked: ${names[key]}!`, "success");
        }
      }
    });

    if (newUnlock) {
      this.saveAchievements();
      this.renderAchievements();
    }
  }

  renderWeeklyChart() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const bars = document.querySelectorAll(".chart-bar");

    bars.forEach((bar, i) => {
      const dayIndex = (today.getDay() + i) % 7;
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));

      const dayActivities = this.activities.filter((a) => {
        const actDate = new Date(a.timestamp);
        return actDate.toDateString() === date.toDateString();
      });

      const height = Math.min(100, dayActivities.length * 20);
      bar.style.height = height + "%";
      bar.dataset.count = dayActivities.length;
    });
  }

  renderInsights() {
    // Already handled in renderStats
  }

  // Actions
  handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      window.showToast?.("Image too large. Max 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.profile.avatar = e.target.result;
      this.avatarPreview.src = e.target.result;
      this.saveProfile();
      this.saveActivity("profile", "Updated profile photo");
      window.showToast?.("Profile photo updated!", "success");
    };
    reader.readAsDataURL(file);
  }

  enterEditMode() {
    this.nameInput.value = this.profile.name || "";
    this.emailInput.value = this.profile.email || "";
    this.bioInput.value = this.profile.bio || "";
    this.locationInput.value = this.profile.location || "";
    this.occupationInput.value = this.profile.occupation || "";
    this.interestsInput.value = this.profile.interests?.join(", ") || "";

    this.profileView.style.display = "none";
    this.profileForm.style.display = "block";
    this.btnEdit.style.display = "none";
  }

  cancelEdit() {
    this.profileView.style.display = "block";
    this.profileForm.style.display = "none";
    this.btnEdit.style.display = "inline-flex";
  }

  saveProfileData(e) {
    e.preventDefault();

    this.profile.name = this.nameInput.value.trim();
    this.profile.email = this.emailInput.value.trim();
    this.profile.bio = this.bioInput.value.trim();
    this.profile.location = this.locationInput.value.trim();
    this.profile.occupation = this.occupationInput.value.trim();
    this.profile.interests = this.interestsInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    this.saveProfile();
    this.renderProfile();
    this.cancelEdit();
    this.saveActivity("profile", "Updated profile information");

    window.showToast?.("Profile saved successfully!", "success");
  }

  switchTab(tabName) {
    document
      .querySelectorAll(".nav-tab")
      .forEach((t) => t.classList.remove("active"));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add("active");

    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.remove("active"));
    document.getElementById(`tab-${tabName}`)?.classList.add("active");
  }

  calculateStreak() {
    if (this.activities.length === 0) return 0;

    const dates = [
      ...new Set(
        this.activities.map((a) => new Date(a.timestamp).toDateString()),
      ),
    ].sort((a, b) => new Date(b) - new Date(a));

    let streak = 1;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      if ((prev - curr) / 86400000 === 1) streak++;
      else break;
    }

    return streak;
  }

  timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }

    return "Just now";
  }

  clearAllData() {
    if (
      !confirm(
        "Are you sure? This will delete all your local data including sessions, activities, and settings.",
      )
    )
      return;

    localStorage.removeItem("moodspaceProfile");
    localStorage.removeItem("moodspaceActivities");
    localStorage.removeItem("moodspaceSettings");
    localStorage.removeItem("moodspaceAchievements");
    localStorage.removeItem("breathingSessions");
    localStorage.removeItem("moodspacePosts");

    window.showToast?.("All data cleared. Refreshing...", "success");
    setTimeout(() => location.reload(), 1500);
  }

  resetProfile() {
    if (!confirm("Reset your profile to defaults?")) return;

    this.profile = {
      name: "",
      email: "",
      bio: "Your wellness journey starts here",
      location: "Earth",
      occupation: "",
      interests: [],
      avatar: null,
      memberSince: new Date().toISOString(),
      joinYear: new Date().getFullYear(),
    };

    this.saveProfile();
    this.renderProfile();
    window.showToast?.("Profile reset to defaults", "success");
  }
}

// Track page activities
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".profile-page")) {
    window.profileManager = new ProfileManager();
  }
});
