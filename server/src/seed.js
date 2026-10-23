import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

import bcrypt from "bcryptjs";
import { connectDatabase } from "./config/db.js";
import { User } from "./models/User.js";
import { Project } from "./models/Project.js";
import { Task } from "./models/Task.js";
import { Comment } from "./models/Comment.js";
import { Activity } from "./models/Activity.js";

async function runSeed() {
  console.log("[seed] Starting Taskora database seeder...");
  const db = await connectDatabase();
  if (!db.connected) {
    console.error("[seed] Failed to connect to database:", db.reason);
    process.exit(1);
  }

  console.log("[seed] Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  console.log("[seed] Creating users...");
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const abdalle = await User.create({
    name: "Abdalle (Lead Developer)",
    email: "demo@taskora.io",
    passwordHash,
    role: "admin",
    systemRole: "admin",
    isActive: true,
  });

  const sarah = await User.create({
    name: "Sarah Chen (UI/UX Designer)",
    email: "sarah@taskora.io",
    passwordHash,
    systemRole: "user",
    isActive: true,
  });

  const alex = await User.create({
    name: "Alex Morgan (Full Stack Eng)",
    email: "alex@taskora.io",
    passwordHash,
    systemRole: "user",
    isActive: true,
  });

  const khalid = await User.create({
    name: "Khalid Jama (Product Lead)",
    email: "khalid@taskora.io",
    passwordHash,
    systemRole: "user",
    isActive: true,
  });

  console.log("[seed] Creating projects...");
  const project1 = await Project.create({
    name: "NextGen Mobile App",
    key: "MOB",
    description: "Cross-platform iOS and Android application with real-time collaboration, offline sync, and push notifications.",
    category: "Engineering",
    status: "active",
    priority: "urgent",
    owner: abdalle._id,
    members: [
      { user: abdalle._id, role: "lead", joinedAt: new Date() },
      { user: sarah._id, role: "contributor", joinedAt: new Date() },
      { user: alex._id, role: "contributor", joinedAt: new Date() },
      { user: khalid._id, role: "viewer", joinedAt: new Date() },
    ],
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    budget: 25000,
    taskSequence: 106,
  });

  const project2 = await Project.create({
    name: "E-Commerce Platform Redesign",
    key: "ECO",
    description: "Modern headless storefront revamp using Next.js, Stripe checkout, and high conversion cart flows.",
    category: "Product",
    status: "active",
    priority: "high",
    owner: abdalle._id,
    members: [
      { user: abdalle._id, role: "lead", joinedAt: new Date() },
      { user: sarah._id, role: "contributor", joinedAt: new Date() },
      { user: alex._id, role: "contributor", joinedAt: new Date() },
    ],
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    budget: 18000,
    taskSequence: 102,
  });

  const project3 = await Project.create({
    name: "Cloud Infrastructure and DevOps",
    key: "CLD",
    description: "Zero-downtime deployment pipelines, automated Docker builds, Redis caching, and multi-region failover monitoring.",
    category: "Infrastructure",
    status: "planning",
    priority: "medium",
    owner: abdalle._id,
    members: [
      { user: abdalle._id, role: "lead", joinedAt: new Date() },
      { user: alex._id, role: "contributor", joinedAt: new Date() },
    ],
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    budget: 12000,
    taskSequence: 100,
  });

  console.log("[seed] Creating tasks...");
  const t1 = await Task.create({
    project: project1._id,
    taskCode: "MOB-101",
    title: "Design Onboarding and Welcome Flow in Figma",
    description: "Create interactive prototypes for 4-step user onboarding with dark and light preview screens.",
    status: "completed",
    priority: "high",
    assignee: sarah._id,
    reporter: abdalle._id,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estimatedHours: 16,
    tags: ["design", "ui", "onboarding"],
    checklist: [
      { text: "Welcome screen mockups", completed: true },
      { text: "Permission dialog guidelines", completed: true },
      { text: "Export tokens for React Native", completed: true },
    ],
  });

  const t2 = await Task.create({
    project: project1._id,
    taskCode: "MOB-102",
    title: "Implement JWT and Refresh Token Authentication",
    description: "Set up HttpOnly secure cookies, token verification middleware, and role-based permissions.",
    status: "completed",
    priority: "urgent",
    assignee: abdalle._id,
    reporter: abdalle._id,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    estimatedHours: 20,
    tags: ["backend", "security", "auth"],
    checklist: [
      { text: "Access token generation", completed: true },
      { text: "Refresh token rotation in DB", completed: true },
      { text: "Security unit tests", completed: true },
    ],
  });

  const t3 = await Task.create({
    project: project1._id,
    taskCode: "MOB-103",
    title: "Develop Interactive Kanban Board with Live Drag",
    description: "Support column state transitions across To Do, In Progress, In Review, and Done with instantaneous backend sync.",
    status: "in_progress",
    priority: "urgent",
    assignee: alex._id,
    reporter: abdalle._id,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    estimatedHours: 24,
    tags: ["frontend", "kanban", "react"],
    checklist: [
      { text: "HTML5 drag and drop handlers", completed: true },
      { text: "Optimistic UI reordering", completed: false },
      { text: "WebSocket state broadcast", completed: false },
    ],
  });

  const t4 = await Task.create({
    project: project1._id,
    taskCode: "MOB-104",
    title: "Task Commenting and Activity Feed Integration",
    description: "Enable team members to comment on tasks with timestamps, user badges, and activity history.",
    status: "in_review",
    priority: "high",
    assignee: sarah._id,
    reporter: abdalle._id,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    estimatedHours: 12,
    tags: ["collaboration", "comments"],
    checklist: [
      { text: "Comment list component", completed: true },
      { text: "Activity stream event emitter", completed: true },
    ],
  });

  const t5 = await Task.create({
    project: project1._id,
    taskCode: "MOB-105",
    title: "WebSocket Real-Time Notification Trigger",
    description: "Push live toasts when a user is assigned a task or when someone comments on an active task.",
    status: "todo",
    priority: "medium",
    assignee: alex._id,
    reporter: abdalle._id,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    estimatedHours: 14,
    tags: ["realtime", "sockets"],
  });

  const t6 = await Task.create({
    project: project1._id,
    taskCode: "MOB-106",
    title: "Automate End-to-End API Health Monitoring",
    description: "Configure uptime alerts and rate-limiting diagnostics for production release.",
    status: "todo",
    priority: "low",
    assignee: khalid._id,
    reporter: abdalle._id,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    estimatedHours: 8,
    tags: ["devops", "monitoring"],
  });

  // Project 2 tasks
  await Task.create({
    project: project2._id,
    taskCode: "ECO-101",
    title: "Stripe Checkout and Webhook Handling",
    description: "Integrate payment intents, tax calculations, and successful order dispatch callbacks.",
    status: "in_progress",
    priority: "urgent",
    assignee: abdalle._id,
    reporter: abdalle._id,
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    estimatedHours: 18,
    tags: ["payments", "stripe"],
  });

  await Task.create({
    project: project2._id,
    taskCode: "ECO-102",
    title: "Responsive Product Catalog and Dynamic Filtering",
    description: "Category pills, search query debounce, and price slider with instant URL sync.",
    status: "completed",
    priority: "high",
    assignee: sarah._id,
    reporter: abdalle._id,
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    estimatedHours: 15,
    tags: ["frontend", "search"],
  });

  console.log("[seed] Adding task comments...");
  await Comment.create({
    project: project1._id,
    task: t3._id,
    author: sarah._id,
    content: "The card dragging feels responsive and clean. Let us make sure priority badges use distinct accents.",
  });

  await Comment.create({
    project: project1._id,
    task: t3._id,
    author: abdalle._id,
    content: "Agreed Sarah. Distinct color badges are configured for Urgent, High, Medium, and Low priorities.",
  });

  await Comment.create({
    project: project1._id,
    task: t4._id,
    author: alex._id,
    content: "Tested comments API with multiple users, latency is under 30ms.",
  });

  console.log("[seed] Logging activity items...");
  await Activity.create({
    project: project1._id,
    task: t2._id,
    user: abdalle._id,
    action: "status_changed",
    description: "Abdalle marked 'Implement JWT and Refresh Token Authentication' as completed",
  });

  await Activity.create({
    project: project1._id,
    task: t3._id,
    user: alex._id,
    action: "status_changed",
    description: "Alex moved 'Develop Interactive Kanban Board' to In Progress",
  });

  console.log("[seed] Seed completed successfully.");
  console.log("Credentials:");
  console.log("  Email:    demo@taskora.io");
  console.log("  Password: Password123!");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("[seed] Seed failed:", err);
  process.exit(1);
});
