import { 
  users,
  projects, 
  teamMembers, 
  projectMembers, 
  uploadSchedule, 
  activities,
  projectPermissions,
  descriptionTemplates,
  todoTemplateGroups,
  todoTemplates,
  scheduleAssignments,
  todos,
  pinboardPages,
  pinboardItems,
  pinboardNotes,
  pinboardPolls,
  audioFiles,
  mergeJobs,
  mergeJobFiles,
  systemSettings,
  roles,
  userRoles,
  type User,
  type UpsertUser,
  type Role,
  type InsertRole,
  type UserRole,
  type InsertUserRole,
  type Project, 
  type InsertProject,
  type TeamMember,
  type InsertTeamMember,
  type UploadSchedule,
  type InsertUploadSchedule,
  type Activity,
  type InsertActivity,
  type ProjectPermission,
  type InsertProjectPermission,
  type DescriptionTemplate,
  type InsertDescriptionTemplate,
  type TodoTemplateGroup,
  type InsertTodoTemplateGroup,
  type TodoTemplate,
  type InsertTodoTemplate,
  type ScheduleAssignment,
  type InsertScheduleAssignment,
  type Todo,
  type InsertTodo,
  type PinboardPage,
  type InsertPinboardPage,
  type PinboardItem,
  type InsertPinboardItem,
  type PinboardNote,
  type InsertPinboardNote,
  type PinboardPoll,
  type InsertPinboardPoll,
  type SystemSettings,
  type InsertSystemSettings,
  type ProjectWithMembers,
  type UploadScheduleWithProject,
  type ActivityWithDetails,
  type TodoWithDetails,
  type PinboardPageWithItems,
  type PinboardItemWithDetails,
  type AudioFile,
  type InsertAudioFile,
  type MergeJob,
  type InsertMergeJob,
  type MergeJobFile,
  type InsertMergeJobFile
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalTodos: number;
  totalActivities: number;
  systemUptime: string;
}

export interface IStorage {
  // User operations (mandatory for authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined>;
  getSystemStats(): Promise<SystemStats>;
  getUserStats(userId: string): Promise<{ totalProjects: number; totalTodos: number; completedTodos: number; totalActivities: number; }>;
  
  // Projects
  getProjects(userId?: string): Promise<ProjectWithMembers[]>;
  getProject(id: number, userId?: string): Promise<ProjectWithMembers | undefined>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>, userId: string): Promise<Project | undefined>;
  deleteProject(id: number, userId: string): Promise<boolean>;
  
  // Team Members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  
  // Upload Schedule
  getUploadSchedule(userId?: string): Promise<UploadScheduleWithProject[]>;
  getUploadScheduleByProject(projectId: number, userId?: string): Promise<UploadScheduleWithProject[]>;
  createUploadScheduleItem(item: InsertUploadSchedule, userId: string): Promise<UploadSchedule>;
  updateUploadScheduleItem(id: number, item: Partial<InsertUploadSchedule>, userId: string): Promise<UploadSchedule | undefined>;
  deleteUploadScheduleItem(id: number, userId: string): Promise<boolean>;
  
  // Activities
  getActivities(limit?: number, userId?: string): Promise<ActivityWithDetails[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Description Templates
  getDescriptionTemplates(projectId?: number): Promise<DescriptionTemplate[]>;
  getDescriptionTemplate(id: number): Promise<DescriptionTemplate | undefined>;
  createDescriptionTemplate(template: InsertDescriptionTemplate): Promise<DescriptionTemplate>;
  updateDescriptionTemplate(id: number, template: Partial<InsertDescriptionTemplate>): Promise<DescriptionTemplate | undefined>;
  deleteDescriptionTemplate(id: number): Promise<boolean>;
  
  // Todo Template Groups
  getTodoTemplateGroups(projectId: number): Promise<(TodoTemplateGroup & { templates: TodoTemplate[] })[]>;
  getTodoTemplateGroup(id: number): Promise<(TodoTemplateGroup & { templates: TodoTemplate[] }) | undefined>;
  createTodoTemplateGroup(group: InsertTodoTemplateGroup): Promise<TodoTemplateGroup>;
  updateTodoTemplateGroup(id: number, group: Partial<InsertTodoTemplateGroup>): Promise<TodoTemplateGroup | undefined>;
  deleteTodoTemplateGroup(id: number): Promise<boolean>;
  
  // Todo Templates
  getTodoTemplates(groupId: number): Promise<TodoTemplate[]>;
  getTodoTemplate(id: number): Promise<TodoTemplate | undefined>;
  createTodoTemplate(template: InsertTodoTemplate): Promise<TodoTemplate>;
  updateTodoTemplate(id: number, template: Partial<InsertTodoTemplate>): Promise<TodoTemplate | undefined>;
  deleteTodoTemplate(id: number): Promise<boolean>;
  
  // Schedule Assignments
  getScheduleAssignments(scheduleId: number): Promise<(ScheduleAssignment & { group: TodoTemplateGroup & { templates: TodoTemplate[] } })[]>;
  createScheduleAssignment(assignment: InsertScheduleAssignment): Promise<ScheduleAssignment>;
  updateScheduleAssignment(id: number, assignment: Partial<InsertScheduleAssignment>): Promise<ScheduleAssignment | undefined>;
  deleteScheduleAssignment(id: number): Promise<boolean>;
  getUserEarnings(userId: string): Promise<(ScheduleAssignment & { schedule: UploadSchedule; group: TodoTemplateGroup })[]>;
  
  // Project Members & Permissions
  addProjectMember(projectId: number, memberId: number, userId: string): Promise<void>;
  removeProjectMember(projectId: number, memberId: number, userId: string): Promise<void>;
  setProjectPermission(projectId: number, userId: string, permission: string, grantedBy: string): Promise<void>;
  hasProjectPermission(projectId: number, userId: string, permission: string): Promise<boolean>;
  
  // Todos
  getTodos(userId?: string, projectId?: number): Promise<TodoWithDetails[]>;
  getTodo(id: number): Promise<TodoWithDetails | undefined>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, todo: Partial<InsertTodo>): Promise<Todo | undefined>;
  deleteTodo(id: number, userId: string): Promise<boolean>;
  markTodoComplete(id: number, userId: string): Promise<Todo | undefined>;
  addTodoTick(id: number, userId: string): Promise<Todo | undefined>;
  completeAllTicks(id: number, userId: string): Promise<Todo | undefined>;
  getAssignedTodos(userId: string): Promise<TodoWithDetails[]>;
  getCreatedTodos(userId: string): Promise<TodoWithDetails[]>;
  
  // Pinboard Pages
  getPinboardPages(userId?: string): Promise<PinboardPageWithItems[]>;
  getPinboardPage(id: number): Promise<PinboardPageWithItems | undefined>;
  createPinboardPage(page: InsertPinboardPage): Promise<PinboardPage>;
  updatePinboardPage(id: number, page: Partial<InsertPinboardPage>, userId: string): Promise<PinboardPage | undefined>;
  deletePinboardPage(id: number, userId: string): Promise<boolean>;
  
  // Pinboard Items
  getPinboardItems(pageId: number): Promise<PinboardItemWithDetails[]>;
  createPinboardItem(item: InsertPinboardItem): Promise<PinboardItem>;
  updatePinboardItem(id: number, item: Partial<InsertPinboardItem>, userId: string): Promise<PinboardItem | undefined>;
  deletePinboardItem(id: number, userId: string): Promise<boolean>;
  
  // Pinboard Notes
  createPinboardNote(note: InsertPinboardNote): Promise<PinboardNote>;
  updatePinboardNote(id: number, note: Partial<InsertPinboardNote>, userId: string): Promise<PinboardNote | undefined>;
  deletePinboardNote(id: number, userId: string): Promise<boolean>;
  
  // Pinboard Polls
  createPinboardPoll(poll: InsertPinboardPoll): Promise<PinboardPoll>;
  updatePinboardPoll(id: number, poll: Partial<InsertPinboardPoll>, userId: string): Promise<PinboardPoll | undefined>;
  deletePinboardPoll(id: number, userId: string): Promise<boolean>;
  votePinboardPoll(pollId: number, userId: string, optionIndex: number): Promise<PinboardPoll | undefined>;
  
  // Audio Files
  getAudioFiles(userId?: string): Promise<AudioFile[]>;
  getAudioFile(id: number): Promise<AudioFile | undefined>;
  createAudioFile(file: InsertAudioFile): Promise<AudioFile>;
  deleteAudioFile(id: number, userId: string): Promise<boolean>;
  
  // Merge Jobs
  getMergeJobs(userId?: string): Promise<MergeJob[]>;
  getMergeJob(id: number): Promise<MergeJob | undefined>;
  createMergeJob(job: InsertMergeJob): Promise<MergeJob>;
  updateMergeJob(id: number, job: Partial<InsertMergeJob>): Promise<MergeJob | undefined>;
  deleteMergeJob(id: number, userId: string): Promise<boolean>;
  addJobFiles(jobId: number, fileIds: number[]): Promise<void>;
  
  // Role Management
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  // User Role Management
  getUserRoles(userId: string): Promise<(UserRole & { role: Role })[]>;
  assignUserRole(assignment: InsertUserRole): Promise<UserRole>;
  removeUserRole(userId: string, roleId: number): Promise<boolean>;
  getUserPermissions(userId: string): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Also create or update team member entry for this user
    await db
      .insert(teamMembers)
      .values({
        userId: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unknown User',
        email: user.email || '',
        role: 'member',
        avatarUrl: user.profileImageUrl,
      })
      .onConflictDoNothing();
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    return allUsers;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getSystemStats(): Promise<SystemStats> {
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const activeUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true));
    const totalProjectsResult = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const totalTodosResult = await db.select({ count: sql<number>`count(*)` }).from(todos);
    const totalActivitiesResult = await db.select({ count: sql<number>`count(*)` }).from(activities);

    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      activeUsers: activeUsersResult[0]?.count || 0,
      totalProjects: totalProjectsResult[0]?.count || 0,
      totalTodos: totalTodosResult[0]?.count || 0,
      totalActivities: totalActivitiesResult[0]?.count || 0,
      systemUptime: process.uptime().toString(),
    };
  }

  // Projects
  async getProjects(userId?: string): Promise<ProjectWithMembers[]> {
    const projectsData = await db.select().from(projects).orderBy(desc(projects.createdAt));
    const projectsWithMembers: ProjectWithMembers[] = [];

    for (const project of projectsData) {
      const members = await this.getProjectMembers(project.id);
      projectsWithMembers.push({
        ...project,
        members,
      });
    }

    return projectsWithMembers;
  }

  async getProject(id: number, userId?: string): Promise<ProjectWithMembers | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;

    const members = await this.getProjectMembers(id);
    return {
      ...project,
      members,
    };
  }

  async createProject(project: InsertProject, userId: string): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        createdBy: userId,
      })
      .returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>, userId: string): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    // First ensure all users are synced as team members
    await this.syncUsersAsTeamMembers();
    return await db.select().from(teamMembers).where(eq(teamMembers.isActive, true));
  }

  private async syncUsersAsTeamMembers(): Promise<void> {
    // Get all users
    const allUsers = await db.select().from(users);
    
    // Get existing team member user IDs
    const existingTeamMembers = await db.select({ userId: teamMembers.userId }).from(teamMembers);
    const existingUserIds = new Set(existingTeamMembers.map(tm => tm.userId));
    
    // Create team member entries for users who don't have one
    for (const user of allUsers) {
      if (!existingUserIds.has(user.id)) {
        await db
          .insert(teamMembers)
          .values({
            userId: user.id,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unknown User',
            email: user.email || '',
            role: 'member',
            avatarUrl: user.profileImageUrl,
          });
      }
    }
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  // Upload Schedule
  async getUploadSchedule(userId?: string): Promise<UploadScheduleWithProject[]> {
    const scheduleData = await db
      .select()
      .from(uploadSchedule)
      .leftJoin(projects, eq(uploadSchedule.projectId, projects.id))
      .orderBy(uploadSchedule.scheduledDate);

    // Get user details for assignments
    const scheduleWithUsers = await Promise.all(
      scheduleData.map(async (item) => {
        const assignedToUser = item.upload_schedule.assignedTo 
          ? await this.getUser(item.upload_schedule.assignedTo)
          : undefined;
        const createdByUser = item.upload_schedule.createdBy
          ? await this.getUser(item.upload_schedule.createdBy)
          : undefined;

        return {
          ...item.upload_schedule,
          project: item.projects!,
          assignedToUser,
          createdByUser: createdByUser!,
        };
      })
    );

    return scheduleWithUsers;
  }

  async getUploadScheduleItem(id: number): Promise<UploadSchedule | undefined> {
    const [item] = await db
      .select()
      .from(uploadSchedule)
      .where(eq(uploadSchedule.id, id));
    return item;
  }

  async getUploadScheduleByProject(projectId: number, userId?: string): Promise<UploadScheduleWithProject[]> {
    const scheduleData = await db
      .select()
      .from(uploadSchedule)
      .leftJoin(projects, eq(uploadSchedule.projectId, projects.id))
      .where(eq(uploadSchedule.projectId, projectId))
      .orderBy(uploadSchedule.scheduledDate);

    return scheduleData.map(item => ({
      ...item.upload_schedule,
      project: item.projects!,
    }));
  }

  async createUploadScheduleItem(item: InsertUploadSchedule, userId: string): Promise<UploadSchedule> {
    const [newItem] = await db
      .insert(uploadSchedule)
      .values({
        ...item,
        createdBy: userId,
      })
      .returning();

    // Create todos from project templates if project has templates
    if (item.projectId) {
      const templates = await this.getTodoTemplates(item.projectId);
      for (const template of templates) {
        await this.createTodo({
          title: template.title,
          description: template.description,
          priority: template.priority,
          projectId: item.projectId,
          assignedTo: item.assignedTo || userId, // Assign to uploader if no one assigned
          assignedBy: userId,
        });
      }
    }

    return newItem;
  }

  async updateUploadScheduleItem(id: number, item: Partial<InsertUploadSchedule>, userId: string): Promise<UploadSchedule | undefined> {
    const [updatedItem] = await db
      .update(uploadSchedule)
      .set(item)
      .where(eq(uploadSchedule.id, id))
      .returning();
    return updatedItem;
  }

  async deleteUploadScheduleItem(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(uploadSchedule)
      .where(eq(uploadSchedule.id, id))
      .returning();
    return result.length > 0;
  }

  // Activities
  async getActivities(limit = 10, userId?: string): Promise<ActivityWithDetails[]> {
    const activitiesData = await db
      .select()
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .leftJoin(projects, eq(activities.projectId, projects.id))
      .orderBy(desc(activities.createdAt))
      .limit(limit);

    return activitiesData.map(item => ({
      ...item.activities,
      user: item.users!,
      project: item.projects!,
    }));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Project Members & Permissions
  async addProjectMember(projectId: number, memberId: number, userId: string): Promise<void> {
    await db.insert(projectMembers).values({ projectId, memberId });
  }

  async removeProjectMember(projectId: number, memberId: number, userId: string): Promise<void> {
    await db.delete(projectMembers).where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.memberId, memberId)
      )
    );
  }

  async setProjectPermission(projectId: number, userId: string, permission: string, grantedBy: string): Promise<void> {
    await db.insert(projectPermissions).values({
      projectId,
      userId,
      permission,
      grantedBy,
    });
  }

  async hasProjectPermission(projectId: number, userId: string, permission: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(projectPermissions)
      .where(
        and(
          eq(projectPermissions.projectId, projectId),
          eq(projectPermissions.userId, userId),
          eq(projectPermissions.permission, permission)
        )
      );
    return !!result;
  }

  // Description Templates
  async getDescriptionTemplates(projectId?: number): Promise<DescriptionTemplate[]> {
    const query = db.select().from(descriptionTemplates);
    if (projectId) {
      query.where(eq(descriptionTemplates.projectId, projectId));
    }
    return await query.orderBy(desc(descriptionTemplates.createdAt));
  }

  async getDescriptionTemplate(id: number): Promise<DescriptionTemplate | undefined> {
    const [template] = await db
      .select()
      .from(descriptionTemplates)
      .where(eq(descriptionTemplates.id, id));
    return template || undefined;
  }

  async createDescriptionTemplate(template: InsertDescriptionTemplate): Promise<DescriptionTemplate> {
    const [newTemplate] = await db
      .insert(descriptionTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateDescriptionTemplate(id: number, template: Partial<InsertDescriptionTemplate>): Promise<DescriptionTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(descriptionTemplates)
      .set(template)
      .where(eq(descriptionTemplates.id, id))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteDescriptionTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(descriptionTemplates)
      .where(eq(descriptionTemplates.id, id));
    return (result.rowCount || 0) > 0;
  }

  private async getProjectMembers(projectId: number): Promise<TeamMember[]> {
    const membersData = await db
      .select()
      .from(projectMembers)
      .leftJoin(teamMembers, eq(projectMembers.memberId, teamMembers.id))
      .where(eq(projectMembers.projectId, projectId));

    return membersData.map(item => item.team_members!);
  }

  // Todo operations
  async getTodos(userId?: string, projectId?: number): Promise<TodoWithDetails[]> {
    let query = db
      .select()
      .from(todos)
      .leftJoin(users, eq(todos.assignedTo, users.id))
      .leftJoin(projects, eq(todos.projectId, projects.id))
      .orderBy(desc(todos.createdAt));

    // Apply privacy and user filters
    const conditions = [];
    
    if (userId) {
      // User can see todos if they are assigned or created them, OR if it's public OR they're in visibleTo
      conditions.push(
        and(
          or(
            eq(todos.assignedTo, userId),
            eq(todos.assignedBy, userId)
          ),
          or(
            eq(todos.isPrivate, false),
            eq(todos.assignedTo, userId),
            eq(todos.assignedBy, userId),
            sql`${userId} = ANY(${todos.visibleTo})`
          )
        )
      );
    }

    if (projectId) {
      conditions.push(eq(todos.projectId, projectId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const todosData = await query;
    
    // Get assignedBy users for each todo
    const todosWithDetails: TodoWithDetails[] = [];
    for (const item of todosData) {
      const [assignedByUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, item.todos.assignedBy));
      
      todosWithDetails.push({
        ...item.todos,
        assignedToUser: item.users!,
        assignedByUser: assignedByUser,
        project: item.projects || undefined,
      });
    }
    
    return todosWithDetails;
  }

  async getTodo(id: number): Promise<TodoWithDetails | undefined> {
    const [todoData] = await db
      .select()
      .from(todos)
      .leftJoin(users, eq(todos.assignedTo, users.id))
      .leftJoin(projects, eq(todos.projectId, projects.id))
      .where(eq(todos.id, id));

    if (!todoData) return undefined;

    // Get the assignedBy user separately
    const [assignedByUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, todoData.todos.assignedBy));

    return {
      ...todoData.todos,
      assignedToUser: todoData.users!,
      assignedByUser: assignedByUser!,
      project: todoData.projects || undefined,
    };
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    const [newTodo] = await db
      .insert(todos)
      .values(todo)
      .returning();
    return newTodo;
  }

  async updateTodo(id: number, todo: Partial<InsertTodo>): Promise<Todo | undefined> {
    const [updatedTodo] = await db
      .update(todos)
      .set({ ...todo, updatedAt: new Date() })
      .where(eq(todos.id, id))
      .returning();
    return updatedTodo || undefined;
  }

  async deleteTodo(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(todos)
      .where(and(
        eq(todos.id, id),
        or(
          eq(todos.assignedBy, userId),
          eq(todos.assignedTo, userId)
        )
      ));
    return (result.rowCount || 0) > 0;
  }

  async markTodoComplete(id: number, userId: string): Promise<Todo | undefined> {
    const [updatedTodo] = await db
      .update(todos)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(todos.id, id),
        eq(todos.assignedTo, userId)
      ))
      .returning();
    return updatedTodo || undefined;
  }

  async addTodoTick(id: number, userId: string): Promise<Todo | undefined> {
    // Get current todo
    const [todo] = await db
      .select()
      .from(todos)
      .where(and(
        eq(todos.id, id),
        eq(todos.assignedTo, userId)
      ));
    
    if (!todo) return undefined;
    
    const newTicks = Math.min(todo.currentTicks + 1, todo.totalTicks);
    const isCompleted = newTicks >= todo.totalTicks;
    
    const [updatedTodo] = await db
      .update(todos)
      .set({
        currentTicks: newTicks,
        status: isCompleted ? 'completed' : 'in_progress',
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(todos.id, id))
      .returning();
    
    return updatedTodo || undefined;
  }

  async completeAllTicks(id: number, userId: string): Promise<Todo | undefined> {
    const [updatedTodo] = await db
      .update(todos)
      .set({
        currentTicks: sql`${todos.totalTicks}`,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(todos.id, id),
        eq(todos.assignedTo, userId)
      ))
      .returning();
    
    return updatedTodo || undefined;
  }

  async getAssignedTodos(userId: string): Promise<TodoWithDetails[]> {
    return this.getTodos(userId);
  }

  async getCreatedTodos(userId: string): Promise<TodoWithDetails[]> {
    const todosData = await db
      .select()
      .from(todos)
      .leftJoin(users, eq(todos.assignedTo, users.id))
      .leftJoin(projects, eq(todos.projectId, projects.id))
      .where(eq(todos.assignedBy, userId))
      .orderBy(desc(todos.createdAt));

    return todosData.map(item => ({
      ...item.todos,
      assignedToUser: item.users!,
      assignedByUser: item.users!, // This will be the current user
      project: item.projects || undefined,
    }));
  }

  // Pinboard Pages
  async getPinboardPages(userId?: string): Promise<PinboardPageWithItems[]> {
    const pages = await db.select().from(pinboardPages).orderBy(pinboardPages.pageNumber);
    
    const pagesWithItems = await Promise.all(
      pages.map(async (page) => {
        const items = await this.getPinboardItems(page.id);
        const createdByUser = await this.getUser(page.createdBy);
        
        return {
          ...page,
          items,
          createdBy: createdByUser!,
        };
      })
    );
    
    return pagesWithItems;
  }

  async getPinboardPage(id: number): Promise<PinboardPageWithItems | undefined> {
    const [page] = await db.select().from(pinboardPages).where(eq(pinboardPages.id, id));
    if (!page) return undefined;
    
    const items = await this.getPinboardItems(page.id);
    const createdByUser = await this.getUser(page.createdBy);
    
    return {
      ...page,
      items,
      createdBy: createdByUser!,
    };
  }

  async createPinboardPage(page: InsertPinboardPage): Promise<PinboardPage> {
    const [newPage] = await db.insert(pinboardPages).values(page).returning();
    return newPage;
  }

  async updatePinboardPage(id: number, page: Partial<InsertPinboardPage>, userId: string): Promise<PinboardPage | undefined> {
    const [updatedPage] = await db
      .update(pinboardPages)
      .set({ ...page, updatedAt: new Date() })
      .where(and(eq(pinboardPages.id, id), eq(pinboardPages.createdBy, userId)))
      .returning();
    
    return updatedPage || undefined;
  }

  async deletePinboardPage(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(pinboardPages)
      .where(and(eq(pinboardPages.id, id), eq(pinboardPages.createdBy, userId)));
    
    return result.rowCount > 0;
  }

  // Pinboard Items
  async getPinboardItems(pageId: number): Promise<PinboardItemWithDetails[]> {
    const items = await db
      .select()
      .from(pinboardItems)
      .where(eq(pinboardItems.pageId, pageId))
      .orderBy(pinboardItems.zIndex);
    
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const createdByUser = await this.getUser(item.createdBy);
        let note, poll, todo;
        
        if (item.itemType === 'note' && item.itemId) {
          const [noteData] = await db.select().from(pinboardNotes).where(eq(pinboardNotes.id, item.itemId));
          note = noteData;
        } else if (item.itemType === 'poll' && item.itemId) {
          const [pollData] = await db.select().from(pinboardPolls).where(eq(pinboardPolls.id, item.itemId));
          poll = pollData;
        } else if (item.itemType === 'todo' && item.itemId) {
          todo = await this.getTodo(item.itemId);
        }
        
        return {
          ...item,
          createdBy: createdByUser!,
          note,
          poll,
          todo,
        };
      })
    );
    
    return itemsWithDetails;
  }

  async createPinboardItem(item: InsertPinboardItem): Promise<PinboardItem> {
    const [newItem] = await db.insert(pinboardItems).values(item).returning();
    return newItem;
  }

  async updatePinboardItem(id: number, item: Partial<InsertPinboardItem>, userId: string): Promise<PinboardItem | undefined> {
    const [updatedItem] = await db
      .update(pinboardItems)
      .set({ ...item, updatedAt: new Date() })
      .where(and(eq(pinboardItems.id, id), eq(pinboardItems.createdBy, userId)))
      .returning();
    
    return updatedItem || undefined;
  }

  async deletePinboardItem(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(pinboardItems)
      .where(and(eq(pinboardItems.id, id), eq(pinboardItems.createdBy, userId)));
    
    return result.rowCount > 0;
  }

  // Pinboard Notes
  async createPinboardNote(note: InsertPinboardNote): Promise<PinboardNote> {
    const [newNote] = await db.insert(pinboardNotes).values(note).returning();
    return newNote;
  }

  async updatePinboardNote(id: number, note: Partial<InsertPinboardNote>, userId: string): Promise<PinboardNote | undefined> {
    const [updatedNote] = await db
      .update(pinboardNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(and(eq(pinboardNotes.id, id), eq(pinboardNotes.createdBy, userId)))
      .returning();
    
    return updatedNote || undefined;
  }

  async deletePinboardNote(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(pinboardNotes)
      .where(and(eq(pinboardNotes.id, id), eq(pinboardNotes.createdBy, userId)));
    
    return result.rowCount > 0;
  }

  // Pinboard Polls
  async createPinboardPoll(poll: InsertPinboardPoll): Promise<PinboardPoll> {
    const [newPoll] = await db.insert(pinboardPolls).values(poll).returning();
    return newPoll;
  }

  async updatePinboardPoll(id: number, poll: Partial<InsertPinboardPoll>, userId: string): Promise<PinboardPoll | undefined> {
    const [updatedPoll] = await db
      .update(pinboardPolls)
      .set({ ...poll, updatedAt: new Date() })
      .where(and(eq(pinboardPolls.id, id), eq(pinboardPolls.createdBy, userId)))
      .returning();
    
    return updatedPoll || undefined;
  }

  async deletePinboardPoll(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(pinboardPolls)
      .where(and(eq(pinboardPolls.id, id), eq(pinboardPolls.createdBy, userId)));
    
    return result.rowCount > 0;
  }

  async votePinboardPoll(pollId: number, userId: string, optionIndex: number): Promise<PinboardPoll | undefined> {
    const [poll] = await db.select().from(pinboardPolls).where(eq(pinboardPolls.id, pollId));
    if (!poll) return undefined;
    
    const votes = (poll.votes as any) || {};
    votes[userId] = optionIndex;
    
    const [updatedPoll] = await db
      .update(pinboardPolls)
      .set({ votes, updatedAt: new Date() })
      .where(eq(pinboardPolls.id, pollId))
      .returning();
    
    return updatedPoll || undefined;
  }

  // Audio Files
  async getAudioFiles(userId?: string): Promise<AudioFile[]> {
    const query = db.select().from(audioFiles).orderBy(desc(audioFiles.uploadedAt));
    if (userId) {
      query.where(eq(audioFiles.uploadedBy, userId));
    }
    return await query;
  }

  async getAudioFile(id: number): Promise<AudioFile | undefined> {
    const [file] = await db.select().from(audioFiles).where(eq(audioFiles.id, id));
    return file;
  }

  async createAudioFile(file: InsertAudioFile): Promise<AudioFile> {
    const [newFile] = await db.insert(audioFiles).values(file).returning();
    return newFile;
  }

  async deleteAudioFile(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(audioFiles)
      .where(and(eq(audioFiles.id, id), eq(audioFiles.uploadedBy, userId)))
      .returning();
    return result.length > 0;
  }

  // Merge Jobs
  async getMergeJobs(userId?: string): Promise<MergeJob[]> {
    const query = db.select().from(mergeJobs).orderBy(desc(mergeJobs.createdAt));
    if (userId) {
      query.where(eq(mergeJobs.createdBy, userId));
    }
    return await query;
  }

  async getMergeJob(id: number): Promise<MergeJob | undefined> {
    const [job] = await db.select().from(mergeJobs).where(eq(mergeJobs.id, id));
    return job;
  }

  async createMergeJob(job: InsertMergeJob): Promise<MergeJob> {
    const [newJob] = await db.insert(mergeJobs).values(job).returning();
    return newJob;
  }

  async updateMergeJob(id: number, job: Partial<InsertMergeJob>): Promise<MergeJob | undefined> {
    const [updatedJob] = await db
      .update(mergeJobs)
      .set(job)
      .where(eq(mergeJobs.id, id))
      .returning();
    return updatedJob;
  }

  async addJobFiles(jobId: number, fileIds: number[]): Promise<void> {
    const values = fileIds.map(fileId => ({
      jobId,
      audioFileId: fileId
    }));
    await db.insert(mergeJobFiles).values(values);
  }

  async deleteMergeJob(id: number, userId: string): Promise<boolean> {
    try {
      // Get the job to check ownership and delete output file
      const [job] = await db.select().from(mergeJobs).where(eq(mergeJobs.id, id));
      
      if (!job || job.createdBy !== userId) {
        return false;
      }

      // Delete output file if it exists
      if (job.outputFile) {
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(process.cwd(), 'uploads', job.outputFile);
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }

      // Delete job (cascade will handle job files)
      const result = await db.delete(mergeJobs).where(eq(mergeJobs.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting merge job:", error);
      return false;
    }
  }

  // Todo Template Groups
  async getTodoTemplateGroups(projectId: number): Promise<(TodoTemplateGroup & { templates: TodoTemplate[] })[]> {
    const groups = await db
      .select()
      .from(todoTemplateGroups)
      .where(eq(todoTemplateGroups.projectId, projectId))
      .orderBy(todoTemplateGroups.createdAt);
    
    const groupsWithTemplates = await Promise.all(
      groups.map(async (group) => {
        const templates = await db
          .select()
          .from(todoTemplates)
          .where(eq(todoTemplates.groupId, group.id))
          .orderBy(todoTemplates.order, todoTemplates.createdAt);
        return { ...group, templates };
      })
    );
    
    return groupsWithTemplates;
  }

  async getTodoTemplateGroup(id: number): Promise<(TodoTemplateGroup & { templates: TodoTemplate[] }) | undefined> {
    const [group] = await db
      .select()
      .from(todoTemplateGroups)
      .where(eq(todoTemplateGroups.id, id));
    
    if (!group) return undefined;
    
    const templates = await db
      .select()
      .from(todoTemplates)
      .where(eq(todoTemplates.groupId, group.id))
      .orderBy(todoTemplates.order, todoTemplates.createdAt);
    
    return { ...group, templates };
  }

  async createTodoTemplateGroup(group: InsertTodoTemplateGroup): Promise<TodoTemplateGroup> {
    const [newGroup] = await db
      .insert(todoTemplateGroups)
      .values(group)
      .returning();
    return newGroup;
  }

  async updateTodoTemplateGroup(id: number, group: Partial<InsertTodoTemplateGroup>): Promise<TodoTemplateGroup | undefined> {
    const [updatedGroup] = await db
      .update(todoTemplateGroups)
      .set(group)
      .where(eq(todoTemplateGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteTodoTemplateGroup(id: number): Promise<boolean> {
    const result = await db
      .delete(todoTemplateGroups)
      .where(eq(todoTemplateGroups.id, id));
    return result.rowCount > 0;
  }

  // Todo Templates
  async getTodoTemplates(groupId: number): Promise<TodoTemplate[]> {
    const templates = await db
      .select()
      .from(todoTemplates)
      .where(eq(todoTemplates.groupId, groupId))
      .orderBy(todoTemplates.order, todoTemplates.createdAt);
    return templates;
  }

  async getTodoTemplate(id: number): Promise<TodoTemplate | undefined> {
    const [template] = await db
      .select()
      .from(todoTemplates)
      .where(eq(todoTemplates.id, id));
    return template;
  }

  async createTodoTemplate(template: InsertTodoTemplate): Promise<TodoTemplate> {
    const [newTemplate] = await db
      .insert(todoTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateTodoTemplate(id: number, template: Partial<InsertTodoTemplate>): Promise<TodoTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(todoTemplates)
      .set(template)
      .where(eq(todoTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteTodoTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(todoTemplates)
      .where(eq(todoTemplates.id, id));
    return result.rowCount > 0;
  }

  // Schedule Assignments
  async getScheduleAssignments(scheduleId: number): Promise<(ScheduleAssignment & { group: TodoTemplateGroup & { templates: TodoTemplate[] } })[]> {
    const assignments = await db
      .select()
      .from(scheduleAssignments)
      .where(eq(scheduleAssignments.scheduleId, scheduleId));
    
    const assignmentsWithGroups = await Promise.all(
      assignments.map(async (assignment) => {
        const group = await this.getTodoTemplateGroup(assignment.groupId);
        return { ...assignment, group: group! };
      })
    );
    
    return assignmentsWithGroups;
  }

  async createScheduleAssignment(assignment: InsertScheduleAssignment): Promise<ScheduleAssignment> {
    const [newAssignment] = await db
      .insert(scheduleAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateScheduleAssignment(id: number, assignment: Partial<InsertScheduleAssignment>): Promise<ScheduleAssignment | undefined> {
    const [updatedAssignment] = await db
      .update(scheduleAssignments)
      .set(assignment)
      .where(eq(scheduleAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteScheduleAssignment(id: number): Promise<boolean> {
    const result = await db
      .delete(scheduleAssignments)
      .where(eq(scheduleAssignments.id, id));
    return result.rowCount > 0;
  }

  async getUserEarnings(userId: string): Promise<(ScheduleAssignment & { schedule: UploadSchedule; group: TodoTemplateGroup })[]> {
    const earnings = await db
      .select()
      .from(scheduleAssignments)
      .innerJoin(uploadSchedule, eq(scheduleAssignments.scheduleId, uploadSchedule.id))
      .innerJoin(todoTemplateGroups, eq(scheduleAssignments.groupId, todoTemplateGroups.id))
      .where(eq(scheduleAssignments.assignedTo, userId))
      .orderBy(desc(uploadSchedule.scheduledDate));

    return earnings.map(row => ({
      ...row.schedule_assignments,
      schedule: row.upload_schedule,
      group: row.todo_template_groups
    }));
  }

  // System settings operations
  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      const result = await db.select().from(systemSettings);
      return result;
    } catch (error) {
      console.error("Error fetching system settings:", error);
      return [];
    }
  }

  async getSystemSetting(key: string): Promise<SystemSettings | undefined> {
    try {
      const [result] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key));
      return result;
    } catch (error) {
      console.error("Error fetching system setting:", error);
      return undefined;
    }
  }

  async setSystemSetting(key: string, value: string): Promise<SystemSettings> {
    try {
      const existing = await this.getSystemSetting(key);
      
      if (existing) {
        // Update existing setting
        const [updated] = await db
          .update(systemSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(systemSettings.key, key))
          .returning();
        return updated;
      } else {
        // Create new setting
        const [created] = await db
          .insert(systemSettings)
          .values({ key, value, updatedAt: new Date() })
          .returning();
        return created;
      }
    } catch (error) {
      console.error("Error setting system setting:", error);
      throw error;
    }
  }

  // Role Management
  async getRoles(): Promise<Role[]> {
    try {
      const rolesList = await db.select().from(roles).orderBy(roles.name);
      return rolesList;
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  }

  async getRole(id: number): Promise<Role | undefined> {
    try {
      const [role] = await db.select().from(roles).where(eq(roles.id, id));
      return role;
    } catch (error) {
      console.error("Error fetching role:", error);
      return undefined;
    }
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    try {
      const [role] = await db.insert(roles).values(roleData).returning();
      return role;
    } catch (error) {
      console.error("Error creating role:", error);
      throw error;
    }
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    try {
      const [updated] = await db
        .update(roles)
        .set({ ...roleData, updatedAt: new Date() })
        .where(eq(roles.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating role:", error);
      return undefined;
    }
  }

  async deleteRole(id: number): Promise<boolean> {
    try {
      const role = await this.getRole(id);
      if (!role) return false;
      
      // Prevent deletion of system roles
      if (role.isSystem) {
        throw new Error("Cannot delete system role");
      }
      
      await db.delete(roles).where(eq(roles.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting role:", error);
      return false;
    }
  }

  // User Role Management
  async getUserRoles(userId: string): Promise<(UserRole & { role: Role })[]> {
    try {
      const userRolesList = await db
        .select()
        .from(userRoles)
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));
      
      return userRolesList.map(item => ({
        ...item.user_roles,
        role: item.roles!
      }));
    } catch (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
  }

  async assignUserRole(assignment: InsertUserRole): Promise<UserRole> {
    try {
      const [userRole] = await db.insert(userRoles).values(assignment).returning();
      return userRole;
    } catch (error) {
      console.error("Error assigning user role:", error);
      throw error;
    }
  }

  async removeUserRole(userId: string, roleId: number): Promise<boolean> {
    try {
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
      return true;
    } catch (error) {
      console.error("Error removing user role:", error);
      return false;
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const userRolesList = await this.getUserRoles(userId);
      const permissions = new Set<string>();
      
      userRolesList.forEach(userRole => {
        if (userRole.role.permissions) {
          userRole.role.permissions.forEach(permission => {
            permissions.add(permission);
          });
        }
      });
      
      return Array.from(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      return [];
    }
  }

  async getUserStats(userId: string): Promise<{ totalProjects: number; totalTodos: number; completedTodos: number; totalActivities: number; }> {
    try {
      // For now, return simplified stats to avoid query issues
      const userTodos = await db.select().from(todos).where(eq(todos.assignedTo, userId));
      const userActivities = await db.select().from(activities).where(eq(activities.userId, userId));

      const totalProjects = 0; // Simplified for now
      const totalTodos = userTodos.length;
      const completedTodos = userTodos.filter(todo => todo.status === "completed").length;
      const totalActivities = userActivities.length;

      return {
        totalProjects,
        totalTodos,
        completedTodos,
        totalActivities,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return {
        totalProjects: 0,
        totalTodos: 0,
        completedTodos: 0,
        totalActivities: 0,
      };
    }
  }
}

// Temporarily using DatabaseStorage until Firebase Firestore API is enabled
export const storage = new DatabaseStorage();