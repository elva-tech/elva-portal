function showMessage(msg, error = true) {
  const target =
    document.getElementById("authMessage") ||
    document.getElementById("notifications");
  if (!target) return;
  target.textContent = msg;
  target.style.color = error ? "#e74c3c" : "#2ecc71";
  setTimeout(() => {
    target.textContent = "";
  }, 3500);
}

function saveSession(user) {
  localStorage.setItem("elva_user", JSON.stringify(user));
}

function getSession() {
  const u = localStorage.getItem("elva_user");
  return u ? JSON.parse(u) : null;
}

function logout() {
  localStorage.removeItem("elva_user");
  window.location = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      if (!email || !password) {
        showMessage("Please provide credentials.");
        return;
      }
      loginUser(email, password)
        .then((resp) => {
          if (!resp || !resp.data) {
            showMessage("Invalid credentials or inactive user");
            return;
          }
          if (resp.data.error) {
            showMessage(resp.data.error);
            return;
          }
          saveSession(resp.data);
          window.location = "dashboard.html";
        })
        .catch((err) => {
          showMessage(err.message || "Login failed");
        });
    });
  }

  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const user = getSession();
  if (window.location.pathname.includes("dashboard.html") && !user) {
    window.location = "login.html";
  }
  if (user && document.getElementById("userName")) {
    document.getElementById("userName").textContent =
      user.name + " (" + user.role + ")";
  }
});
