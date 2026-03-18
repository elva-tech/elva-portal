# ELVA Workspace

## Project Overview

ELVA Workspace is an internal portal for ELVA Tech to manage employees, interns, projects, leaves, approvals, and assets using Google Apps Script backend with Google Sheets as datastore and vanilla HTML/CSS/JS frontend.

## Folder Structure

- `index.html`
- `login.html`
- `dashboard.html`
- `/css/styles.css`
- `/js/api.js`
- `/js/auth.js`
- `/js/dashboard.js`
- `/js/employees.js`
- `/js/interns.js`
- `/js/projects.js`
- `/js/leaves.js`
- `/js/assets.js`
- `Code.gs`

## Google Sheets Schema

Sheets to create:

### users
id, name, email, password, role, status, phone

### employees
id, name, email, designation, department, joining_date, status

### interns
intern_id, name, college, mentor, start_date, end_date, project, status

### projects
project_id, project_name, description, owner, team_members, start_date, deadline, status

### leaves
leave_id, user_id, leave_type, start_date, end_date, reason, status

### assets
asset_id, asset_name, serial_number, assigned_to, assigned_date, status

### activity_logs
timestamp, description

## Apps Script Deployment (Web App)

1. Open the Apps Script project.
2. Replace `SS_ID` in `Code.gs` with your spreadsheet ID.
3. Deploy > New deployment > Web app.
4. Access: Anyone with link.
5. Copy Deployment URL and replace `API_BASE_URL` in `js/api.js` with that URL.

## Usage

1. Open `index.html`.
2. Login with a user in `users` sheet.
3. Use the dashboard to manage modules.
