# Taskora — Collaborative Project Management Tool
> **CodeAlpha Full Stack Development Internship — Task 3**  
> Built by **Abdalle Hussein** ([@Abdalle13](https://github.com/Abdalle13))

Taskora is a modern, enterprise-grade collaborative project management and productivity platform inspired by Linear, Asana, and Trello. Designed for seamless team collaboration, it provides interactive Kanban task boards, distinct user and executive admin dashboards, real-time analytics, and downloadable PDF reports.

---

## Key Highlights & Features

### 1. Dual Dashboard Experiences
- **Personal Productivity Dashboard (Team Members)**:
  - Time-aware personal greeting with live date pill.
  - 4-metric focus ribbon: **Assigned to Me**, **In Progress**, **Completed**, and **Active Projects**.
  - **Upcoming Deadlines**: Focus list of upcoming scheduled deliverables with status chips and project tags.
  - **Project Progress**: Real-time progress bars and task completion ratios for assigned workspaces.
  - **Sprint Completion Gauge**: Circular completion percentage indicator with velocity status.
  - **Task Status Breakdown**: Donut chart visualizing workload distribution across stages.
- **Executive SaaS Admin Dashboard (Platform Admins)**:
  - System-wide metrics, active user tracking, and project health indicators.
  - Task velocity area charts and project pipeline distributions.
  - User and workspace administration with role assignments.

### 2. Analytics & Downloadable Reports
- **Dynamic Scope Filtering**: Filter metrics by individual project or across the entire workspace.
- **Executive KPI Matrix**: Real-time deliverable counts, completion velocity, and overdue tracking.
- **Visual Distributions**: Workflow stage bar charts and workload share charts powered by Recharts.
- **Detailed Delivery Breakdown**: Tabular delivery pacing per project with completion percentages.
- **Download Full PDF Report**: One-click printable executive report with clean corporate header, metadata, KPI matrix, and delivery tables.
- **Export CSV Data**: Instant raw data export for spreadsheets and external reporting.

### 3. Interactive Kanban Board & Task Workflows
- **4 Workflow Stages**: `To Do`, `In Progress`, `In Review`, and `Completed`.
- **Task Metadata**: Priority tagging (`Urgent`, `High`, `Medium`, `Low`), target due dates, assignee selector, and descriptions.
- **Collaborative Comments**: Team discussion thread inside each task card with author attribution and timestamps.
- **Overdue Detection**: Automatic alert banners identifying tasks past their target schedule.

### 4. Workspace & Team Management
- Create, manage, and archive multi-member projects.
- Role-based permissions per project: `Owner`, `Admin`, and `Member`.
- Dedicated team member lists with clear personal attribution (`You` tag for logged-in accounts).
- Full activity log tracking creation, edits, and status transitions.

### 5. Robust Security & Authentication
- Secure JWT-based authentication stored in **HttpOnly, SameSite cookies** to prevent XSS token theft.
- Granular error messaging (distinguishing non-existent accounts from incorrect passwords).
- Password recovery and reset via secure token endpoints.
- 1-click **Instant Demo Login** for evaluation.

### 6. Design System & Theme Engine
- 100% vector SVG icons (clean Lucide-style iconography with zero emojis).
- Full **Light Mode & Dark Mode** theme toggle with harmonious CSS custom properties.
- Responsive, fluid layouts designed for desktop, tablet, and mobile displays.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Recharts, Axios, Lucide Icons |
| **Backend** | Node.js, Express.js (REST API), Helmet, CORS, Cookie-Parser, BcryptJS, JWT |
| **Database** | MongoDB Atlas / Local MongoDB with Mongoose ODM |
| **Testing** | Vitest, React Testing Library, Supertest |

---

## Quick Start (Local Setup)

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **MongoDB**: MongoDB Atlas connection URI or local MongoDB instance

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Abdalle13/CodeAlpha_ProjectManagementTool.git
cd CodeAlpha_ProjectManagementTool
npm install
```

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Ensure `server/.env` contains your MongoDB connection string and JWT secret:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskora
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
```

### 3. Seed Realistic Demo Workspace
Populate sample projects, team members, tasks, and comments:
```bash
npm run seed
```

### 4. Start Development Servers
Run frontend and backend concurrently:
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Demo Credentials

For quick evaluation or testing:

| Role | Email | Password |
|---|---|---|
| **Platform Admin** | `demo@taskora.io` | `Password123!` |
| **Product Designer** | `sarah@taskora.io` | `Password123!` |
| **Software Engineer** | `alex@taskora.io` | `Password123!` |

*(You can also click **Instant Demo Login** on the login page to sign in immediately.)*

---

## Repository Structure

```
CodeAlpha_ProjectManagementTool/
├── client/                     # React Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI components, modals, alerts
│   │   ├── context/            # AuthContext & ThemeContext
│   │   ├── layouts/            # AppLayout with sidebar & header
│   │   ├── lib/                # API client & formatting helpers
│   │   └── pages/              # User Dashboard, Admin Dashboard, Tasks, Projects, Analytics & Reports
├── server/                     # Express.js REST API
│   ├── src/
│   │   ├── config/             # Database connection & environment
│   │   ├── controllers/        # Auth, Projects, Tasks, Collaboration, Admin
│   │   ├── middleware/         # Auth verification, origin guard, rate limiting
│   │   ├── models/             # Mongoose schemas (User, Project, Task, Comment, Activity)
│   │   ├── routes/             # API routing endpoints
│   │   └── seed.js             # Realistic database seeder
└── package.json                # Root workspace configuration
```

---

## Testing & Quality Assurance

```bash
# Run client unit tests
npm run test -w client

# Run server unit tests
npm run test -w server

# Build production bundle
npm run build -w client
```

---

## Author

- **Abdalle Hussein** — Full Stack Development Intern at **CodeAlpha**  
- GitHub: [@Abdalle13](https://github.com/Abdalle13)
