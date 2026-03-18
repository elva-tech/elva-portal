const API_BASE_URL = "https://script.google.com/macros/s/AKfycbxrMTtCtunHRqbiVpaZQdnngVBhvwu2bAnuNShC_148nR6bDbSRn7W4BHiIPp8SnMUQ/exec";

function showLoader() {
  let loader = document.getElementById('globalLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.innerHTML = '<div class="loader-box"><div class="loader"></div></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
}

function hideLoader() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.style.display = 'none';
}

function showToast(message, type = 'info') {
  // Simple toast implementation
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

async function apiRequest(action, data = {}) {
  const formData = new FormData();
  formData.append("action", action);
  formData.append("data", JSON.stringify(data));

  showLoader();
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      body: formData,
    });
    const json = await response.json();
    return json;
  } finally {
    hideLoader();
  }
}

function getDepartments() {
  return apiRequest("getDepartments");
}
function getDesignations() {
  return apiRequest("getDesignations");
}
function loginUser(email, password) {
  return apiRequest("loginUser", { email, password });
}
function getDashboardData() {
  return apiRequest("getDashboardData");
}
function getEmployees() {
  return apiRequest("getEmployees");
}
function addEmployee(data) {
  return apiRequest("addEmployee", data);
}
function updateEmployee(data) {
  return apiRequest("updateEmployee", data);
}
function deleteEmployee(id) {
  return apiRequest("deleteEmployee", { id });
}
function getInterns() {
  return apiRequest("getInterns");
}
function addIntern(data) {
  return apiRequest("addIntern", data);
}
function getProjects() {
  return apiRequest("getProjects");
}
function createProject(data) {
  return apiRequest("createProject", data);
}
function updateProject(data) {
  return apiRequest("updateProject", data);
}
function applyLeave(data) {
  return apiRequest("applyLeave", data);
}
function getLeaves() {
  return apiRequest("getLeaves");
}
function getLeavePolicy() {
  return apiRequest("getLeavePolicy");
}
function approveLeave(id, approverId) {
  return apiRequest("approveLeave", { leave_id: id, approved_by: approverId });
}
function rejectLeave(id, approverId) {
  return apiRequest("rejectLeave", { leave_id: id, approved_by: approverId });
}
function getAssets() {
  return apiRequest("getAssets");
}
function addAsset(data) {
  return apiRequest("addAsset", data);
}
function assignAsset(data) {
  return apiRequest("assignAsset", data);
}
function updateProfile(data) {
  return apiRequest("updateProfile", data);
}
function getActivityLogs() {
  return apiRequest("getActivityLogs");
}
