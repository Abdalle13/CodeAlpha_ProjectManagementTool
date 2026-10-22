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
  console.log("🌱 Starting Taskora database seeder...");
  const db = await connectDatabase();
  if (!db.connected) {
    console.error("❌ Failed to connect to database:", db.reason);
    process.exit(1);
  }

  // Clear existing Taskora records
  console.log("🧹 Clearing old data...");
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  // Create Users
  console.log("👤 Creating seed users...");
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const abdalle = await User.create({
    name: "Abdalle (Lead Developer)",
    email: "demo@taskora.io",
    passwordHash,
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

  console.log("📁 Creating projects...");
  // Project 1: NextGen SaaS Mobile App
  const project1 = await Project.create({
    name: "🚀 NextGen SaaS Mobile App",
    description: "Cross-platform iOS and Android application with real-time collaboration, offline sync, and push notifications.",
    status: "active",
    owner: abdalle._id,
    members: [
      { user: abdalle._id, role: "owner", joinedAt: new Date() },
      { user: sarah._id, role: "admin", joinedAt: new Date() },
      { user: alex._id, role: "member", joinedAt: new Date() },
      { user: khalid._id, role: "member", joinedAt: new Date() },
    ],
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  // Project 2: E-Commerce Platform Redesign
  const project2 = await Project.create({
    name: "⚡ E-Commerce Platform Redesign",
    description: "Modern headless storefront revamp using Next.js, Tailwind CSS, Stripe checkout, and high conversion cart flows.",
    status: "active",
    owner: abdalle._id,
    members: [
      { user: abdalle._id, role: "owner", joinedAt: new Date() },
      { user: sarah._id, role: "member", joinedAt: new Date() },
      { user: alex._id, role: "member", joinedAt: new Date() },
    ],
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  });

  // Project 3: Cloud Infrastructure & DevOps
  const project3 = await Project.create({
    name: "🛡️ Cloud Infrastructure & DevOps",
    description: "Zero-downtime deployment pipelines, automated Docker builds, Redis caching, and multi-region failover monitoring.",
    status: "planned",
    owner: abdalle._id,
    members: [
      { user: abdalle._id, role: "owner", joinedAt: new Date() },
      { user: alex._id, role: "admin", joinedAt: new Date() },
    ],
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  });

  console.log("📋 Creating tasks across Kanban columns...");
  // Tasks for Project 1
  const t1 = await Task.create({
    project: project1._id,
    title: "Design Onboarding & Welcome Flow in Figma",
    description: "Create interactive prototypes for 4-step user onboarding with dark/light preview screens.",
    status: "done",
    priority: "high",
    assignee: sarah._id,
    createdBy: abdalle._id,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  const t2 = await Task.create({
    project: project1._id,
    title: "Implement JWT & Refresh Token Authentication",
    description: "Set up HttpOnly secure cookies, token verification middleware, and role-based permissions.",
    status: "done",
    priority: "urgent",
    assignee: abdalle._id,
    createdBy: abdalle._id,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  });

  const t3 = await Task.create({
    project: project1._id,
    title: "Develop Interactive Kanban Board with Live Drag",
    description: "Support column state transitions across To Do, In Progress, In Review, and Done with instantaneous backend sync.",
    status: "in_progress",
    priority: "urgent",
    assignee: alex._id,
    createdBy: abdalle._id,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  });

  const t4 = await Task.create({
    project: project1._id,
    title: "Task Commenting & Activity Feed Integration",
    description: "Enable team members to comment on tasks with timestamps, user badges, and activity history.",
    status: "in_review",
    priority: "high",
    assignee: sarah._id,
    createdBy: abdalle._id,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  });

  const t5 = await Task.create({
    project: project1._id,
    title: "WebSocket Real-Time Notification Trigger",
    description: "Push live toasts when a user is assigned a task or when someone comments on an active task.",
    status: "todo",
    priority: "medium",
    assignee: alex._id,
    createdBy: abdalle._id,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const t6 = await Task.create({
    project: project1._id,
    title: "Automate End-to-End API Health Monitoring",
    description: "Configure uptime alerts and rate-limiting diagnostics for production release.",
    status: "todo",
    priority: "low",
    assignee: khalid._id,
    createdBy: abdalle._id,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  });

  // Tasks for Project 2
  await Task.create({
    project: project2._id,
    title: "Stripe Checkout & Webhook Handling",
    description: "Integrate payment intents, tax calculations, and successful order dispatch callbacks.",
    status: "in_progress",
    priority: "urgent",
    assignee: abdalle._id,
    createdBy: abdalle._id,
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  });

  await Task.create({
    project: project2._id,
    title: "Responsive Product Catalog & Dynamic Filtering",
    description: "Category pills, search query debounce, and price slider with instant URL sync.",
    status: "done",
    priority: "high",
    assignee: sarah._id,
    createdBy: abdalle._id,
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  console.log("💬 Adding task comments...");
  await Comment.create({
    project: project1._id,
    task: t3._id,
    author: sarah._id,
    body: "The card dragging looks very smooth! Let's ensure the priority badges stand out with vibrant accents.",
  });

  await Comment.create({
    project: project1._id,
    task: t3._id,
    author: abdalle._id,
    body: "Great point Sarah! Added distinct color-coded badges for Urgent (crimson), High (amber), Medium (blue), and Low (slate).",
  });

  await Comment.create({
    project: project1._id,
    task: t4._id,
    author: alex._id,
    body: "Tested comments API with multiple users—responses are under 30ms on MongoDB Atlas.",
  });

  console.log("📊 Logging activity items...");
  await Activity.create({
    project: project1._id,
    task: t2._id,
    actor: abdalle._id,
    action: "task_completed",
    summary: "Abdalle completed 'Implement JWT & Refresh Token Authentication'",
  });

  await Activity.create({
    project: project1._id,
    task: t3._id,
    actor: alex._id,
    action: "task_updated",
    summary: "Alex moved 'Develop Interactive Kanban Board' to In Progress",
  });

  console.log("\n==================================================");
  console.log("✅ Seed completed successfully!");
  console.log("==================================================");
  console.log("Demo Credentials:");
  console.log("  Email:    demo@taskora.io");
  console.log("  Password: Password123!");
  console.log("==================================================\n");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
