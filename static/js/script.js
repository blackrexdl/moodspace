// Production Navbar + Global Interactions
document.addEventListener("DOMContentLoaded", function () {
  // Navbar toggle - production safe
  const hamburger = document.querySelector(".mobile-menu-btn");
  const nav = document.getElementById("navbar");
  const body = document.body;

  if (hamburger && nav) {
    hamburger.onclick = (e) => {
      e.stopPropagation();
      nav.classList.toggle("active");
      body.classList.toggle("no-scroll");
    };

    // Close menu
    document.onclick = (e) => {
      if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
        nav.classList.remove("active");
        body.classList.remove("no-scroll");
      }
    };

    // Escape key
    document.onkeydown = (e) => {
      if (e.key === "Escape") {
        nav.classList.remove("active");
        body.classList.remove("no-scroll");
      }
    };
  }

  // Premium Dark Mode Toggle
  const darkToggle = document.getElementById("dark-toggle");
  if (darkToggle) {
    // Default to dark mode
    body.classList.add("dark");
    darkToggle.innerHTML = '<i class="fas fa-sun"></i>';
    darkToggle.title = "Switch to Light";

    // Load saved if different
    if (localStorage.getItem("darkMode") === "disabled") {
      body.classList.remove("dark");
      darkToggle.innerHTML = '<i class="fas fa-moon"></i>';
      darkToggle.title = "Switch to Dark";
    }

    darkToggle.onclick = () => {
      body.classList.toggle("dark");
      const isDark = body.classList.contains("dark");
      localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
      darkToggle.innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
      darkToggle.title = isDark ? "Switch to Light" : "Switch to Dark";
    };
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Card hover animations
  document.querySelectorAll(".card, .tool-card, .stat-card").forEach((card) => {
    card.onmouseenter = () => (card.style.transform = "translateY(-8px)");
    card.onmouseleave = () => (card.style.transform = "translateY(0)");
  });

  // Button shimmer effect
  document.querySelectorAll(".btn-primary").forEach((btn) => {
    btn.onmousemove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      btn.style.setProperty("--mouse-x", `${x}px`);
    };
  });

  // Profile avatar
  const avatar = document.getElementById("avatar-preview");
  if (avatar) {
    avatar.style.borderRadius = "50%";
    avatar.style.width = "140px";
    avatar.style.height = "140px";
    avatar.style.objectFit = "cover";
  }

  // Form validation visual
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.onsubmit = (e) => {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.innerHTML += '<span class="loading"></span>';
        btn.disabled = true;
      }
    };
  });

  // Toast system
  window.showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--glass);
      backdrop-filter: blur(20px);
      color: var(--dark);
      padding: 1.25rem 2rem;
      border-radius: 20px;
      box-shadow: var(--shadow-hover);
      z-index: 9999;
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      border: 1px solid rgba(255,255,255,0.2);
      max-width: 350px;
      font-weight: 600;
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.transform = "translateX(400px)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  };

  // Intersection Observer for animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 },
  );

  document.querySelectorAll(".card, .tool-card").forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(40px)";
    el.style.transition = "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    observer.observe(el);
  });

  // Feed Like Button Functionality
  document.querySelectorAll(".post-action-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const icon = this.querySelector("i");
      if (this.classList.contains("liked")) {
        this.classList.remove("liked");
        icon.classList.remove("fas");
        icon.classList.add("far");
      } else {
        this.classList.add("liked");
        icon.classList.remove("far");
        icon.classList.add("fas");
      }
    });
  });
});

// Navbar toggle function (legacy)
function toggleNavbar() {
  document.getElementById("navbar").classList.toggle("active");
  document.body.classList.toggle("no-scroll");
}
