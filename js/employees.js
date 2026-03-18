function populateEmployeeDropdowns() {
  const deptSelect = document.getElementById("employeeDepartment");
  const desigSelect = document.getElementById("employeeDesignation");

  if (!deptSelect || !desigSelect) return;

  // Departments
  getDepartments().then(resp => {
    const departments = resp.data || [];

    deptSelect.innerHTML = departments
      .map(d => `<option value="${d.department}">${d.department}</option>`)
      .join("");
  });

  // Designations
  getDesignations().then(resp => {
    const designations = resp.data || [];

    desigSelect.innerHTML = designations
      .map(d => `<option value="${d.designation}">${d.designation}</option>`)
      .join("");
  });
}

function renderEmployeesTable(employees) {
  const table = document.getElementById("employeesTable");
  if (!table) return;
  const rows = employees
    .map(
      (e) => `
    <tr>
      <td>${e.id}</td><td>${e.name}</td><td>${e.email}</td><td>${e.designation}</td><td>${e.department}</td><td>${e.joining_date}</td><td>${e.status}</td>
      <td><button class="action-btn edit" data-id="${e.id}">Edit</button><button class="action-btn delete" data-id="${e.id}">Delete</button></td>
    </tr>`,
    )
    .join("");
  table.innerHTML = `<thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Designation</th><th>Department</th><th>Joining Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody>`;
  table.querySelectorAll(".edit").forEach((btn) =>
    btn.addEventListener("click", () => {
      const emp = employees.find((item) => item.id === btn.dataset.id);
      if (!emp) return;
      document.getElementById("employeeId").value = emp.id;
      document.getElementById("employeeName").value = emp.name;
      document.getElementById("employeeEmail").value = emp.email;
      document.getElementById("employeeDesignation").value = emp.designation;
      document.getElementById("employeeDepartment").value = emp.department;
      document.getElementById("employeeJoiningDate").value = emp.joining_date;
      document.getElementById("employeeStatus").value = emp.status;
    }),
  );
  table.querySelectorAll(".delete").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!confirm("Delete this employee?")) return;
      deleteEmployee(btn.dataset.id)
        .then(() => {
          showNotification("Employee deleted");
          loadEmployees();
        })
        .catch((err) => showNotification(err.message, true));
    }),
  );
}

function loadEmployees() {
  getEmployees()
    .then((resp) => {
      renderEmployeesTable(resp.data || []);
      populateLeaveUserDropdown(resp.data || []);
    })
    .catch((err) => showNotification(err.message, true));
}

populateEmployeeDropdowns();
const employeeForm = document.getElementById("employeeForm");
if (employeeForm) {
  employeeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      id: document.getElementById("employeeId").value || undefined,
      name: document.getElementById("employeeName").value.trim(),
      email: document.getElementById("employeeEmail").value.trim(),
      designation: document.getElementById("employeeDesignation").value.trim(),
      department: document.getElementById("employeeDepartment").value.trim(),
      joining_date: document.getElementById("employeeJoiningDate").value,
      status: document.getElementById("employeeStatus").value,
    };
    const joiningDate = new Date(data.joining_date);
    if (isNaN(joiningDate.getTime())) {
      showNotification("Please provide a valid joining date", true);
      return;
    }
    const action = data.id ? updateEmployee(data) : addEmployee(data);
    action
      .then(() => {
        showNotification("Employee saved");
        employeeForm.reset();
        loadEmployees();
      })
      .catch((err) => showNotification(err.message, true));
  });
}

function populateLeaveUserDropdown(users) {
  const user = JSON.parse(localStorage.getItem("elva_user") || "{}");

  /* Only admin should populate this dropdown */

  if (user.role.toLowerCase() !== "admin") return;

  const select = document.getElementById("leaveUserId");
  if (!select) return;

  const options = users
    .map((u) => `<option value="${u.id}">${u.name} (${u.email})</option>`)
    .join("");

  select.innerHTML = options;
}
