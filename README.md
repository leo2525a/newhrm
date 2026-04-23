# HRM System - Complete Human Resource Management System

A full-featured HR Management System inspired by BambooHR and Info-Tech HRMS (Hong Kong).

## Features

### Core Modules
- 👥 **Employee Information Management** - Complete employee profiles, personal data, employment history
- 🏖️ **Leave Management** - Leave application, approval workflow, balance tracking, calendar view
- ⏰ **Attendance Tracking** - Clock in/out, break tracking, attendance reports
- 💰 **Payroll Integration** - Salary calculation, tax deduction, payslip generation (HK-compliant)
- 🎯 **Recruitment & Onboarding** - Job postings, applicant tracking, interview scheduling
- 📊 **Performance Management** - Goal setting, reviews, 360-degree feedback
- 📁 **Document Management** - Store contracts, offer letters, certificates
- 📈 **Reporting & Analytics** - HR dashboards, turnover, headcount, absence reports
- 👤 **Employee Self-Service** - Update personal info, apply leave, view payslips
- 📱 **Mobile Ready** - Responsive design for mobile access

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **Frontend**: React (coming soon)

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your settings

# Build
npm run build

# Start server
npm start
```

## Development

```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register admin
- `POST /api/auth/login` - Login

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Leave
- `GET /api/leave` - Get all leave requests
- `POST /api/leave` - Apply for leave
- `PUT /api/leave/:id/approve` - Approve leave
- `PUT /api/leave/:id/reject` - Reject leave

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out

And many more...

## License

MIT
