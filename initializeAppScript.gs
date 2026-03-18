function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    { name: 'users', headers: ['id', 'name', 'email', 'password', 'role', 'status', 'phone'] },
    { name: 'employees', headers: ['id', 'name', 'email', 'designation', 'department', 'joining_date', 'status'] },
    { name: 'interns', headers: ['intern_id', 'name', 'college', 'mentor', 'start_date', 'end_date', 'project', 'status'] },
    { name: 'projects', headers: ['project_id', 'project_name', 'description', 'owner', 'team_members', 'start_date', 'deadline', 'status', 'tech_stack', 'repository_url'] },
    { name: 'leaves', headers: ['leave_id', 'user_id', 'leave_type', 'start_date', 'end_date', 'reason', 'status'] },
    { name: 'assets', headers: ['asset_id', 'asset_name', 'serial_number', 'assigned_to', 'assigned_date', 'status'] },
    { name: 'activity_logs', headers: ['timestamp', 'description'] }
  ];

  sheets.forEach(function(sheetConfig) {
    let sheet = ss.getSheetByName(sheetConfig.name);
    if (!sheet) {
      sheet = ss.insertSheet(sheetConfig.name);
      sheet.appendRow(sheetConfig.headers);
      Logger.log('Created sheet: ' + sheetConfig.name);
    } else {
      const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const needed = sheetConfig.headers;
      const same = needed.length === currentHeaders.length && needed.every((h, i) => h === currentHeaders[i]);
      if (!same) {
        sheet.clear();
        sheet.appendRow(sheetConfig.headers);
        Logger.log('Reset headers for existing sheet: ' + sheetConfig.name);
      }
    }
  });

  return { success: true, message: 'ELVA Workspace database initialized.' };
}
