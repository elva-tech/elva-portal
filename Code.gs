const SS_ID = 'YOUR_SPREADSHEET_ID';
const SHEETS = {
  employees: 'Employees',
  interns: 'Interns',
  projects: 'Projects',
  leaves: 'Leaves',
  leave_policy: 'Leave_Policy',
  assets: 'Assets',
  activity_logs: 'Activity_Logs'
};

function getSpreadsheet() {
  return SpreadsheetApp.openById(SS_ID);
}

function sheetToJSON(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    row.forEach((value,index) => { obj[headers[index]] = value; });
    return obj;
  });
}

function findRowIndexById(sheetName, idKey, id) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][data[0].indexOf(idKey)] == id) return i + 1;
  }
  return -1;
}

function getTimestamp() {
  return new Date();
}

function logActivity(description) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.activity_logs);
  if (!sheet) return;
  sheet.appendRow([getTimestamp(), description]);
}

function setActivity(message) {
  logActivity(message);
}

function generateId(prefix) {
  return prefix + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getActivityLogs() {
  const logs = sheetToJSON(SHEETS.activity_logs);
  return logs.map(item => `${item.timestamp} - ${item.description}`);
}

function generateId(sheetName, prefix) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return prefix + '001';
  }
  const lastRow = data[data.length - 1];
  const lastId = lastRow[0] || '';
  const number = parseInt(lastId.toString().replace(prefix, ''), 10) || 0;
  return prefix + (number + 1).toString().padStart(3, '0');
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
    switch(action) {
      case 'loginUser': return jsonResponse(loginUser(data.email,data.password));
      case 'getDashboardData': return jsonResponse(getDashboardData());
      case 'getEmployees': return jsonResponse(getEmployees());
      case 'addEmployee': return jsonResponse(addEmployee(data));
      case 'updateEmployee': return jsonResponse(updateEmployee(data));
      case 'deleteEmployee': return jsonResponse(deleteEmployee(data.id));
      case 'getInterns': return jsonResponse(getInterns());
      case 'addIntern': return jsonResponse(addIntern(data));
      case 'getProjects': return jsonResponse(getProjects());
      case 'createProject': return jsonResponse(createProject(data));
      case 'updateProject': return jsonResponse(updateProject(data));
      case 'getLeaves': return jsonResponse(getLeaves());
      case 'applyLeave': return jsonResponse(applyLeave(data));
      case 'approveLeave': return jsonResponse(approveLeave(data.leave_id));
      case 'rejectLeave': return jsonResponse(rejectLeave(data.leave_id));
      case 'getAssets': return jsonResponse(getAssets());
      case 'addAsset': return jsonResponse(addAsset(data));
      case 'assignAsset': return jsonResponse(assignAsset(data));
      case 'updateProfile': return jsonResponse(updateProfile(data));
      case 'getActivityLogs': return jsonResponse(getActivityLogs());
      default: return jsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function jsonResponse(payload, statusCode) {
  return ContentService.createTextOutput(JSON.stringify({ status: statusCode || 200, data: payload })).setMimeType(ContentService.MimeType.JSON);
}

function loginUser(email,password) {
  const users = sheetToJSON(SHEETS.users);
  const user = users.find(u => u.email == email && u.password == password && u.status == 'Active');
  if (!user) {
    return { error: 'Invalid credentials or inactive user' };
  }
  setActivity(`User logged in: ${user.email}`);
  return user;
}

function getDashboardData() {
  const employees = sheetToJSON(SHEETS.employees);
  const interns = sheetToJSON(SHEETS.interns);
  const projects = sheetToJSON(SHEETS.projects);
  const leaves = sheetToJSON(SHEETS.leaves);
  const assets = sheetToJSON(SHEETS.assets);
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const activityLogs = getActivityLogs();
  return {
    totalEmployees: employees.length,
    totalInterns: interns.length,
    activeProjects: projects.filter(p => p.status === 'Active').length,
    pendingLeaves: pendingLeaves,
    totalAssets: assets.length,
    activityLogs: activityLogs.reverse(),
    projectStatus: projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {})
  };
}

function getEmployees() { return sheetToJSON(SHEETS.employees); }

function addEmployee(data) {
  if (!data || !data.name || !data.email || !data.designation || !data.department) {
    return { success: false, message: 'Missing required fields' };
  }
  const sheet = getSpreadsheet().getSheetByName(SHEETS.employees);
  const id = generateId(SHEETS.employees, 'EMP');
  const joiningDate = data.joining_date ? new Date(data.joining_date) : getTimestamp();
  const status = data.status || 'Active';
  sheet.appendRow([id, data.name, data.email, data.designation, data.department, joiningDate, status]);
  logActivity('Employee created: ' + data.name);
  return { success: true, id };
}

function updateEmployee(data) {
  if (!data || !data.id || !data.name || !data.email || !data.designation || !data.department) {
    return { success: false, message: 'Missing required fields' };
  }
  const sheet = getSpreadsheet().getSheetByName(SHEETS.employees);
  const row = findRowIndexById(SHEETS.employees, 'id', data.id);
  if (row < 0) return { success: false, message: 'Employee not found' };
  sheet.getRange(row,2,1,6).setValues([[data.name,data.email,data.designation,data.department,data.joining_date || getTimestamp(),data.status || 'Active']]);
  logActivity('Employee updated: ' + data.name);
  return { success: true };
}

function deleteEmployee(id) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.employees);
  const row = findRowIndexById(SHEETS.employees,'id',id);
  if (row < 0) throw new Error('Employee not found');
  sheet.deleteRow(row);
  setActivity(`Employee deleted: ${id}`);
  return { success: true };
}

function getInterns() { return sheetToJSON(SHEETS.interns); }

function addIntern(data) {
  if (!data || !data.name || !data.college || !data.mentor || !data.start_date || !data.end_date || !data.project) {
    return { success: false, message: 'Missing required fields' };
  }
  const sheet = getSpreadsheet().getSheetByName(SHEETS.interns);
  const id = generateId(SHEETS.interns, 'INT');
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const status = data.status || 'Active';
  sheet.appendRow([id, data.name, data.college, data.mentor, startDate, endDate, data.project, status]);
  logActivity('Intern created: ' + data.name);
  return { success: true, id };
}

function getProjects() { return sheetToJSON(SHEETS.projects); }

function createProject(data) {
  if (!data || !data.project_name || !data.description || !data.owner || !data.team_members || !data.start_date || !data.deadline) {
    return { success: false, message: 'Missing required fields' };
  }
  const sheet = getSpreadsheet().getSheetByName(SHEETS.projects);
  const id = generateId(SHEETS.projects, 'PROJ');
  const status = data.status || 'Active';
  const tech_stack = data.tech_stack || '';
  const repository_url = data.repository_url || '';
  sheet.appendRow([id, data.project_name, data.description, data.owner, data.team_members, new Date(data.start_date), new Date(data.deadline), status, tech_stack, repository_url]);
  logActivity('Project created: ' + data.project_name);
  return { success: true, id };
}

function updateProject(data) {
  if (!data || !data.project_id) return { success: false, message: 'Missing required fields' };
  const sheet = getSpreadsheet().getSheetByName(SHEETS.projects);
  const row = findRowIndexById(SHEETS.projects, 'project_id', data.project_id);
  if (row < 0) return { success: false, message: 'Project not found' };
  const status = data.status || 'Active';
  const tech_stack = data.tech_stack || '';
  const repository_url = data.repository_url || '';
  sheet.getRange(row,2,1,9).setValues([[data.project_name,data.description,data.owner,data.team_members,data.start_date,data.deadline,status,tech_stack,repository_url]]);
  setActivity(`Project updated: ${data.project_name}`);
  return { success: true };
}

function getLeaves() { return sheetToJSON(SHEETS.leaves); }

function getLeavePolicy() { return sheetToJSON(SHEETS.leave_policy); }

function applyLeave(data) {
  if (!data || !data.user_id || !data.project_id || !data.leave_type || !data.start_date || !data.end_date || !data.reason) {
    return { success: false, message: 'Missing required fields' };
  }
  // Determine user_type
  const employees = sheetToJSON(SHEETS.employees);
  const interns = sheetToJSON(SHEETS.interns);
  const userType = employees.some(e => e.id == data.user_id) ? 'employee' : 'intern';
  const sheet = getSpreadsheet().getSheetByName(SHEETS.leaves);
  const id = generateId('LEV');
  const status = data.status || 'Pending';
  const appliedOn = getTimestamp();
  sheet.appendRow([id, data.user_id, userType, data.project_id, data.leave_type, new Date(data.start_date), new Date(data.end_date), data.total_days, data.reason, status, appliedOn, '']);
  logActivity('Leave applied by user: ' + data.user_id);
  return { success: true, id };
}

function approveLeave(data) {
  const leaveId = data.leave_id;
  const approvedBy = data.approved_by;
  const sheet = getSpreadsheet().getSheetByName(SHEETS.leaves);
  const row = findRowIndexById(SHEETS.leaves, 'leave_id', leaveId);
  if (row < 0) return { success: false, message: 'Leave not found' };
  sheet.getRange(row, 10).setValue('Approved'); // status
  sheet.getRange(row, 12).setValue(approvedBy); // approved_by
  const leave = sheetToJSON(SHEETS.leaves).find(l => l.leave_id == leaveId);
  logActivity('Leave approved for user: ' + (leave ? leave.user_id : leaveId) + ' by ' + approvedBy);
  return { success: true };
}

function rejectLeave(data) {
  const leaveId = data.leave_id;
  const approvedBy = data.approved_by;
  const sheet = getSpreadsheet().getSheetByName(SHEETS.leaves);
  const row = findRowIndexById(SHEETS.leaves, 'leave_id', leaveId);
  if (row < 0) return { success: false, message: 'Leave not found' };
  sheet.getRange(row, 10).setValue('Rejected'); // status
  sheet.getRange(row, 12).setValue(approvedBy); // approved_by
  const leave = sheetToJSON(SHEETS.leaves).find(l => l.leave_id == leaveId);
  logActivity('Leave rejected for user: ' + (leave ? leave.user_id : leaveId) + ' by ' + approvedBy);
  return { success: true };
}

function getAssets() { return sheetToJSON(SHEETS.assets); }

function addAsset(data) {
  if (!data || !data.asset_name || !data.serial_number) {
    return { success: false, message: 'Missing required fields' };
  }
  const sheet = getSpreadsheet().getSheetByName(SHEETS.assets);
  const id = generateId(SHEETS.assets, 'AST');
  const assignedDate = data.assigned_date ? new Date(data.assigned_date) : getTimestamp();
  const status = data.status || (data.assigned_to ? 'Assigned' : 'Available');
  sheet.appendRow([id, data.asset_name, data.serial_number, data.assigned_to || '', assignedDate, status]);
  logActivity('Asset created: ' + data.asset_name);
  return { success: true, id };
}

function assignAsset(data) {
  if (!data || !data.asset_id || !data.assigned_to) {
    return { success: false, message: 'Missing required fields' };
  }
  const sheet = getSpreadsheet().getSheetByName(SHEETS.assets);
  const row = findRowIndexById(SHEETS.assets, 'asset_id', data.asset_id);
  if (row < 0) return { success: false, message: 'Asset not found' };
  const assignedDate = data.assigned_date ? new Date(data.assigned_date) : getTimestamp();
  const status = data.status || 'Assigned';
  sheet.getRange(row, 4, 1, 3).setValues([[data.assigned_to, assignedDate, status]]);
  logActivity('Asset assigned: ' + data.asset_id + ' to ' + data.assigned_to);
  return { success: true };
}

function updateProfile(data) {
  const sheet = getSpreadsheet().getSheetByName(SHEETS.users);
  const row = findRowIndexById(SHEETS.users,'id',data.id);
  if (row < 0) throw new Error('User not found');
  const changes = [];
  if (data.phone) { sheet.getRange(row, 7).setValue(data.phone); changes.push('phone'); }
  if (data.password) { sheet.getRange(row, 4).setValue(data.password); changes.push('password'); }
  setActivity(`Profile updated for ${data.id}, fields: ${changes.join(', ')}`);
  return { success: true };
}

function initializeWorkspace() {
  const ss = getSpreadsheet();
  const requiredSheets = ['Employees', 'Interns', 'Projects', 'Leaves', 'Leave_Policy', 'Assets', 'Activity_Logs'];
  requiredSheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Created sheet: ${sheetName}`);
    }
  });

  // Insert default leave policy
  const policySheet = ss.getSheetByName('Leave_Policy');
  if (policySheet.getLastRow() === 0) {
    policySheet.appendRow(['role', 'total_leaves']);
    policySheet.appendRow(['employee', 12]);
    policySheet.appendRow(['intern', 6]);
    Logger.log('Inserted default leave policy');
  }

  return { success: true, message: 'Workspace initialized' };
}
