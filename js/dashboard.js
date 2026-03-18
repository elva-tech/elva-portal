function setSection(section) {
  document
    .querySelectorAll(".sidebar nav a")
    .forEach((a) => a.classList.remove("active"));
  document.querySelectorAll(".section").forEach((s) => {
    s.hidden = true;
    s.classList.remove("active");
  });
  const selectedNav = document.querySelector(
    `.sidebar nav a[data-section="${section}"]`,
  );
  if (selectedNav) selectedNav.classList.add("active");
  const sectionEl = document.getElementById(section);
  if (sectionEl) {
    sectionEl.hidden = false;
    sectionEl.classList.add("active");
    if (section === "my-approvals") {
      loadMyApprovals();
    }
  }
  // document.getElementById("pageTitle").textContent =
  //   section.charAt(0).toUpperCase() + section.slice(1);
  const el = document.getElementById("pageTitle");
  if (el) {
    el.textContent = section.charAt(0).toUpperCase() + section.slice(1);
  }
}

function showNotification(message, isError = false) {
  const n = document.getElementById("notifications");
  if (!n) return;
  n.textContent = message;
  n.style.color = isError ? "#e74c3c" : "#2ecc71";
  setTimeout(() => {
    n.textContent = "";
  }, 4000);
}

function renderStats(cards) {
  const container = document.getElementById("statsCards");
  if (!container) return;
  container.innerHTML = cards
    .map((c) => `<div class="card"><h3>${c.title}</h3><p>${c.value}</p></div>`)
    .join("");
}

function renderChartEmployeesInterns(totalEmployees, totalInterns) {
  const ctx = document.getElementById("chartEmployeesInterns");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Employees", "Interns"],
      datasets: [
        {
          label: "Workforce",
          data: [totalEmployees, totalInterns],
          backgroundColor: ["#0b69ff", "#4CAF50"],
          barThickness: 40, // 👈 add this
          maxBarThickness: 50, // 👈 and this to limit the max thickness
          categoryPercentage: 0.6,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function renderChartProjectsVsTeamMembers(projects) {
  const ctx = document.getElementById("chartProjectStatus");
  if (!ctx) return;

  const labels = projects.map((p) => p.project_name);

  const values = projects.map((p) => {
    const members = (p.team_members || "").split("|").filter(Boolean);

    const uniqueMembers = new Set(members);

    if (p.owner_id) {
      uniqueMembers.add(p.owner_id);
    }

    return uniqueMembers.size;
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Team Members",
          data: values,
          barThickness: 40, // 👈 add this
          maxBarThickness: 50, // 👈 and this to limit the max thickness
          categoryPercentage: 0.6,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function calculateServicePeriod(joinDate) {
  if (!joinDate) return "N/A";

  const start = new Date(joinDate);
  const today = new Date();

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  let result = [];

  if (years > 0) result.push(`${years} year${years > 1 ? "s" : ""}`);
  if (months > 0) result.push(`${months} month${months > 1 ? "s" : ""}`);
  if (days > 0) result.push(`${days} day${days > 1 ? "s" : ""}`);

  return result.join(" ") || "0 days";
}

function renderMetricsForRole(data, user) {
  const role = user.role.toLowerCase();
  if (role === "admin") {
    setQuickActions(true);
    renderStats([
      { title: "Total Employees", value: data.totalEmployees || 0 },
      { title: "Total Interns", value: data.totalInterns || 0 },
      { title: "Total Projects", value: data.totalProjects || 0 },
      { title: "Pending Approvals", value: data.pendingLeavesApprovals || 0 },
      { title: "Total Assets", value: data.totalAssets || 0 },
    ]);
  } else if (role === "employee") {
    setQuickActions(false);
    getProjects().then((resp) => {
      const projects = resp.data || [];
      const myProjectList = projects.filter(
        (p) =>
          p.owner_id === user.id ||
          (p.team_members &&
            p.team_members
              .split("|")
              .map((v) => v.trim())
              .includes(user.id)),
      );
      getLeaves().then((leaveResp) => {
        const leaves = leaveResp.data || [];
        const approvedLeaves = leaves
          .filter((l) => l.user_id === user.id && l.status === "Approved")
          .reduce((sum, l) => sum + (l.total_days || 0), 0);
        const availableLeaves = 12 - approvedLeaves;
        renderStats([
          { title: "Assigned Projects", value: myProjectList.length || 0 },
          {
            title: "Service Period",
            value: calculateServicePeriod(user.joining_date),
          },
          { title: "Available Leaves", value: availableLeaves },
        ]);
      });
    });
  } else if (role === "intern") {
    setQuickActions(false);

    Promise.all([getInterns(), getProjects(), getEmployees(), getLeaves()])
      .then(([internResp, projResp, empResp, leaveResp]) => {
        const interns = internResp.data || [];
        const projects = projResp.data || [];
        const employees = empResp.data || [];
        const leaves = leaveResp.data || [];

        const profile = interns.find((i) => i.intern_id === user.id);

        /* Assigned Project */

        let assignedProject = "N/A";

        const project = projects.find((p) =>
          (p.team_members || "").split("|").includes(user.id),
        );

        if (project) assignedProject = project.project_name;

        /* Mentor */

        let mentor = "N/A";

        if (profile && profile.mentor) {
          const mentorObj = employees.find((e) => e.id === profile.mentor);
          mentor = mentorObj ? mentorObj.name : profile.mentor;
        }

        /* Service Period */

        let duration = "N/A";

        if (profile && profile.joining_date && profile.end_date) {
          const from = new Date(profile.joining_date);
          const to = new Date(profile.end_date);

          const format = (d) =>
            d.toLocaleString("en-US", { month: "short", year: "numeric" });

          duration = `${format(from)} – ${format(to)}`;
        }

        /* Leaves */

        const approvedLeaves = leaves
          .filter((l) => l.user_id === user.id && l.status === "Approved")
          .reduce((sum, l) => sum + (l.total_days || 0), 0);

        const availableLeaves = 6 - approvedLeaves;

        renderStats([
          { title: "Assigned Project", value: assignedProject },
          { title: "Mentor", value: mentor },
          {
            title: "Service Period",
            value: calculateServicePeriod(profile?.joining_date),
          },
          { title: "Available Leaves", value: availableLeaves },
        ]);
      })
      .catch((err) => showNotification(err.message, true));
  }
  const activity = document.getElementById("recentActivities");
  const panel = document.querySelector(".recent-activity-panel");
  const logs = (data.activityLogs || []).slice(0, 10);

  if (panel) panel.style.display = "none";

  if (activity) {
    activity.innerHTML =
      logs.map((l) => `<li>${l}</li>`).join("") || "<li>No activity yet</li>";
  }

  const currentUser = JSON.parse(localStorage.getItem("elva_user") || "{}");
  if (!panel) return;
  if (currentUser.role.toLowerCase() === "admin") {
    panel.style.display = "block";
  } else {
    getProjects().then((resp) => {
      const projects = resp.data || [];
      const isManager = projects.some((p) => p.owner === currentUser.name);
      panel.style.display = isManager ? "block" : "none";
    });
  }
}

function setQuickActions(show) {
  const container = document.getElementById("quickActions");
  if (!container) return;
  container.innerHTML = show
    ? '<button id="addEmployeeBtn">Add Employee</button><button id="createProjectBtn">Create Project</button><button id="assignAssetBtn">Assign Asset</button><button id="approveLeaveBtn">Approve Leaves</button>'
    : "";
  if (!show) return;
  container
    .querySelector("#addEmployeeBtn")
    .addEventListener("click", () => setSection("employees"));
  container
    .querySelector("#createProjectBtn")
    .addEventListener("click", () => setSection("projects"));
  container
    .querySelector("#assignAssetBtn")
    .addEventListener("click", () => setSection("assets"));
  container
    .querySelector("#approveLeaveBtn")
    .addEventListener("click", () => setSection("leaves"));
}

function loadDashboardData() {
  getDashboardData()
    .then((resp) => {
      const d = resp.data;
      const user = JSON.parse(localStorage.getItem("elva_user") || "{}");
      renderMetricsForRole(d, user);
      //   if (user.role.toLowerCase() === "admin") {
      //     renderChartEmployeesInterns(d.totalEmployees || 0, d.totalInterns || 0);
      //   } else {
      //     const chart = document.getElementById("chartEmployeesInterns");
      //     if (chart) chart.closest(".chart-card").style.display = "none";
      //   }
      renderChartEmployeesInterns(d.totalEmployees || 0, d.totalInterns || 0);
      getProjects().then((resp) => {
        renderChartProjectsVsTeamMembers(resp.data || []);
      });
    })
    .catch((err) =>
      showNotification(err.message || "Failed to load dashboard", true),
    );
}

function applyRoleAccess() {
  const user = JSON.parse(localStorage.getItem("elva_user") || "{}");
  renderBottomNav(user.role);
  if (!user || !user.role.toLowerCase()) return;

  const role = user.role.toLowerCase();

  const menuMap = {
    admin: [
      "dashboard",
      "employees",
      "interns",
      "projects",
      "leaves",
      "my-approvals",
      "assets",
      "profile",
    ],
    employee: ["dashboard", "projects", "leaves", "assets", "profile"],
    intern: ["dashboard", "projects", "leaves", "assets", "profile"],
  };

  const allowedSections = menuMap[role] || ["dashboard"];

  document.querySelectorAll(".sidebar nav a").forEach((nav) => {
    const section = nav.dataset.section;

    if (allowedSections.includes(section)) {
      nav.style.display = "block";
    } else {
      nav.style.display = "none";
    }
  });

  // Approver logic (show My Approvals if project owner)

  if (role === "employee") {
    getProjects().then((resp) => {
      const projects = resp.data || [];
      const isApprover = projects.some((p) => p.owner_id === user.id);

      if (isApprover) {
        const approvalsNav = document.querySelector(
          `.sidebar nav a[data-section="my-approvals"]`,
        );

        if (approvalsNav) approvalsNav.style.display = "block";
      }
    });
  }
}

function initDashboard() {
  applyRoleAccess();
  loadDashboardData();
  loadEmployees();
  loadInterns();
  loadProjects();
  initializeLeaveForm();
  loadLeaves();
  loadAssets();
  loadProfile();
  // populateTeamMembersSelect();

  document.querySelectorAll(".sidebar nav a").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      setSection(item.dataset.section);

      // ✅ CLOSE SIDEBAR ON MOBILE
      const sidebar = document.querySelector(".sidebar");

      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove("open");
      }
    });
  });
}

function loadProfile() {
  const user = localStorage.getItem("elva_user");
  if (!user) return;
  const profile = JSON.parse(user);
  const container = document.getElementById("profileInfo");
  if (container) {
    container.innerHTML = `
      <p><strong>Name:</strong> ${profile.name}</p>
      <p><strong>Email:</strong> ${profile.email}</p>
      <p><strong>Role:</strong> ${profile.role}</p>
      <p><strong>Status:</strong> ${profile.status}</p>
    `;
  }
  const phone = document.getElementById("profilePhone");
  if (phone && profile.phone) phone.value = profile.phone;
}

function renderBottomNav(role) {
  const nav = document.getElementById("bottomNav");
  if (!nav) return;

  let items = [];

  if (role === "admin") {
    items = [
      { section: "dashboard", icon: "🏠", label: "Home" },
      { section: "employees", icon: "👨‍💼", label: "Employees" },
      { section: "interns", icon: "🎓", label: "Interns" },
      { section: "projects", icon: "📁", label: "Projects" },
      { section: "leaves", icon: "📅", label: "Leaves" },
      { section: "profile", icon: "👤", label: "Profile" },
    ];
  }

  if (role === "employee") {
    items = [
      { section: "dashboard", icon: "🏠", label: "Home" },
      { section: "projects", icon: "📁", label: "Projects" },
      { section: "leaves", icon: "📅", label: "Leaves" },
      { section: "assets", icon: "💼", label: "Assets" },
      { section: "profile", icon: "👤", label: "Profile" },
    ];
  }

  if (role === "intern") {
    items = [
      { section: "dashboard", icon: "🏠", label: "Home" },
      { section: "projects", icon: "📁", label: "Projects" },
      { section: "leaves", icon: "📅", label: "Leaves" },
      { section: "profile", icon: "👤", label: "Profile" },
    ];
  }

  nav.innerHTML = items
    .map(
      (item) => `
    <button data-section="${item.section}">
      <span>${item.icon}</span>
      <small>${item.label}</small>
    </button>
  `,
    )
    .join("");

  // attach events
  nav.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;

      setSection(section);

      nav
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

const profileUpdateForm = document.getElementById("profileUpdateForm");
if (profileUpdateForm) {
  profileUpdateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const profile = JSON.parse(localStorage.getItem("elva_user"));
    const phone = document.getElementById("profilePhone").value.trim();
    const password = document.getElementById("profilePassword").value;
    const payload = {
      id: profile.id,
      phone,
      password: password || undefined,
    };
    updateProfile(payload)
      .then(() => {
        profile.phone = phone;
        localStorage.setItem("elva_user", JSON.stringify(profile));
        loadProfile();
        showNotification("Profile updated", false);
      })
      .catch((err) => showNotification(err.message, true));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");

  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".bottom-nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;

      setSection(section);

      // Highlight active
      document
        .querySelectorAll(".bottom-nav button")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
    });
  });
});

window.addEventListener("DOMContentLoaded", function () {
  if (!window.location.pathname.includes("dashboard.html")) return;
  const user = localStorage.getItem("elva_user");
  if (!user) {
    window.location = "login.html";
    return;
  }
  initDashboard();
});
