/**
 * Supabase database helpers - replaces Mongoose models.
 * All queries go through these helpers.
 */
import { supabase } from "../config/supabase.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function throwIfError(error, msg = "Database error") {
  if (error) throw new Error(`${msg}: ${error.message}`);
}

/** Convert a Supabase user row → Mongoose-compatible user object */
function mapUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    systemRole: row.system_role,
    role: row.role,
    title: row.title,
    avatarColor: row.avatar_color,
    resetPasswordToken: row.reset_password_token,
    resetPasswordExpires: row.reset_password_expires,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Mimic Mongoose equals()
    equals(otherId) { return String(this._id) === String(otherId); },
  };
}

/** Convert a Supabase project row → compatible object */
function mapProject(row, members = []) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    key: row.key,
    description: row.description,
    category: row.category,
    status: row.status,
    priority: row.priority,
    owner: row.owner ? mapUser(row.owner) : row.owner_id,
    owner_id: row.owner_id,
    members: members.map(m => ({
      user: m.user ? mapUser(m.user) : m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
    })),
    startDate: row.start_date,
    dueDate: row.due_date,
    budget: row.budget,
    taskSequence: row.task_sequence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    project: row.project ? mapProject(row.project) : row.project_id,
    project_id: row.project_id,
    taskCode: row.task_code,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee ? mapUser(row.assignee) : row.assignee_id || null,
    reporter: row.reporter ? mapUser(row.reporter) : row.reporter_id || null,
    createdBy: row.created_by_user ? mapUser(row.created_by_user) : row.created_by || null,
    dueDate: row.due_date,
    estimatedHours: row.estimated_hours,
    tags: row.tags || [],
    checklist: (row.checklist || []).map((item, idx) => ({
      _id: item.id || String(idx),
      id: item.id || String(idx),
      text: item.text,
      completed: item.completed,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapComment(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    task: row.task_id,
    project: row.project_id,
    author: row.author ? mapUser(row.author) : row.author_id,
    body: row.body,
    content: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    project: row.project ? mapProject(row.project) : row.project_id,
    task: row.task ? mapTask(row.task) : row.task_id,
    user: row.user ? mapUser(row.user) : row.user_id,
    actor: row.actor ? mapUser(row.actor) : row.actor_id,
    action: row.action,
    description: row.description,
    summary: row.summary,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

// ─── USERS ────────────────────────────────────────────────────────────────
export const UserDB = {
  async findById(id, { withPassword = false } = {}) {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    throwIfError(error, "findById user");
    const u = mapUser(data);
    if (u && !withPassword) delete u.passwordHash;
    return u;
  },

  async findOne(filter, { withPassword = false, withReset = false } = {}) {
    let q = supabase.from("users").select("*");
    if (filter.email) q = q.eq("email", filter.email.toLowerCase());
    if (filter.id) q = q.eq("id", filter.id);
    if (filter.reset_password_token) q = q.eq("reset_password_token", filter.reset_password_token);
    const { data, error } = await q.maybeSingle();
    throwIfError(error, "findOne user");
    const u = mapUser(data);
    if (u && !withPassword) delete u.passwordHash;
    if (u && !withReset) { delete u.resetPasswordToken; delete u.resetPasswordExpires; }
    return u;
  },

  async findByName(name) {
    const { data, error } = await supabase.from("users").select("*").ilike("name", name).maybeSingle();
    throwIfError(error, "findByName user");
    const u = mapUser(data);
    if (u) delete u.passwordHash;
    return u;
  },

  async findAll(filter = {}) {
    let q = supabase.from("users").select("*");
    if (filter.isActive !== undefined) q = q.eq("is_active", filter.isActive);
    if (filter.ids) q = q.in("id", filter.ids);
    if (filter.search) q = q.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
    if (filter.role) q = q.eq("role", filter.role);
    q = q.order("name", { ascending: true });
    const { data, error } = await q;
    throwIfError(error, "findAll users");
    return (data || []).map(mapUser);
  },

  async findPaginated({ search, role, status, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let q = supabase.from("users").select("*", { count: "exact" });
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (role) q = q.eq("role", role);
    if (status === "active") q = q.eq("is_active", true);
    if (status === "inactive") q = q.eq("is_active", false);
    q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    throwIfError(error, "findPaginated users");
    return { items: (data || []).map(mapUser), total: count || 0 };
  },

  async countDocuments(filter = {}) {
    let q = supabase.from("users").select("id", { count: "exact", head: true });
    if (filter.isActive !== undefined) q = q.eq("is_active", filter.isActive);
    if (filter.role) q = q.or(`role.eq.${filter.role},system_role.eq.${filter.role}`);
    const { count, error } = await q;
    throwIfError(error, "countDocuments users");
    return count || 0;
  },

  async create(data) {
    const { data: row, error } = await supabase.from("users").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      password_hash: data.passwordHash,
      system_role: data.systemRole || "user",
      role: data.role || "user",
      title: data.title || "Software Engineer",
      avatar_color: data.avatarColor || "#3b82f6",
      is_active: data.isActive !== undefined ? data.isActive : true,
    }).select().single();
    throwIfError(error, "create user");
    return mapUser(row);
  },

  async update(id, updates) {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email.toLowerCase();
    if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash;
    if (updates.systemRole !== undefined) dbUpdates.system_role = updates.systemRole;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.avatarColor !== undefined) dbUpdates.avatar_color = updates.avatarColor;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.resetPasswordToken !== undefined) dbUpdates.reset_password_token = updates.resetPasswordToken || null;
    if (updates.resetPasswordExpires !== undefined) dbUpdates.reset_password_expires = updates.resetPasswordExpires || null;

    const { data, error } = await supabase.from("users").update(dbUpdates).eq("id", id).select().single();
    throwIfError(error, "update user");
    return mapUser(data);
  },

  async delete(id) {
    const { error } = await supabase.from("users").delete().eq("id", id);
    throwIfError(error, "delete user");
  },

  async countAdmins() {
    const { count, error } = await supabase.from("users")
      .select("id", { count: "exact", head: true })
      .or("role.eq.admin,system_role.eq.admin")
      .eq("is_active", true);
    throwIfError(error, "countAdmins");
    return count || 0;
  },

  async getRecentUsers(limit = 6) {
    const { data, error } = await supabase.from("users")
      .select("id,name,email,role,system_role,created_at,is_active")
      .order("created_at", { ascending: false })
      .limit(limit);
    throwIfError(error, "getRecentUsers");
    return (data || []).map(mapUser);
  },

  async getGroupedRoleCounts() {
    const { data, error } = await supabase.from("users").select("system_role");
    throwIfError(error, "getGroupedRoleCounts");
    const counts = {};
    (data || []).forEach(r => {
      const role = r.system_role || "user";
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  },
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────
export const ProjectDB = {
  async _loadWithMembers(projectId) {
    const [{ data: proj, error: pe }, { data: mems, error: me }] = await Promise.all([
      supabase.from("projects").select("*, owner:users!projects_owner_id_fkey(id,name,email,role,avatar_color)").eq("id", projectId).maybeSingle(),
      supabase.from("project_members").select("*, user:users(id,name,email,role,avatar_color)").eq("project_id", projectId),
    ]);
    throwIfError(pe, "load project");
    throwIfError(me, "load project members");
    if (!proj) return null;
    return mapProject(proj, mems || []);
  },

  async findById(id) {
    return this._loadWithMembers(id);
  },

  async findAll({ userId, isAdmin, search, status, category, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let q = supabase.from("projects")
      .select("*, owner:users!projects_owner_id_fkey(id,name,email,role,avatar_color)", { count: "exact" });
    if (!isAdmin && userId) {
      const { data: memberRows } = await supabase.from("project_members").select("project_id").eq("user_id", userId);
      const ids = (memberRows || []).map(r => r.project_id);
      if (ids.length === 0) return { items: [], total: 0 };
      q = q.in("id", ids);
    }
    if (search) q = q.or(`name.ilike.%${search}%,key.ilike.%${search}%`);
    if (status) q = q.eq("status", status);
    if (category) q = q.eq("category", category);
    q = q.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    throwIfError(error, "findAll projects");

    const projects = await Promise.all((data || []).map(async (p) => {
      const { data: mems } = await supabase.from("project_members").select("*, user:users(id,name,email,role,avatar_color)").eq("project_id", p.id);
      return mapProject(p, mems || []);
    }));
    return { items: projects, total: count || 0 };
  },

  async create({ name, key, description, category, status, priority, ownerId, startDate, dueDate, budget }) {
    const { data: proj, error } = await supabase.from("projects").insert({
      name, key, description, category, status, priority,
      owner_id: ownerId,
      start_date: startDate || null,
      due_date: dueDate || null,
      budget: budget || 0,
    }).select().single();
    throwIfError(error, "create project");
    await supabase.from("project_members").insert({ project_id: proj.id, user_id: ownerId, role: "owner" });
    return this._loadWithMembers(proj.id);
  },

  async update(id, updates) {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.key !== undefined) dbUpdates.key = updates.key;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
    if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
    if (updates.taskSequence !== undefined) dbUpdates.task_sequence = updates.taskSequence;
    const { error } = await supabase.from("projects").update(dbUpdates).eq("id", id);
    throwIfError(error, "update project");
    return this._loadWithMembers(id);
  },

  async delete(id) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    throwIfError(error, "delete project");
  },

  async countDocuments(filter = {}) {
    let q = supabase.from("projects").select("id", { count: "exact", head: true });
    if (filter.status) q = q.eq("status", filter.status);
    const { count, error } = await q;
    throwIfError(error, "countDocuments projects");
    return count || 0;
  },

  async addMember(projectId, userId, role = "contributor") {
    const { error } = await supabase.from("project_members")
      .upsert({ project_id: projectId, user_id: userId, role }, { onConflict: "project_id,user_id" });
    throwIfError(error, "addMember");
    return this._loadWithMembers(projectId);
  },

  async removeMember(projectId, userId) {
    const { error } = await supabase.from("project_members")
      .delete().eq("project_id", projectId).eq("user_id", userId);
    throwIfError(error, "removeMember");
    return this._loadWithMembers(projectId);
  },

  async removeUserFromAllProjects(userId) {
    const { error } = await supabase.from("project_members")
      .delete().eq("user_id", userId);
    throwIfError(error, "removeUserFromAllProjects");
  },

  async updateMember(projectId, userId, role) {
    const { error } = await supabase.from("project_members")
      .update({ role }).eq("project_id", projectId).eq("user_id", userId);
    throwIfError(error, "updateMember");
    return this._loadWithMembers(projectId);
  },

  async getMember(projectId, userId) {
    const { data, error } = await supabase.from("project_members")
      .select("*").eq("project_id", projectId).eq("user_id", userId).maybeSingle();
    throwIfError(error, "getMember");
    return data;
  },

  async getUserProjectIds(userId) {
    const { data, error } = await supabase.from("project_members")
      .select("project_id").eq("user_id", userId);
    throwIfError(error, "getUserProjectIds");
    return (data || []).map(r => r.project_id);
  },

  async getGroupedStatusCounts() {
    const { data, error } = await supabase.from("projects").select("status");
    throwIfError(error, "getGroupedStatusCounts");
    const counts = {};
    (data || []).forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  async findAllAdmin({ search, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let q = supabase.from("projects")
      .select("*, owner:users!projects_owner_id_fkey(id,name,email,role,avatar_color)", { count: "exact" });
    if (search) q = q.or(`name.ilike.%${search}%,key.ilike.%${search}%`);
    q = q.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    throwIfError(error, "findAllAdmin projects");
    const projects = await Promise.all((data || []).map(async (p) => {
      const { data: mems } = await supabase.from("project_members").select("*, user:users(id,name,email,role,avatar_color)").eq("project_id", p.id);
      return mapProject(p, mems || []);
    }));
    return { items: projects, total: count || 0 };
  },
};

// ─── TASKS ────────────────────────────────────────────────────────────────
export const TaskDB = {
  async _loadFull(taskId) {
    const { data, error } = await supabase.from("tasks")
      .select(`*,
        project:projects(id,name,key,owner_id),
        assignee:users!tasks_assignee_id_fkey(id,name,email,role,avatar_color),
        reporter:users!tasks_reporter_id_fkey(id,name,email,role,avatar_color),
        created_by_user:users!tasks_created_by_fkey(id,name,email,role,avatar_color)
      `).eq("id", taskId).maybeSingle();
    throwIfError(error, "loadFull task");
    return mapTask(data);
  },

  async findById(id) {
    return this._loadFull(id);
  },

  async findOne(filter) {
    let q = supabase.from("tasks").select("*");
    if (filter.id) q = q.eq("id", filter.id);
    if (filter.project_id) q = q.eq("project_id", filter.project_id);
    const { data, error } = await q.maybeSingle();
    throwIfError(error, "findOne task");
    return data ? mapTask(data) : null;
  },

  async findByProject(projectId, { status, priority, assigneeId, search } = {}) {
    let q = supabase.from("tasks")
      .select(`*,
        project:projects(id,name,key,owner_id),
        assignee:users!tasks_assignee_id_fkey(id,name,email,role,avatar_color),
        reporter:users!tasks_reporter_id_fkey(id,name,email,role,avatar_color),
        created_by_user:users!tasks_created_by_fkey(id,name,email,role,avatar_color)
      `)
      .eq("project_id", projectId);
    if (status) q = q.eq("status", status);
    if (priority) q = q.eq("priority", priority);
    if (assigneeId) q = q.eq("assignee_id", assigneeId);
    if (search) q = q.or(`title.ilike.%${search}%,task_code.ilike.%${search}%`);
    q = q.order("created_at", { ascending: false });
    const { data, error } = await q;
    throwIfError(error, "findByProject tasks");
    return (data || []).map(mapTask);
  },

  async findPaginated({ projectIds, assigneeId, myTasks, status, priority, projectId, search, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let q = supabase.from("tasks")
      .select(`*,
        project:projects(id,name,key,owner_id),
        assignee:users!tasks_assignee_id_fkey(id,name,email,role,avatar_color),
        reporter:users!tasks_reporter_id_fkey(id,name,email,role,avatar_color),
        created_by_user:users!tasks_created_by_fkey(id,name,email,role,avatar_color)
      `, { count: "exact" });
    if (projectIds) q = q.in("project_id", projectIds);
    if (assigneeId) q = q.eq("assignee_id", assigneeId);
    if (status) q = q.eq("status", status);
    if (priority) q = q.eq("priority", priority);
    if (projectId) q = q.eq("project_id", projectId);
    if (search) q = q.or(`title.ilike.%${search}%,task_code.ilike.%${search}%`);
    q = q.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    throwIfError(error, "findPaginated tasks");
    return { items: (data || []).map(mapTask), total: count || 0 };
  },

  async countDocuments(filter = {}) {
    let q = supabase.from("tasks").select("id", { count: "exact", head: true });
    if (filter.project_id) q = q.eq("project_id", filter.project_id);
    if (filter.assignee_id) q = q.eq("assignee_id", filter.assignee_id);
    if (filter.status) q = q.eq("status", filter.status);
    if (filter.statuses) q = q.in("status", filter.statuses);
    if (filter.excludeStatuses) q = q.not("status", "in", `(${filter.excludeStatuses.join(",")})`);
    if (filter.project_ids) q = q.in("project_id", filter.project_ids);
    if (filter.dueBefore) q = q.lt("due_date", filter.dueBefore.toISOString());
    if (filter.dueBetween) q = q.gte("due_date", filter.dueBetween.from.toISOString()).lte("due_date", filter.dueBetween.to.toISOString());
    const { count, error } = await q;
    throwIfError(error, "countDocuments tasks");
    return count || 0;
  },

  async create(data) {
    const { data: row, error } = await supabase.from("tasks").insert({
      project_id: data.project_id || data.project,
      task_code: data.taskCode || "",
      title: data.title,
      description: data.description || "",
      status: data.status || "todo",
      priority: data.priority || "medium",
      assignee_id: data.assignee || null,
      reporter_id: data.reporter || null,
      created_by: data.createdBy || null,
      due_date: data.dueDate || null,
      estimated_hours: data.estimatedHours || 0,
      tags: data.tags || [],
      checklist: data.checklist || [],
    }).select().single();
    throwIfError(error, "create task");
    return this._loadFull(row.id);
  },

  async update(id, updates) {
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.assignee !== undefined) dbUpdates.assignee_id = updates.assignee || null;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.estimatedHours !== undefined) dbUpdates.estimated_hours = updates.estimatedHours;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.checklist !== undefined) dbUpdates.checklist = updates.checklist;
    const { error } = await supabase.from("tasks").update(dbUpdates).eq("id", id);
    throwIfError(error, "update task");
    return this._loadFull(id);
  },

  async delete(id) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    throwIfError(error, "delete task");
  },

  async deleteMany(filter) {
    let q = supabase.from("tasks").delete();
    if (filter.project_id) q = q.eq("project_id", filter.project_id);
    const { error } = await q;
    throwIfError(error, "deleteMany tasks");
  },

  async unassignUser(userId) {
    const { error } = await supabase.from("tasks").update({ assignee_id: null }).eq("assignee_id", userId);
    throwIfError(error, "unassignUser");
  },

  async getGroupedStatusCounts(projectIds) {
    let q = supabase.from("tasks").select("status");
    if (projectIds) q = q.in("project_id", projectIds);
    const { data, error } = await q;
    throwIfError(error, "getGroupedStatusCounts tasks");
    const counts = {};
    (data || []).forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  async getGroupedPriorityCounts(projectIds) {
    let q = supabase.from("tasks").select("priority");
    if (projectIds) q = q.in("project_id", projectIds);
    const { data, error } = await q;
    throwIfError(error, "getGroupedPriorityCounts tasks");
    const counts = {};
    (data || []).forEach(r => { counts[r.priority] = (counts[r.priority] || 0) + 1; });
    return Object.entries(counts).map(([priority, count]) => ({ priority, count }));
  },

  async getProjectTaskAgg(projectIds) {
    let q = supabase.from("tasks").select("project_id,status");
    if (projectIds) q = q.in("project_id", projectIds);
    const { data, error } = await q;
    throwIfError(error, "getProjectTaskAgg");
    const agg = {};
    (data || []).forEach(r => {
      if (!agg[r.project_id]) agg[r.project_id] = { total: 0, completed: 0 };
      agg[r.project_id].total++;
      if (r.status === "done" || r.status === "completed") agg[r.project_id].completed++;
    });
    return agg;
  },

  async getAssigneeCounts(userIds) {
    let q = supabase.from("tasks").select("assignee_id")
      .in("assignee_id", userIds)
      .not("status", "in", "(completed,done)");
    const { data, error } = await q;
    throwIfError(error, "getAssigneeCounts");
    const counts = {};
    (data || []).forEach(r => { counts[r.assignee_id] = (counts[r.assignee_id] || 0) + 1; });
    return counts;
  },

  async getDueSoon(projectIds, limit = 8) {
    const now = new Date().toISOString();
    let q = supabase.from("tasks")
      .select(`*,
        project:projects(id,name),
        assignee:users!tasks_assignee_id_fkey(id,name)
      `)
      .not("due_date", "is", null)
      .not("status", "in", "(done,completed)")
      .gte("due_date", now);
    if (projectIds) q = q.in("project_id", projectIds);
    q = q.order("due_date", { ascending: true }).limit(limit);
    const { data, error } = await q;
    throwIfError(error, "getDueSoon");
    return (data || []).map(mapTask);
  },
};

// ─── COMMENTS ─────────────────────────────────────────────────────────────
export const CommentDB = {
  async findByTask(taskId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase.from("comments")
      .select("*, author:users!comments_author_id_fkey(id,name)", { count: "exact" })
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);
    throwIfError(error, "findByTask comments");
    return { items: (data || []).map(mapComment), total: count || 0 };
  },

  async findOne(filter) {
    let q = supabase.from("comments").select("*, author:users!comments_author_id_fkey(id,name)");
    if (filter.id) q = q.eq("id", filter.id);
    if (filter.task_id) q = q.eq("task_id", filter.task_id);
    if (filter.project_id) q = q.eq("project_id", filter.project_id);
    const { data, error } = await q.maybeSingle();
    throwIfError(error, "findOne comment");
    return mapComment(data);
  },

  async create(data) {
    const { data: row, error } = await supabase.from("comments").insert({
      task_id: data.task,
      project_id: data.project,
      author_id: data.author,
      body: data.body || data.content,
    }).select("*, author:users!comments_author_id_fkey(id,name)").single();
    throwIfError(error, "create comment");
    return mapComment(row);
  },

  async delete(id) {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    throwIfError(error, "delete comment");
  },

  async deleteMany(filter) {
    let q = supabase.from("comments").delete();
    if (filter.project_id) q = q.eq("project_id", filter.project_id);
    if (filter.task_id) q = q.eq("task_id", filter.task_id);
    const { error } = await q;
    throwIfError(error, "deleteMany comments");
  },
};

// ─── ACTIVITIES ────────────────────────────────────────────────────────────
export const ActivityDB = {
  async create(data) {
    const { error } = await supabase.from("activities").insert({
      project_id: data.project,
      task_id: data.task || null,
      user_id: data.user || data.actor || null,
      actor_id: data.actor || data.user || null,
      action: data.action,
      description: data.description || data.summary || "",
      summary: data.summary || data.description || "",
      metadata: data.metadata || {},
    });
    throwIfError(error, "create activity");
  },

  async findByProject(projectId, { taskId, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let q = supabase.from("activities")
      .select(`*, project:projects(id,name), task:tasks(id,title), user:users!activities_user_id_fkey(id,name,email), actor:users!activities_actor_id_fkey(id,name,email)`, { count: "exact" })
      .eq("project_id", projectId);
    if (taskId) q = q.eq("task_id", taskId);
    q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    throwIfError(error, "findByProject activities");
    return { items: (data || []).map(mapActivity), total: count || 0 };
  },

  async findAll({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase.from("activities")
      .select(`*, project:projects(id,name,key), task:tasks(id,title,task_code), user:users!activities_user_id_fkey(id,name,email), actor:users!activities_actor_id_fkey(id,name,email)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    throwIfError(error, "findAll activities");
    return { items: (data || []).map(mapActivity), total: count || 0 };
  },

  async findFeed({ userId, projectIds, action, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let q = supabase.from("activities")
      .select(`*, project:projects(id,name), task:tasks(id,title), user:users!activities_user_id_fkey(id,name,email), actor:users!activities_actor_id_fkey(id,name,email)`, { count: "exact" });
    if (projectIds) q = q.in("project_id", projectIds);
    if (action) q = q.eq("action", action);
    q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    throwIfError(error, "findFeed activities");
    return { items: (data || []).map(mapActivity), total: count || 0 };
  },

  async getRecent(limit = 10) {
    const { data, error } = await supabase.from("activities")
      .select(`*, project:projects(id,name,key), task:tasks(id,title,task_code), user:users!activities_user_id_fkey(id,name,email), actor:users!activities_actor_id_fkey(id,name,email)`)
      .order("created_at", { ascending: false })
      .limit(limit);
    throwIfError(error, "getRecent activities");
    return (data || []).map(mapActivity);
  },

  async deleteMany(filter) {
    let q = supabase.from("activities").delete();
    if (filter.project_id) q = q.eq("project_id", filter.project_id);
    if (filter.task_id) q = q.eq("task_id", filter.task_id);
    const { error } = await q;
    throwIfError(error, "deleteMany activities");
  },
};
