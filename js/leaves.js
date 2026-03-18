function calculateLeaveDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let days = 0;
  const current = new Date(start);

  while (current <= end) {
    if (current.getDay() !== 0) {
      days++; // Skip Sundays
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/* ============================= */
/* LOAD LEAVES TABLE */
/* ============================= */

function loadLeaves() {

  const user = JSON.parse(localStorage.getItem("elva_user") || "{}");

  Promise.all([getLeaves(), getEmployees(), getInterns(), getProjects()])
    .then(([leaveResp, empResp, internResp, projResp]) => {

      let leaves = leaveResp.data || [];
      const employees = empResp.data || [];
      const interns = internResp.data || [];
      const projects = projResp.data || [];

      const isAdmin = user.role.toLowerCase() === "admin";

      /* Projects owned by current user */
      const ownedProjects = projects.filter(p => p.owner_id === user.id);
      const ownedProjectIds = ownedProjects.map(p => p.project_id);

      const teamMembers = [];
      ownedProjects.forEach(p => {
        if (p.team_members) {
          teamMembers.push(...p.team_members.split("|"));
        }
      });

      /* Filter visible leaves */

      if (!isAdmin) {

        const isProjectOwner = ownedProjects.length > 0;

        if (isProjectOwner) {

          leaves = leaves.filter(
            l => l.user_id === user.id || teamMembers.includes(l.user_id)
          );

        } else {

          leaves = leaves.filter(l => l.user_id === user.id);

        }

      }

      const table = document.getElementById("leavesTable");
      if (!table) return;

      const rows = leaves.map(l => {

        const employee = employees.find(e => e.id === l.user_id);
        const intern = interns.find(i => i.intern_id === l.user_id);
        const project = projects.find(p => p.project_id === l.project_id);

        const userName = employee?.name || intern?.name || l.user_id;
        const projectName = project?.project_name || l.project_id;

        const canApprove =
          l.status === "Pending" &&
          (isAdmin || ownedProjectIds.includes(l.project_id)) &&
          l.user_id !== user.id;

        return `
        <tr>
          <td>${l.leave_id}</td>
          <td>${userName}</td>
          <td>${projectName}</td>
          <td>${l.leave_type}</td>
          <td>${new Date(l.start_date).toLocaleDateString()}</td>
          <td>${new Date(l.end_date).toLocaleDateString()}</td>
          <td>${l.total_days || "N/A"}</td>
          <td>${l.reason}</td>
          <td>${l.status}</td>
          <td>
            ${
              canApprove
                ? `<button class="action-btn approve" data-id="${l.leave_id}">Approve</button>
                   <button class="action-btn reject" data-id="${l.leave_id}">Reject</button>`
                : ""
            }
          </td>
        </tr>
        `;
      }).join("");

      table.innerHTML = `
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Project</th>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      `;

      /* Approve */

      table.querySelectorAll(".approve").forEach(btn =>
        btn.addEventListener("click", () => {

          approveLeave(btn.dataset.id, user.id)
            .then(() => {
              showNotification("Leave approved");
              loadLeaves();
            })
            .catch(err => showNotification(err.message, true));

        })
      );

      /* Reject */

      table.querySelectorAll(".reject").forEach(btn =>
        btn.addEventListener("click", () => {

          rejectLeave(btn.dataset.id, user.id)
            .then(() => {
              showNotification("Leave rejected");
              loadLeaves();
            })
            .catch(err => showNotification(err.message, true));

        })
      );

    })
    .catch(err => showNotification(err.message, true));

}

/* ============================= */
/* MY APPROVALS */
/* ============================= */

function loadMyApprovals() {
  const user = JSON.parse(localStorage.getItem("elva_user") || "{}");

  Promise.all([getLeaves(), getEmployees(), getInterns(), getProjects()])
    .then(([leaveResp, empResp, internResp, projResp]) => {
      let leaves = leaveResp.data || [];
      const employees = empResp.data || [];
      const interns = internResp.data || [];
      const projects = projResp.data || [];

      if (user.role === "admin") {
        leaves = leaves.filter((l) => l.status === "Pending");
      } else {
        const ownedProjects = projects.filter((p) => p.owner_id === user.id);

        const teamMembers = [];

        ownedProjects.forEach((p) => {
          if (p.team_members) {
            teamMembers.push(...p.team_members.split("|"));
          }
        });

        leaves = leaves.filter(
          (l) => l.status === "Pending" && teamMembers.includes(l.user_id),
        );
      }

      /* Map IDs → Names */

      leaves = leaves.map((l) => {
        const employee = employees.find((e) => e.id === l.user_id);
        const intern = interns.find((i) => i.intern_id === l.user_id);
        const project = projects.find((p) => p.project_id === l.project_id);

        return {
          ...l,
          user_name: employee?.name || intern?.name || l.user_id,
          project_name: project?.project_name || l.project_id,
        };
      });

      renderApprovalsTable(leaves);
    })
    .catch((err) => showNotification(err.message, true));
}

/* ============================= */
/* RENDER APPROVAL TABLE */
/* ============================= */

function renderApprovalsTable(leaves) {
  const table = document.getElementById("approvalsTable");
  if (!table) return;

  const rows = leaves
    .map(
      (l) => `
    <tr>
      <td>${l.leave_id}</td>
      <td>${l.user_name}</td>
      <td>${l.project_name}</td>
      <td>${l.leave_type}</td>
      <td>${new Date(l.start_date).toLocaleDateString()}</td>
      <td>${new Date(l.end_date).toLocaleDateString()}</td>
      <td>${l.total_days}</td>
      <td>${l.reason}</td>
      <td>
        <button class="action-btn approve" data-id="${l.leave_id}">Approve</button>
        <button class="action-btn reject" data-id="${l.leave_id}">Reject</button>
      </td>
    </tr>
  `,
    )
    .join("");

  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>User</th>
        <th>Project</th>
        <th>Type</th>
        <th>Start</th>
        <th>End</th>
        <th>Days</th>
        <th>Reason</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;

  table.querySelectorAll(".approve").forEach((btn) =>
    btn.addEventListener("click", () => {
      const user = JSON.parse(localStorage.getItem("elva_user") || "{}");

      approveLeave(btn.dataset.id, user.id)
        .then(() => {
          showNotification("Leave approved");
          loadMyApprovals();
        })
        .catch((err) => showNotification(err.message, true));
    }),
  );

  table.querySelectorAll(".reject").forEach((btn) =>
    btn.addEventListener("click", () => {
      const user = JSON.parse(localStorage.getItem("elva_user") || "{}");

      rejectLeave(btn.dataset.id, user.id)
        .then(() => {
          showNotification("Leave rejected");
          loadMyApprovals();
        })
        .catch((err) => showNotification(err.message, true));
    }),
  );
}

/* ============================= */
/* INITIALIZE LEAVE FORM */
/* ============================= */

function initializeLeaveForm() {
  const user = JSON.parse(localStorage.getItem("elva_user") || "{}");

  const leaveUserSelect = document.getElementById("leaveUserId");
  const leaveProjectSelect = document.getElementById("leaveProjectId");

  if (!leaveUserSelect || !leaveProjectSelect) return;

  /* ADMIN can choose user */

  if (user.role.toLowerCase() === "admin") {
    Promise.all([getEmployees(), getInterns()]).then(([empResp, intResp]) => {
      const employees = empResp.data || [];
      const interns = intResp.data || [];

      const users = [...employees, ...interns];

      leaveUserSelect.innerHTML = users
        .map((u) => `<option value="${u.id || u.intern_id}">${u.name}</option>`)
        .join("");
    });
  } else {
    /* Employee/Intern → auto select themselves */

    leaveUserSelect.innerHTML = `<option value="${user.id}">${user.name}</option>`;

    leaveUserSelect.disabled = true;
  }

  /* Load projects */

  getProjects().then((resp) => {
    const projects = resp.data || [];

    if (user.role.toLowerCase() === "admin") {
      leaveProjectSelect.innerHTML = projects
        .map(
          (p) => `<option value="${p.project_id}">${p.project_name}</option>`,
        )
        .join("");
    } else {
      const userProjects = projects.filter((p) => {
        const members = (p.team_members || "").split("|");
        return members.includes(user.id);
      });

      leaveProjectSelect.innerHTML = userProjects
        .map(
          (p) => `<option value="${p.project_id}">${p.project_name}</option>`,
        )
        .join("");
    }
  });
}

/* ============================= */
/* LEAVE FORM SUBMIT */
/* ============================= */

const leaveForm = document.getElementById("leaveForm");

if (leaveForm) {
  leaveForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const start = document.getElementById("leaveStartDate").value;
    const end = document.getElementById("leaveEndDate").value;

    if (new Date(end) < new Date(start)) {
      showNotification("End Date cannot be earlier than Start Date", true);
      return;
    }

    const totalDays = calculateLeaveDays(start, end);

    const data = {
      user_id: document.getElementById("leaveUserId").value,
      project_id: document.getElementById("leaveProjectId").value,
      leave_type: document.getElementById("leaveType").value,
      start_date: start,
      end_date: end,
      total_days: totalDays,
      reason: document.getElementById("leaveReason").value.trim(),
      status: "Pending",
    };

    applyLeave(data)
      .then(() => {
        showNotification("Leave applied");

        leaveForm.reset();

        initializeLeaveForm();

        loadLeaves();
      })
      .catch((err) => showNotification(err.message, true));
  });
}

const clearBtn = document.getElementById("clearLeaveForm");

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    const form = document.getElementById("leaveForm");
    if (!form.checkValidity() && !form.querySelector("input:valid")) {
      return;
    }

    form.reset();

    // Optional: clear any notifications
    const notif = document.getElementById("notifications");
    if (notif) notif.textContent = "";
  });
}