import dns from "node:dns";
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch {}

import bcrypt from "bcryptjs";
import { connectDatabase } from "./config/db.js";
import { User }     from "./models/User.js";
import { Project }  from "./models/Project.js";
import { Task }     from "./models/Task.js";
import { Comment }  from "./models/Comment.js";
import { Activity } from "./models/Activity.js";

const days = (n) => new Date(Date.now() + n * 86_400_000);

async function runSeed() {
  console.log("[seed] Connecting...");
  const db = await connectDatabase();
  if (!db.connected) { console.error("[seed] DB error:", db.reason); process.exit(1); }

  console.log("[seed] Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  // USERS
  console.log("[seed] Creating users...");
  const adminHash = await bcrypt.hash("12345678", 10);
  const userHash  = await bcrypt.hash("12345678", 10);

  const admin = await User.create({
    name: "Admin", email: "admin@gmail.com",
    passwordHash: adminHash, systemRole: "admin", role: "admin",
    title: "System Administrator",
    avatarColor: "#7c3aed", isActive: true,
  });

  const cabdale = await User.create({
    name: "Cabdale Yare", email: "cabdale13yare@gmail.com",
    passwordHash: userHash, systemRole: "user", role: "member",
    title: "Lead Developer",
    avatarColor: "#0ea5e9", isActive: true,
  });

  const sarah = await User.create({
    name: "Sarah Chen", email: "sarah@taskora.io",
    passwordHash: userHash, systemRole: "user", role: "member",
    title: "UI/UX Designer",
    avatarColor: "#ec4899", isActive: true,
  });

  const alex = await User.create({
    name: "Alex Morgan", email: "alex@taskora.io",
    passwordHash: userHash, systemRole: "user", role: "member",
    title: "Full Stack Engineer",
    avatarColor: "#f59e0b", isActive: true,
  });

  const khalid = await User.create({
    name: "Khalid Jama", email: "khalid@taskora.io",
    passwordHash: userHash, systemRole: "user", role: "member",
    title: "Product Manager",
    avatarColor: "#10b981", isActive: true,
  });

  const priya = await User.create({
    name: "Priya Sharma", email: "priya@taskora.io",
    passwordHash: userHash, systemRole: "user", role: "member",
    title: "Backend Engineer",
    avatarColor: "#ef4444", isActive: true,
  });

  const omar = await User.create({
    name: "Omar Hassan", email: "omar@taskora.io",
    passwordHash: userHash, systemRole: "user", role: "member",
    title: "DevOps Engineer",
    avatarColor: "#8b5cf6", isActive: true,
  });

  console.log("[seed] 7 users created");

  // PROJECTS
  console.log("[seed] Creating projects...");

  const proj1 = await Project.create({
    name: "Mobile App � NextGen", key: "MOB",
    description: "Cross-platform iOS and Android application with real-time collaboration, offline sync, and push notifications.",
    category: "Engineering", status: "active", priority: "urgent",
    owner: cabdale._id,
    members: [
      { user: cabdale._id, role: "lead",        joinedAt: days(-20) },
      { user: sarah._id,   role: "contributor", joinedAt: days(-18) },
      { user: alex._id,    role: "contributor", joinedAt: days(-18) },
      { user: khalid._id,  role: "viewer",      joinedAt: days(-15) },
      { user: priya._id,   role: "contributor", joinedAt: days(-10) },
    ],
    startDate: days(-20), dueDate: days(25), budget: 32000, taskSequence: 108,
  });

  const proj2 = await Project.create({
    name: "E-Commerce Platform Redesign", key: "ECO",
    description: "Modern headless storefront using Next.js 14, Stripe Checkout, and advanced cart flows targeting 40% conversion improvement.",
    category: "Product", status: "active", priority: "high",
    owner: cabdale._id,
    members: [
      { user: cabdale._id, role: "lead",        joinedAt: days(-12) },
      { user: sarah._id,   role: "contributor", joinedAt: days(-12) },
      { user: alex._id,    role: "contributor", joinedAt: days(-10) },
      { user: khalid._id,  role: "contributor", joinedAt: days(-8)  },
    ],
    startDate: days(-12), dueDate: days(20), budget: 18500, taskSequence: 105,
  });

  const proj3 = await Project.create({
    name: "Cloud Infrastructure and DevOps", key: "CLD",
    description: "Zero-downtime CI/CD pipelines, Dockerized microservices, Redis caching, Kubernetes, and multi-region failover.",
    category: "Infrastructure", status: "planning", priority: "medium",
    owner: omar._id,
    members: [
      { user: omar._id,    role: "lead",        joinedAt: days(-5) },
      { user: cabdale._id, role: "contributor", joinedAt: days(-5) },
      { user: priya._id,   role: "contributor", joinedAt: days(-4) },
      { user: alex._id,    role: "viewer",      joinedAt: days(-3) },
    ],
    startDate: days(3), dueDate: days(40), budget: 14000, taskSequence: 100,
  });

  const proj4 = await Project.create({
    name: "Design System and Brand Kit", key: "DSK",
    description: "Unified component library, typography scale, color tokens, Figma templates, and Storybook documentation.",
    category: "Design", status: "active", priority: "medium",
    owner: sarah._id,
    members: [
      { user: sarah._id,   role: "lead",        joinedAt: days(-30) },
      { user: cabdale._id, role: "contributor", joinedAt: days(-28) },
      { user: khalid._id,  role: "viewer",      joinedAt: days(-25) },
    ],
    startDate: days(-30), dueDate: days(10), budget: 9000, taskSequence: 103,
  });

  const proj5 = await Project.create({
    name: "Security Audit and Pen Testing", key: "SEC",
    description: "Full OWASP Top-10 audit, penetration testing, JWT hardening, rate-limit tuning, and executive risk report.",
    category: "Security", status: "completed", priority: "urgent",
    owner: admin._id,
    members: [
      { user: admin._id,   role: "lead",        joinedAt: days(-60) },
      { user: cabdale._id, role: "contributor", joinedAt: days(-58) },
      { user: priya._id,   role: "contributor", joinedAt: days(-58) },
      { user: omar._id,    role: "contributor", joinedAt: days(-55) },
    ],
    startDate: days(-60), dueDate: days(-5), budget: 11000, taskSequence: 108,
  });

  console.log("[seed] 5 projects created");

  // TASKS � MOB
  console.log("[seed] Creating tasks...");

  const t1 = await Task.create({
    project: proj1._id, taskCode: "MOB-101",
    title: "Design onboarding and welcome flow in Figma",
    description: "Create 4-step onboarding prototypes with dark/light themes, permission dialogs, and design tokens for React Native.",
    status: "completed", priority: "high",
    assignee: sarah._id, reporter: cabdale._id, dueDate: days(-5), estimatedHours: 16,
    tags: ["design", "ui", "onboarding"],
    checklist: [
      { text: "Welcome screen mockups", completed: true },
      { text: "Permission dialog guidelines", completed: true },
      { text: "Export tokens for React Native", completed: true },
    ],
  });

  const t2 = await Task.create({
    project: proj1._id, taskCode: "MOB-102",
    title: "Implement JWT and refresh token authentication",
    description: "HttpOnly secure cookies, token verification middleware, role-based permissions, refresh token rotation.",
    status: "completed", priority: "urgent",
    assignee: cabdale._id, reporter: cabdale._id, dueDate: days(-3), estimatedHours: 20,
    tags: ["backend", "security", "auth"],
    checklist: [
      { text: "Access token generation", completed: true },
      { text: "Refresh token rotation in DB", completed: true },
      { text: "Security unit tests", completed: true },
    ],
  });

  const t3 = await Task.create({
    project: proj1._id, taskCode: "MOB-103",
    title: "Build interactive Kanban board with drag and drop",
    description: "Column state transitions across Todo, In Progress, In Review, Done with instant WebSocket backend sync.",
    status: "in_progress", priority: "urgent",
    assignee: alex._id, reporter: cabdale._id, dueDate: days(3), estimatedHours: 24,
    tags: ["frontend", "kanban", "react"],
    checklist: [
      { text: "HTML5 drag-and-drop handlers", completed: true },
      { text: "Optimistic UI reordering", completed: true },
      { text: "WebSocket state broadcast", completed: false },
    ],
  });

  const t4 = await Task.create({
    project: proj1._id, taskCode: "MOB-104",
    title: "Task commenting and activity feed",
    description: "Team members can comment on tasks with timestamps, user avatars, and a scrollable activity history stream.",
    status: "in_review", priority: "high",
    assignee: sarah._id, reporter: cabdale._id, dueDate: days(2), estimatedHours: 12,
    tags: ["collaboration", "comments"],
    checklist: [
      { text: "Comment list component", completed: true },
      { text: "Activity stream emitter", completed: true },
      { text: "Real-time comment push", completed: false },
    ],
  });

  const t5 = await Task.create({
    project: proj1._id, taskCode: "MOB-105",
    title: "Real-time WebSocket notification triggers",
    description: "Push live toast notifications when a user is assigned a task or someone comments on a task they watch.",
    status: "todo", priority: "medium",
    assignee: priya._id, reporter: cabdale._id, dueDate: days(8), estimatedHours: 14,
    tags: ["realtime", "sockets", "notifications"],
  });

  await Task.create({
    project: proj1._id, taskCode: "MOB-106",
    title: "Offline sync with background queue",
    description: "Queue task changes locally when offline and replay them when reconnected, with conflict detection.",
    status: "todo", priority: "medium",
    assignee: alex._id, reporter: cabdale._id, dueDate: days(12), estimatedHours: 20,
    tags: ["offline", "sync"],
  });

  await Task.create({
    project: proj1._id, taskCode: "MOB-107",
    title: "Push notifications via FCM",
    description: "Firebase Cloud Messaging for iOS and Android with per-type preference settings.",
    status: "todo", priority: "low",
    assignee: cabdale._id, reporter: cabdale._id, dueDate: days(18), estimatedHours: 10,
    tags: ["push", "firebase"],
  });

  await Task.create({
    project: proj1._id, taskCode: "MOB-108",
    title: "Automate E2E API health monitoring",
    description: "Uptime alerts, rate-limiting diagnostics, and error-rate dashboards for production.",
    status: "todo", priority: "low",
    assignee: khalid._id, reporter: cabdale._id, dueDate: days(22), estimatedHours: 8,
    tags: ["devops", "monitoring"],
  });

  // TASKS � ECO
  const e1 = await Task.create({
    project: proj2._id, taskCode: "ECO-101",
    title: "Stripe Checkout and webhook handling",
    description: "Payment intents, tax calculations, multi-currency support, and order dispatch callbacks.",
    status: "in_progress", priority: "urgent",
    assignee: cabdale._id, reporter: khalid._id, dueDate: days(4), estimatedHours: 18,
    tags: ["payments", "stripe", "backend"],
    checklist: [
      { text: "Payment intent creation", completed: true },
      { text: "Tax calculation middleware", completed: true },
      { text: "Webhook signature verification", completed: false },
      { text: "Order confirmation email", completed: false },
    ],
  });

  const e2 = await Task.create({
    project: proj2._id, taskCode: "ECO-102",
    title: "Responsive product catalog and dynamic filtering",
    description: "Category pills, search debounce, price range slider with URL query sync and skeleton loaders.",
    status: "completed", priority: "high",
    assignee: sarah._id, reporter: khalid._id, dueDate: days(-3), estimatedHours: 15,
    tags: ["frontend", "search", "ux"],
    checklist: [
      { text: "Category filter pills", completed: true },
      { text: "Price range slider", completed: true },
      { text: "URL query sync", completed: true },
    ],
  });

  await Task.create({
    project: proj2._id, taskCode: "ECO-103",
    title: "Shopping cart with persistent state",
    description: "Cart syncs to backend for logged-in users, localStorage for guests, merged on login.",
    status: "in_review", priority: "high",
    assignee: alex._id, reporter: khalid._id, dueDate: days(5), estimatedHours: 12,
    tags: ["cart", "state", "frontend"],
  });

  await Task.create({
    project: proj2._id, taskCode: "ECO-104",
    title: "Admin dashboard � orders and revenue charts",
    description: "Revenue over time, top-selling products, and order management table with bulk actions.",
    status: "todo", priority: "medium",
    assignee: cabdale._id, reporter: khalid._id, dueDate: days(14), estimatedHours: 16,
    tags: ["admin", "charts", "analytics"],
  });

  await Task.create({
    project: proj2._id, taskCode: "ECO-105",
    title: "SEO optimisation and Core Web Vitals",
    description: "Meta tags, OG images, structured data, image optimisation, and Lighthouse score target 95+.",
    status: "todo", priority: "low",
    assignee: sarah._id, reporter: khalid._id, dueDate: days(18), estimatedHours: 10,
    tags: ["seo", "performance"],
  });

  // TASKS � CLD
  await Task.create({
    project: proj3._id, taskCode: "CLD-101",
    title: "Docker Compose multi-service local environment",
    description: "Orchestrate API, DB, Redis, and worker containers in docker-compose.yml for reproducible local dev.",
    status: "in_progress", priority: "high",
    assignee: omar._id, reporter: omar._id, dueDate: days(6), estimatedHours: 12,
    tags: ["docker", "devops"],
  });

  await Task.create({
    project: proj3._id, taskCode: "CLD-102",
    title: "GitHub Actions CI/CD pipeline",
    description: "Automated test, build, and deploy pipeline with staging gate and Slack notifications on failure.",
    status: "todo", priority: "urgent",
    assignee: omar._id, reporter: omar._id, dueDate: days(10), estimatedHours: 16,
    tags: ["ci-cd", "github-actions"],
  });

  await Task.create({
    project: proj3._id, taskCode: "CLD-103",
    title: "Redis caching layer for API responses",
    description: "Cache high-traffic GET endpoints with TTL invalidation and cache-hit metrics.",
    status: "todo", priority: "medium",
    assignee: priya._id, reporter: omar._id, dueDate: days(15), estimatedHours: 10,
    tags: ["redis", "caching", "performance"],
  });

  await Task.create({
    project: proj3._id, taskCode: "CLD-104",
    title: "Kubernetes deployment manifests",
    description: "Production-ready K8s Deployment, Service, and HPA manifests with resource limits.",
    status: "todo", priority: "medium",
    assignee: omar._id, reporter: omar._id, dueDate: days(25), estimatedHours: 20,
    tags: ["kubernetes", "infra"],
  });

  // TASKS � DSK
  const d1 = await Task.create({
    project: proj4._id, taskCode: "DSK-101",
    title: "Define color token system and dark mode palette",
    description: "HSL-based token scales for primary, neutral, semantic, and brand colors with automatic dark mode.",
    status: "completed", priority: "high",
    assignee: sarah._id, reporter: sarah._id, dueDate: days(-10), estimatedHours: 12,
    tags: ["tokens", "colors", "design"],
    checklist: [
      { text: "Light mode palette", completed: true },
      { text: "Dark mode palette", completed: true },
      { text: "Figma variable set", completed: true },
    ],
  });

  await Task.create({
    project: proj4._id, taskCode: "DSK-102",
    title: "Typography scale and font pairing",
    description: "Type scale from xs to 5xl, Google Font pairing, and line-height and tracking rules.",
    status: "completed", priority: "medium",
    assignee: sarah._id, reporter: sarah._id, dueDate: days(-8), estimatedHours: 8,
    tags: ["typography", "fonts"],
  });

  await Task.create({
    project: proj4._id, taskCode: "DSK-103",
    title: "Button component � all variants and states",
    description: "Primary, secondary, ghost, danger variants with hover, active, disabled, and loading states. Fully accessible.",
    status: "in_review", priority: "high",
    assignee: cabdale._id, reporter: sarah._id, dueDate: days(4), estimatedHours: 10,
    tags: ["component", "button", "a11y"],
  });

  await Task.create({
    project: proj4._id, taskCode: "DSK-104",
    title: "Form elements � inputs, selects, checkboxes",
    description: "Consistent form field components with validation states, error messages, and label associations.",
    status: "todo", priority: "medium",
    assignee: cabdale._id, reporter: sarah._id, dueDate: days(9), estimatedHours: 14,
    tags: ["component", "forms", "a11y"],
  });

  // TASKS � SEC
  await Task.create({
    project: proj5._id, taskCode: "SEC-101",
    title: "OWASP Top-10 vulnerability scan",
    description: "Run automated OWASP ZAP scan against staging and document all findings.",
    status: "completed", priority: "urgent",
    assignee: priya._id, reporter: admin._id, dueDate: days(-30), estimatedHours: 16,
    tags: ["owasp", "security", "scan"],
  });

  await Task.create({
    project: proj5._id, taskCode: "SEC-102",
    title: "SQL injection and XSS penetration test",
    description: "Manual pen testing of all input surfaces, API endpoints, and authentication flows.",
    status: "completed", priority: "urgent",
    assignee: omar._id, reporter: admin._id, dueDate: days(-25), estimatedHours: 24,
    tags: ["pentest", "xss", "injection"],
  });

  await Task.create({
    project: proj5._id, taskCode: "SEC-103",
    title: "JWT hardening and token expiry policy",
    description: "Short-lived access tokens (15 min), secure refresh rotation, revocation list, and anomaly logging.",
    status: "completed", priority: "high",
    assignee: cabdale._id, reporter: admin._id, dueDate: days(-20), estimatedHours: 12,
    tags: ["jwt", "auth", "hardening"],
  });

  await Task.create({
    project: proj5._id, taskCode: "SEC-104",
    title: "Executive risk report and remediation plan",
    description: "Compile findings into an executive summary with risk scoring, remediation priority, and timeline.",
    status: "completed", priority: "medium",
    assignee: admin._id, reporter: admin._id, dueDate: days(-10), estimatedHours: 8,
    tags: ["report", "compliance"],
  });

  console.log("[seed] 25 tasks created");

  // COMMENTS
  console.log("[seed] Adding comments...");

  await Comment.create({ project: proj1._id, task: t3._id, author: sarah._id,
    content: "The drag-and-drop feels responsive. Can we make priority badge colors more distinct � urgent and high look similar on mobile." });
  await Comment.create({ project: proj1._id, task: t3._id, author: cabdale._id,
    content: "Good catch Sarah. Updated the palette � urgent is red-600, high is orange-500. Check the next build." });
  await Comment.create({ project: proj1._id, task: t3._id, author: alex._id,
    content: "WebSocket broadcast is the last piece � targeting end of day Wednesday. Optimistic UI is merged and looking clean." });
  await Comment.create({ project: proj1._id, task: t4._id, author: priya._id,
    content: "Tested the comments API with 5 concurrent users � latency stays under 30ms. Real-time push is next." });
  await Comment.create({ project: proj1._id, task: t4._id, author: sarah._id,
    content: "UI is ready and waiting for the WebSocket hook from Alex. Looks great on mobile too." });
  await Comment.create({ project: proj2._id, task: e1._id, author: khalid._id,
    content: "Stripe test keys are in Vault. Test the webhook with Stripe CLI before going live � signature verification is critical." });
  await Comment.create({ project: proj2._id, task: e1._id, author: cabdale._id,
    content: "Using Stripe CLI for local testing now. Working on the order confirmation email next." });
  await Comment.create({ project: proj4._id, task: d1._id, author: cabdale._id,
    content: "Color tokens look amazing. The dark mode palette is very clean � much better than before." });

  console.log("[seed] 8 comments created");

  // ACTIVITY
  console.log("[seed] Logging activity...");
  await Activity.create({ project: proj1._id, task: t2._id, user: cabdale._id, action: "status_changed",
    description: "Cabdale marked JWT Authentication as completed" });
  await Activity.create({ project: proj1._id, task: t1._id, user: sarah._id, action: "status_changed",
    description: "Sarah marked Onboarding flow design as completed" });
  await Activity.create({ project: proj1._id, task: t3._id, user: alex._id, action: "status_changed",
    description: "Alex moved Kanban board to In Progress" });
  await Activity.create({ project: proj1._id, task: t4._id, user: sarah._id, action: "status_changed",
    description: "Sarah moved Task commenting to In Review" });
  await Activity.create({ project: proj2._id, task: e2._id, user: sarah._id, action: "status_changed",
    description: "Sarah marked Product catalog and filtering as completed" });
  await Activity.create({ project: proj2._id, task: e1._id, user: cabdale._id, action: "status_changed",
    description: "Cabdale moved Stripe Checkout to In Progress" });
  await Activity.create({ project: proj4._id, task: d1._id, user: sarah._id, action: "status_changed",
    description: "Sarah marked Color token system as completed" });
  await Activity.create({ project: proj5._id, user: admin._id, action: "project_created",
    description: "Admin created project Security Audit and Pen Testing" });
  await Activity.create({ project: proj3._id, user: omar._id, action: "project_created",
    description: "Omar created project Cloud Infrastructure and DevOps" });

  console.log("[seed] 9 activity entries logged");

  console.log("\n================================================");
  console.log("   TASKORA SEED COMPLETE");
  console.log("================================================");
  console.log("  Admin:         admin@gmail.com         / 12345678");
  console.log("  Your account:  cabdale13yare@gmail.com / 12345678");
  console.log("  Others:        *@taskora.io            / 12345678");
  console.log("  7 users | 5 projects | 25 tasks | 8 comments | 9 activities");
  console.log("================================================\n");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("[seed] Seed failed:", err);
  process.exit(1);
});
