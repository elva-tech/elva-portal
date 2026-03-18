function formatDate(dateStr) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`; // 👉 18/03/2026
}

function renderInternsTable(interns) {
  window.internCache = interns;
  const table = document.getElementById("internsTable");
  if (!table) return;

  getEmployees().then((resp) => {
    const employees = resp.data || [];

    const rows = interns
      .map((i) => {
        const mentor = employees.find((e) => e.id === i.mentor);
        const mentorName = mentor ? mentor.name : i.mentor;

        return `
        <tr>
          <td>${i.intern_id}</td>
          <td>${i.name}</td>
          <td>${i.email}</td>
          <td>${mentorName}</td>
          <td>${formatDate(i.joining_date)}</td>
          <td>${i.status}</td>
          <td>
            <button class="action-btn edit" onclick="showMessage()">Edit</button>
            <button class="action-btn delete" onclick="showMessage()">Delete</button>
          </td>
        </tr>`;
      })
      .join("");

    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Mentor</th>
          <th>Start</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    `;
  });
}

// document.querySelectorAll(".action-btn.edit").forEach(btn => {
//   btn.addEventListener("click", () => {
//     editIntern(btn.dataset.id);
//   });
// });

function loadInterns() {
  getInterns()
    .then((resp) => renderInternsTable(resp.data || []))
    .catch((err) => showNotification(err.message, true));
}

function populateMentorDropdown() {
  const select = document.getElementById("internMentor");
  if (!select) return;

  getEmployees().then((resp) => {
    const employees = resp.data || [];

    select.innerHTML = `<option value="">Select Mentor</option>`;

    employees.forEach((emp) => {
      select.innerHTML += `
        <option value="${emp.id}">
          ${emp.name}
        </option>
      `;
    });
  });
}

function populateProjectDropdown() {
  const select = document.getElementById("internProject");
  if (!select) return;

  getProjects().then((resp) => {
    const projects = resp.data || [];
    
    window.projectCache = projects;

    select.innerHTML = `<option value="">Select Project</option>`;

    projects.forEach((p) => {
      select.innerHTML += `
        <option value="${p.project_id}">
          ${p.project_name}
        </option>
      `;
    });
  });
}

// function editIntern(id) {
//   const intern = window.internCache.find((i) => i.id === id);
//   if (!intern) return;

//   document.getElementById("internName").value = intern.name;
//   document.getElementById("internEmail").value = intern.email;
//   document.getElementById("internCollege").value = intern.college;
//   document.getElementById("internMentor").value = intern.mentor;
//   document.getElementById("internProject").value = intern.project;

//   window.editInternId = id;
// }

function deleteIntern(id) {
  if (!confirm("Delete this intern?")) return;

  apiRequest("deleteIntern", { id }).then(() => {
    loadInterns();
  });
}

function showMessage() {
  alert("Currently this option is allowed only from backend Google Sheets. Please update from backend.");
}

// window.editIntern = function(id) {
//   console.log("Editing ID:", id);

//   const intern = window.internCache.find(i => String(i.id) === String(id));

//   if (!intern) {
//     console.log("Intern not found");
//     return;
//   }
//   console.log("Intern data:", intern);
//   // Fill form
//   document.getElementById("internName").value = intern.name || "";
//   document.getElementById("internEmail").value = intern.email || "";
//   document.getElementById("internCollege").value = intern.college || "";
//   document.getElementById("internProject").value = intern.project || "";
//   document.getElementById("internMentor").value = intern.mentor || "";
//   document.getElementById("internStartDate").value = intern.joining_date || "";
//   document.getElementById("internStatus").value = intern.status || "Active";
//   // 🔥 VERY IMPORTANT
//   window.editInternId = id;

//   // UI change
//   document.getElementById("saveInternBtn").textContent = "Update Intern";
// };

document.getElementById("internProject").addEventListener("change", (e) => {
  const projectId = e.target.value;

  const project = window.projectCache.find(p => p.id === projectId);

  if (project) {
    document.getElementById("internMentor").value = project.manager;
  }
});

// document.addEventListener("click", function (e) {
//   if (e.target.classList.contains("edit")) {
//     const id = e.target.dataset.id;
//     editIntern(id);
//   }
// });

const internForm = document.getElementById("internForm");
populateMentorDropdown();
populateProjectDropdown();
if (internForm) {
  internForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const startDate = new Date(
      document.getElementById("internStartDate").value,
    );
    if (startDate.toString() === "Invalid Date") {
      showNotification("Please provide valid internship dates", true);
      return;
    }
    const data = {
      intern_id: document.getElementById("internId").value || undefined,
      name: document.getElementById("internName").value.trim(),
      college: document.getElementById("internCollege").value.trim(),
      email: document.getElementById("internEmail").value.trim(),
      mentor: document.getElementById("internMentor").value,
      joining_date: document.getElementById("internStartDate").value,
      project_id: document.getElementById("internProject").value,
      status: document.getElementById("internStatus").value,
    };
    addIntern(data)
      .then(() => {
        showNotification("Intern added");
        internForm.reset();
        loadInterns();
      })
      .catch((err) => showNotification(err.message, true));
  });
}
