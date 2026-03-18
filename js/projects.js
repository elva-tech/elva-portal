function populateProjectMembers(data) {
  const select = document.getElementById("projectTeamMembers");
  if (!select) return;

  select.innerHTML = "";

  // 🔹 Employees group
  const empGroup = document.createElement("optgroup");
  empGroup.label = "Employees";

  (data.employees || []).forEach(e => {
    const option = document.createElement("option");
    option.value = e.id;
    option.textContent = `${e.name} (${e.id})`;
    empGroup.appendChild(option);
  });

  // 🔹 Interns group
  const internGroup = document.createElement("optgroup");
  internGroup.label = "Interns";

  (data.interns || []).forEach(i => {
    const option = document.createElement("option");
    option.value = i.intern_id;
    option.textContent = `${i.name} (${i.intern_id})`;
    internGroup.appendChild(option);
  });

  // append both groups
  select.appendChild(empGroup);
  select.appendChild(internGroup);
}

function renderProjectCards(projects) {
  Promise.all([getEmployees(), getInterns()]).then(([empResp, intResp]) => {
    const employees = empResp.data || [];
    const interns = intResp.data || [];

    const container = document.getElementById("projectsCardContainer");
    if (!container) return;

    container.innerHTML = `<div class="project-card-grid">${projects
      .map((p) => {
        const owner = employees.find((e) => e.id === p.owner_id);
        const ownerName = owner ? owner.name : p.owner_id;

        const members = (p.team_members || "")
          .split("|")
          .map((id) => {
            const emp = employees.find((e) => e.id === id);
            const intern = interns.find((i) => i.intern_id === id);
            return emp?.name || intern?.name || id;
          })
          .filter(Boolean);

        return `
          <div class="project-card">
            <h3>${p.project_name}</h3>

            <p><strong>Description:</strong> ${p.description || "-"}</p>

            <p><strong>Project Manager:</strong> ${ownerName}</p>

            <p><strong>Status:</strong> ${p.status}</p>

            <p><strong>Team Members:</strong> ${members.join(", ")}</p>

            <p><strong>Timeline:</strong> 
              ${new Date(p.start_date).toLocaleDateString()} 
              – 
              ${new Date(p.end_date).toLocaleDateString()}
            </p>

            <p><strong>Tech Stack:</strong> ${p.tech_stack || "-"}</p>

            <p><strong>Repository:</strong> 
              ${
                p.repository_url
                  ? `<a href="${p.repository_url}" target="_blank">View</a>`
                  : "Not provided"
              }
            </p>
          </div>
          `;
      })
      .join("")}</div>`;
    // Add click listeners for details
    // container.querySelectorAll(".project-card").forEach((card) => {
    //   card.addEventListener("click", () => {
    //     const projectId = card.dataset.id;
    //     const project = projects.find((p) => p.project_id === projectId);
    //     if (project) showProjectDetail(project);
    //   });
    // });
  });
}

function populateProjectOwnerDropdown() {
  const select = document.getElementById("projectOwner");
  if (!select) return;

  getEmployees().then((resp) => {
    const employees = resp.data || [];

    select.innerHTML = employees
      .map((e) => `<option value="${e.id}">${e.name}</option>`)
      .join("");
  });
}

function showProjectDetail(project) {
  const user = JSON.parse(localStorage.getItem("elva_user") || "{}");
  Promise.all([getEmployees(), getInterns()]).then(([empResp, intResp]) => {
    const employees = empResp.data || [];
    const interns = intResp.data || [];

    const owner = employees.find((e) => e.id === project.owner_id);
    const ownerName = owner ? owner.name : project.owner_id;

    const members = (project.team_members || "")
      .split("|")
      .map((id) => {
        const emp = employees.find((e) => e.id === id);
        const intern = interns.find((i) => i.intern_id === id);
        return emp?.name || intern?.name || id;
      })
      .filter(Boolean);

    const modal = document.getElementById("projectModal");
    const body = document.getElementById("projectModalBody");

    const start = new Date(project.start_date).toLocaleDateString();
    const end = new Date(project.end_date).toLocaleDateString();

    body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2>${project.project_name}</h2>
    </div>

    <p>
    <strong>Description:</strong>
    <span data-field="description">${project.description}</span>
    </p>

    <p>
    <strong>Project Manager:</strong>
    <span data-field="owner_id">${ownerName}</span>
    </p>

    <p>
    <strong>Team Members:</strong>
    <span data-field="team_members">${members.join(", ")}</span>
    </p>

    <p>
    <strong>Timeline:</strong>
    <span data-field="start_date">${start}</span>
    -
    <span data-field="end_date">${end}</span>
    </p>

    <p>
    <strong>Status:</strong>
    <span data-field="status">${project.status}</span>
    </p>

    <p>
    <strong>Tech Stack:</strong>
    <span data-field="tech_stack">${project.tech_stack || ""}</span>
    </p>

    <p>
    <strong>Repository:</strong>
    <span data-field="repository_url">
    ${
      project.repository_url
        ? `<a href="${project.repository_url}" target="_blank">${project.repository_url}</a>`
        : "Not provided"
    }
    </span>
    </p>`;

    // ${user.role.toLowerCase() === "admin" ? `<button id="editProjectBtn" class="primary-btn">Edit Project</button>` : ""}
    // `;

    modal.style.display = "block";

    const closeBtn = document.getElementById("closeProjectModalBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    document.getElementById("editProjectBtn").addEventListener("click", () => {
      enableProjectEdit(project, employees, interns);
    });
  });
}

function configureProjectAccess() {
  const user = JSON.parse(localStorage.getItem("elva_user") || "{}");
  const projectSection = document.getElementById("projects");
  if (!projectSection) return;
  const form = document.getElementById("projectForm");
  if (user.role !== "admin") {
    if (form) form.style.display = "none";
  } else {
    if (form) form.style.display = "grid";
  }
}

function loadProjects() {
  configureProjectAccess();
  const user = JSON.parse(localStorage.getItem("elva_user") || "{}");
  getProjects()
    .then((resp) => {
      let projects = Array.isArray(resp.data) ? resp.data : [];
      if (user.role === "employee") {
        projects = projects.filter((p) => {
          const members = (p.team_members || "")
            .split("|")
            .map((m) => m.trim())
            .filter(Boolean);
          return p.owner === user.name || members.includes(user.id);
        });
      } else if (user.role === "intern") {
        projects = projects.filter((p) => {
          const members = (p.team_members || "")
            .split("|")
            .map((m) => m.trim())
            .filter(Boolean);
          return members.includes(user.id);
        });
      }
      renderProjectCards(projects);
    })
    .catch((err) => showNotification(err.message, true));
}

function renderProjectEditForm(project, employees, interns) {
  const body = document.getElementById("projectModalBody");

  const employeeOptions = employees
    .map(
      (e) =>
        `<option value="${e.id}" ${e.id === project.owner_id ? "selected" : ""}>${e.name}</option>`,
    )
    .join("");

  const users = [
    ...employees.map((e) => ({ id: e.id, name: e.name })),
    ...interns.map((i) => ({ id: i.intern_id, name: i.name })),
  ];

  const memberOptions = users
    .map((u) => {
      const selected = (project.team_members || "").includes(u.id)
        ? "selected"
        : "";

      return `<option value="${u.id}" ${selected}>${u.name}</option>`;
    })
    .join("");

  body.innerHTML = `
    <h2>Edit Project</h2>

    <input id="editProjectName" value="${project.project_name}" />

    <textarea id="editProjectDescription">${project.description}</textarea>

    <label>Project Manager</label>
    <select id="editProjectOwner">${employeeOptions}</select>

    <label>Team Members</label>
    <select id="editProjectMembers" multiple>
      ${memberOptions}
    </select>

    <label>Start Date</label>
    <input type="date" id="editProjectStart" value="${project.start_date.split("T")[0]}" />

    <label>End Date</label>
    <input type="date" id="editProjectEnd" value="${project.end_date.split("T")[0]}" />

    <label>Status</label>
    <select id="editProjectStatus">
      <option value="active" ${project.status === "active" ? "selected" : ""}>Active</option>
      <option value="completed" ${project.status === "completed" ? "selected" : ""}>Completed</option>
      <option value="onhold" ${project.status === "onhold" ? "selected" : ""}>On Hold</option>
    </select>

    <br><br>

    <button id="saveProjectChanges">Save Changes</button>
    <button id="cancelEditProject">Cancel</button>
  `;

  document
    .getElementById("cancelEditProject")
    .addEventListener("click", () => showProjectDetail(project));
}

function enableProjectEdit(project, employees, interns) {
  const body = document.getElementById("projectModalBody");

  const employeeOptions = employees
    .map(
      (e) =>
        `<option value="${e.id}" ${e.id === project.owner_id ? "selected" : ""}>${e.name}</option>`,
    )
    .join("");

  const users = [
    ...employees.map((e) => ({ id: e.id, name: e.name })),
    ...interns.map((i) => ({ id: i.intern_id, name: i.name })),
  ];

  const memberOptions = users
    .map((u) => {
      const selected = (project.team_members || "").includes(u.id)
        ? "selected"
        : "";

      return `<option value="${u.id}" ${selected}>${u.name}</option>`;
    })
    .join("");

  body.innerHTML = `
  <h2>Edit Project</h2>

  <div class="edit-project-grid">

    <div>
      <label>Project Name</label>
      <input id="edit_project_name" value="${project.project_name}">
    </div>

    <div>
      <label>Project Manager</label>
      <select id="edit_owner">${employeeOptions}</select>
    </div>

    <div class="full-width">
      <label>Description</label>
      <textarea id="edit_description">${project.description}</textarea>
    </div>

    <div>
      <label>Start Date</label>
      <input type="date" id="edit_start" value="${project.start_date.split("T")[0]}">
    </div>

    <div>
      <label>End Date</label>
      <input type="date" id="edit_end" value="${project.end_date.split("T")[0]}">
    </div>

    <div>
      <label>Status</label>
      <select id="edit_status">
        <option ${project.status === "active" ? "selected" : ""}>active</option>
        <option ${project.status === "completed" ? "selected" : ""}>completed</option>
        <option ${project.status === "onhold" ? "selected" : ""}>onhold</option>
      </select>
    </div>

    <div class="full-width">
      <label>Team Members</label>
      <select id="edit_members" multiple>${memberOptions}</select>
    </div>

    <div class="full-width">
      <label>Tech Stack</label>
      <input id="edit_tech" value="${project.tech_stack || ""}">
    </div>

    <div class="full-width">
      <label>Repository</label>
      <input id="edit_repo" value="${project.repository_url || ""}">
    </div>

  </div>

  <div class="modal-actions">
    <button id="saveProjectBtn" class="primary-btn">Save Changes</button>
    <button id="cancelProjectBtn" class="secondary-btn">Cancel</button>
  </div>
  `;

  document.getElementById("cancelProjectBtn").addEventListener("click", () => {
    showProjectDetail(project);
  });

  document.getElementById("saveProjectBtn").addEventListener("click", () => {
    const selectedMembers = Array.from(
      document.getElementById("edit_members").selectedOptions,
    ).map((o) => o.value);

    const updatedProject = {
      project_id: project.project_id,
      project_name: document.getElementById("edit_project_name").value.trim(),
      description: document.getElementById("edit_description").value.trim(),
      owner_id: document.getElementById("edit_owner").value,
      team_members: selectedMembers.join("|"),
      start_date: document.getElementById("edit_start").value,
      end_date: document.getElementById("edit_end").value,
      status: document.getElementById("edit_status").value,
      tech_stack: document.getElementById("edit_tech").value.trim(),
      repository_url: document.getElementById("edit_repo").value.trim(),
    };

    updateProject(updatedProject)
      .then(() => {
        showNotification("Project updated successfully");

        document.getElementById("projectModal").style.display = "none";

        refreshProjects();
      })
      .catch((err) => showNotification(err.message, true));
  });
}

function refreshProjects() {
  getProjects()
    .then((resp) => {
      const projects = resp.data || [];

      renderProjectCards(projects);
    })
    .catch((err) => showNotification(err.message, true));
}

populateProjectOwnerDropdown();
const projectForm = document.getElementById("projectForm");
Promise.all([getEmployees(), getInterns()])
  .then(([empResp, intResp]) => {
    populateProjectMembers({
      employees: empResp.data || [],
      interns: intResp.data || []
    });
  });

document.getElementById("closeProjectModal").addEventListener("click", () => {
  document.getElementById("projectModal").style.display = "none";
});

window.onclick = function (event) {
  const modal = document.getElementById("projectModal");

  if (event.target === modal) {
    modal.style.display = "none";
  }
};
if (projectForm) {
  projectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const start = document.getElementById("projectStartDate").value;
    const end = document.getElementById("projectDeadline").value;
    if (start && end && new Date(end) < new Date(start)) {
      showNotification("Deadline cannot be earlier than Start Date", true);
      return;
    }
    const selectedMembers = Array.from(
      document.getElementById("projectTeamMembers").selectedOptions,
    ).map((o) => o.value);
    const data = {
      project_id: document.getElementById("projectId").value || undefined,
      project_name: document.getElementById("projectName").value.trim(),
      description: document.getElementById("projectDescription").value.trim(),
      owner_id: document.getElementById("projectOwner").value.trim(),
      team_members: selectedMembers.join("|"),
      start_date: start,
      end_date: end,
      status: document.getElementById("projectStatus").value,
      tech_stack:
        document.getElementById("projectTechStack")?.value.trim() || "",
      repository_url:
        document.getElementById("projectRepositoryUrl")?.value.trim() || "",
    };
    const user = JSON.parse(localStorage.getItem("elva_user") || "{}");
    if (user.role !== "admin") {
      showNotification("Only admins can manage projects", true);
      return;
    }
    const action = data.project_id ? updateProject(data) : createProject(data);
    action
      .then(() => {
        showNotification("Project saved");
        projectForm.reset();
        refreshProjects();
      })
      .catch((err) => showNotification(err.message, true));
  });
}
