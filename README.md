# Taskora — Collaborative Project Management Tool
> **CodeAlpha Full Stack Development Internship — Task 3**  
> Built by **Abdalle Hussein** ([@Abdalle13](https://github.com/Abdalle13))

A modern, full-stack collaborative project management platform built to streamline team workflows, task tracking, and project delivery—inspired by Trello and Asana.

---

## 🌟 Overview & Key Features

Taskora provides an intuitive workspace for teams to collaborate across projects, task boards, and real-time updates.

### 1. 🔐 Authentication & Role-Based Access
- Secure JWT-based authentication stored in **HttpOnly, SameSite cookies** (preventing XSS token theft).
- User registration, login, profile management, and session validation.
- 1-click **Instant Demo Login** for quick review and evaluation.

### 2. 📁 Group Project Management
- Create, update, archive, and manage multi-member group projects.
- Role management per project: `Owner`, `Admin`, and `Member`.
- Invite team members by email and manage permissions dynamically.

### 3. 📋 Interactive Kanban Boards & Task Workflow
- Dynamic task boards with 4 workflow stages:
  - **To Do**
  - **In Progress**
  - **In Review**
  - **Done**
- Task metadata: priority levels (`Urgent`, `High`, `Medium`, `Low`), due dates, assignees, and descriptions.
- Instant drag & column status updates with persistent database synchronization.

### 4. 💬 Task Comments & Collaboration
- Team communication within each task card.
- Author attribution, timestamps, and real-time conversation trail.

### 5. 📊 Dashboard Metrics & Activity Audit
- Real-time analytics: total projects, assigned tasks, workload distribution, and overdue warnings.
- Visual completion progress bars across all active projects.
- Project-level audit log recording member actions and task status transitions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Axios, Lucide Icons |
| **Backend** | Node.js, Express.js (RESTful API), Helmet, CORS, Cookie-Parser, BcryptJS, JWT |
| **Database** | MongoDB Atlas / Local MongoDB via Mongoose ODM |
| **Testing** | Vitest, React Testing Library, Node.js Native Test Runner, Supertest |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **MongoDB**: MongoDB Atlas URI (configured in `server/.env`) or local MongoDB

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Abdalle13/CodeAlpha_ProjectManagementTool.git
cd CodeAlpha_ProjectManagementTool
npm install
```

### 2. Environment Variables
Copy the example environment files:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Ensure `server/.env` has your `MONGODB_URI` and `JWT_SECRET`.

### 3. Seed Realistic Demo Data
Populate the database with pre-configured projects, team members, tasks, and comments:
```bash
npm run seed
```

### 4. Start Development Servers
Run both frontend and backend concurrently:
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## ⚡ Demo Credentials

For quick evaluation or recording your project walkthrough:

| Role | Email | Password |
|---|---|---|
| **Lead Developer (Admin)** | `demo@taskora.io` | `Password123!` |
| **UI/UX Designer** | `sarah@taskora.io` | `Password123!` |
| **Full Stack Engineer** | `alex@taskora.io` | `Password123!` |

*(You can also click the **"⚡ Instant Demo Login"** button on the login screen to sign in immediately.)*

---

## 📂 Repository Structure

```
CodeAlpha_ProjectManagementTool/
├── client/                     # Frontend React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI components & dialogs
│   │   ├── context/            # AuthContext & ThemeContext
│   │   ├── layouts/            # AppLayout (Sidebar, Header) & AuthLayout
│   │   ├── lib/                # API client & helpers
│   │   └── pages/              # Dashboard, Projects, Tasks, Admin, Login
├── server/                     # Backend Express.js REST API
│   ├── src/
│   │   ├── config/             # Database connection & env variables
│   │   ├── controllers/        # Auth, Project, Task, Comment, Dashboard
│   │   ├── middleware/         # Auth verification, rate limiting, origin guard
│   │   ├── models/             # Mongoose schemas (User, Project, Task, Comment, Activity)
│   │   ├── routes/             # Express API routes
│   │   └── seed.js             # Realistic database seeder
└── package.json                # Root workspace configuration
```

---

## 🧪 Testing & Build

```bash
# Build the production frontend
npm run build

# Run frontend tests
npm run test -w client

# Run backend integration tests
npm run test -w server
```

---

## 👨‍💻 Author

- **Abdalle Hussein** — Full Stack Development Intern at **CodeAlpha**
- GitHub: [@Abdalle13](https://github.com/Abdalle13)
- Project Repository: `CodeAlpha_ProjectManagementTool`
