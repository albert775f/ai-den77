import { db } from './firebase';
import {
  users,
  projects,
  teamMembers,
  uploadSchedule,
  activities,
  descriptionTemplates,
  todos,
  pinboardPages,
  pinboardItems,
  pinboardNotes,
  pinboardPolls,
  audioFiles,
  mergeJobs,
  todoTemplateGroups,
  todoTemplates,
  scheduleAssignments,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type TeamMember,
  type InsertTeamMember,
  type UploadSchedule,
  type InsertUploadSchedule,
  type Activity,
  type InsertActivity,
  type DescriptionTemplate,
  type InsertDescriptionTemplate,
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
  type AudioFile,
  type InsertAudioFile,
  type MergeJob,
  type InsertMergeJob,
  type TodoTemplateGroup,
  type InsertTodoTemplateGroup,
  type TodoTemplate,
  type InsertTodoTemplate,
  type ScheduleAssignment,
  type InsertScheduleAssignment,
} from '@shared/schema';
import { IStorage } from './storage';

// Type definitions for Firebase responses
interface ProjectWithMembers extends Project {
  members: TeamMember[];
}

interface UploadScheduleWithProject extends UploadSchedule {
  project: Project;
}

interface ActivityWithDetails extends Activity {
  user: User;
  project?: Project;
}

interface TodoWithDetails extends Todo {
  assignedToUser?: User;
  assignedByUser?: User;
  project?: Project;
}

interface PinboardPageWithItems extends PinboardPage {
  items: PinboardItemWithDetails[];
}

interface PinboardItemWithDetails extends PinboardItem {
  note?: PinboardNote;
  poll?: PinboardPoll;
  todo?: TodoWithDetails;
}

export class FirebaseStorage implements IStorage {
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private async getCollection(collectionName: string) {
    return db.collection(collectionName);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (!doc.exists) return undefined;
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const userRef = db.collection('users').doc(userData.id);
      const now = new Date();
      
      await userRef.set({
        ...userData,
        updatedAt: now,
        createdAt: now,
      }, { merge: true });
      
      const doc = await userRef.get();
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Projects
  async getProjects(userId?: string): Promise<ProjectWithMembers[]> {
    try {
      const snapshot = await db.collection('projects').get();
      const projects: ProjectWithMembers[] = [];
      
      for (const doc of snapshot.docs) {
        const project = { id: parseInt(doc.id), ...doc.data() } as Project;
        const members = await this.getProjectMembers(project.id);
        projects.push({ ...project, members });
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  async getProject(id: number, userId?: string): Promise<ProjectWithMembers | undefined> {
    try {
      const doc = await db.collection('projects').doc(id.toString()).get();
      if (!doc.exists) return undefined;
      
      const project = { id: parseInt(doc.id), ...doc.data() } as Project;
      const members = await this.getProjectMembers(project.id);
      
      return { ...project, members };
    } catch (error) {
      console.error('Error getting project:', error);
      return undefined;
    }
  }

  async createProject(project: InsertProject, userId: string): Promise<Project> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const projectData = {
        ...project,
        id: parseInt(id),
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };
      
      await db.collection('projects').doc(id).set(projectData);
      
      // Create activity
      await this.createActivity({
        type: 'project_created',
        description: `Created project "${project.name}"`,
        userId: userId,
        projectId: parseInt(id),
        metadata: { projectName: project.name },
      });
      
      return projectData as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id: number, project: Partial<InsertProject>, userId: string): Promise<Project | undefined> {
    try {
      const projectRef = db.collection('projects').doc(id.toString());
      const doc = await projectRef.get();
      
      if (!doc.exists) return undefined;
      
      const updateData = {
        ...project,
        updatedAt: new Date(),
      };
      
      await projectRef.update(updateData);
      
      const updatedDoc = await projectRef.get();
      return { id: parseInt(updatedDoc.id), ...updatedDoc.data() } as Project;
    } catch (error) {
      console.error('Error updating project:', error);
      return undefined;
    }
  }

  async deleteProject(id: number, userId: string): Promise<boolean> {
    try {
      await db.collection('projects').doc(id.toString()).delete();
      
      // Create activity
      await this.createActivity({
        type: 'project_deleted',
        description: `Deleted project`,
        userId: userId,
        metadata: { projectId: id },
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      await this.syncUsersAsTeamMembers();
      const snapshot = await db.collection('teamMembers').get();
      return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() })) as TeamMember[];
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
  }

  private async syncUsersAsTeamMembers(): Promise<void> {
    try {
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const teamMemberRef = db.collection('teamMembers').doc(userDoc.id);
        
        await teamMemberRef.set({
          id: userDoc.id,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email || 'Unknown',
          email: userData.email || '',
          role: userData.role || 'member',
          profileImageUrl: userData.profileImageUrl || '',
          createdAt: userData.createdAt || new Date(),
          updatedAt: new Date(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error syncing users as team members:', error);
    }
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    try {
      const doc = await db.collection('teamMembers').doc(id.toString()).get();
      if (!doc.exists) return undefined;
      return { id: parseInt(doc.id), ...doc.data() } as TeamMember;
    } catch (error) {
      console.error('Error getting team member:', error);
      return undefined;
    }
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const memberData = {
        ...member,
        id: parseInt(id),
        createdAt: now,
        updatedAt: now,
      };
      
      await db.collection('teamMembers').doc(id).set(memberData);
      return memberData as TeamMember;
    } catch (error) {
      console.error('Error creating team member:', error);
      throw error;
    }
  }

  // Upload Schedule
  async getUploadSchedule(userId?: string): Promise<UploadScheduleWithProject[]> {
    try {
      const snapshot = await db.collection('uploadSchedule').get();
      const scheduleItems: UploadScheduleWithProject[] = [];
      
      for (const doc of snapshot.docs) {
        const item = { id: parseInt(doc.id), ...doc.data() } as UploadSchedule;
        const project = await this.getProject(item.projectId);
        
        if (project) {
          scheduleItems.push({ ...item, project });
        }
      }
      
      return scheduleItems;
    } catch (error) {
      console.error('Error getting upload schedule:', error);
      return [];
    }
  }

  async getUploadScheduleByProject(projectId: number, userId?: string): Promise<UploadScheduleWithProject[]> {
    try {
      const snapshot = await db.collection('uploadSchedule')
        .where('projectId', '==', projectId)
        .get();
      
      const scheduleItems: UploadScheduleWithProject[] = [];
      const project = await this.getProject(projectId);
      
      if (project) {
        for (const doc of snapshot.docs) {
          const item = { id: parseInt(doc.id), ...doc.data() } as UploadSchedule;
          scheduleItems.push({ ...item, project });
        }
      }
      
      return scheduleItems;
    } catch (error) {
      console.error('Error getting upload schedule by project:', error);
      return [];
    }
  }

  async createUploadScheduleItem(item: InsertUploadSchedule, userId: string): Promise<UploadSchedule> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const itemData = {
        ...item,
        id: parseInt(id),
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };
      
      await db.collection('uploadSchedule').doc(id).set(itemData);
      
      // Create activity
      await this.createActivity({
        type: 'upload_scheduled',
        description: `Scheduled upload: ${item.title}`,
        userId: userId,
        projectId: item.projectId,
        metadata: { title: item.title, scheduledDate: item.scheduledDate },
      });
      
      return itemData as UploadSchedule;
    } catch (error) {
      console.error('Error creating upload schedule item:', error);
      throw error;
    }
  }

  async updateUploadScheduleItem(id: number, item: Partial<InsertUploadSchedule>, userId: string): Promise<UploadSchedule | undefined> {
    try {
      const itemRef = db.collection('uploadSchedule').doc(id.toString());
      const doc = await itemRef.get();
      
      if (!doc.exists) return undefined;
      
      const updateData = {
        ...item,
        updatedAt: new Date(),
      };
      
      await itemRef.update(updateData);
      
      const updatedDoc = await itemRef.get();
      return { id: parseInt(updatedDoc.id), ...updatedDoc.data() } as UploadSchedule;
    } catch (error) {
      console.error('Error updating upload schedule item:', error);
      return undefined;
    }
  }

  async deleteUploadScheduleItem(id: number, userId: string): Promise<boolean> {
    try {
      await db.collection('uploadSchedule').doc(id.toString()).delete();
      return true;
    } catch (error) {
      console.error('Error deleting upload schedule item:', error);
      return false;
    }
  }

  // Activities
  async getActivities(limit = 10, userId?: string): Promise<ActivityWithDetails[]> {
    try {
      const snapshot = await db.collection('activities')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const activities: ActivityWithDetails[] = [];
      
      for (const doc of snapshot.docs) {
        const activity = { id: parseInt(doc.id), ...doc.data() } as Activity;
        const user = await this.getUser(activity.userId);
        const project = activity.projectId ? await this.getProject(activity.projectId) : undefined;
        
        if (user) {
          activities.push({ ...activity, user, project });
        }
      }
      
      return activities;
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const activityData = {
        ...activity,
        id: parseInt(id),
        createdAt: now,
      };
      
      await db.collection('activities').doc(id).set(activityData);
      return activityData as Activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  // Helper method for getting project members
  private async getProjectMembers(projectId: number): Promise<TeamMember[]> {
    try {
      const snapshot = await db.collection('projectMembers')
        .where('projectId', '==', projectId)
        .get();
      
      const members: TeamMember[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const member = await this.getTeamMember(data.memberId);
        if (member) {
          members.push(member);
        }
      }
      
      return members;
    } catch (error) {
      console.error('Error getting project members:', error);
      return [];
    }
  }

  // Stub implementations for remaining methods - will implement these based on your needs
  async addProjectMember(projectId: number, memberId: number, userId: string): Promise<void> {
    // Implementation needed
  }

  async removeProjectMember(projectId: number, memberId: number, userId: string): Promise<void> {
    // Implementation needed
  }

  async setProjectPermission(projectId: number, userId: string, permission: string, grantedBy: string): Promise<void> {
    // Implementation needed
  }

  async hasProjectPermission(projectId: number, userId: string, permission: string): Promise<boolean> {
    return true; // Stub implementation
  }

  async getDescriptionTemplates(projectId?: number): Promise<DescriptionTemplate[]> {
    try {
      let query = db.collection('descriptionTemplates');
      if (projectId) {
        query = query.where('projectId', '==', projectId);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() })) as DescriptionTemplate[];
    } catch (error) {
      console.error('Error getting description templates:', error);
      return [];
    }
  }

  async getDescriptionTemplate(id: number): Promise<DescriptionTemplate | undefined> {
    try {
      const doc = await db.collection('descriptionTemplates').doc(id.toString()).get();
      if (!doc.exists) return undefined;
      return { id: parseInt(doc.id), ...doc.data() } as DescriptionTemplate;
    } catch (error) {
      console.error('Error getting description template:', error);
      return undefined;
    }
  }

  async createDescriptionTemplate(template: InsertDescriptionTemplate): Promise<DescriptionTemplate> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const templateData = {
        ...template,
        id: parseInt(id),
        createdAt: now,
        updatedAt: now,
      };
      
      await db.collection('descriptionTemplates').doc(id).set(templateData);
      return templateData as DescriptionTemplate;
    } catch (error) {
      console.error('Error creating description template:', error);
      throw error;
    }
  }

  async updateDescriptionTemplate(id: number, template: Partial<InsertDescriptionTemplate>): Promise<DescriptionTemplate | undefined> {
    try {
      const templateRef = db.collection('descriptionTemplates').doc(id.toString());
      const doc = await templateRef.get();
      
      if (!doc.exists) return undefined;
      
      const updateData = {
        ...template,
        updatedAt: new Date(),
      };
      
      await templateRef.update(updateData);
      
      const updatedDoc = await templateRef.get();
      return { id: parseInt(updatedDoc.id), ...updatedDoc.data() } as DescriptionTemplate;
    } catch (error) {
      console.error('Error updating description template:', error);
      return undefined;
    }
  }

  async deleteDescriptionTemplate(id: number): Promise<boolean> {
    try {
      await db.collection('descriptionTemplates').doc(id.toString()).delete();
      return true;
    } catch (error) {
      console.error('Error deleting description template:', error);
      return false;
    }
  }

  async getTodos(userId?: string, projectId?: number): Promise<TodoWithDetails[]> {
    return []; // Stub implementation
  }

  async getTodo(id: number): Promise<TodoWithDetails | undefined> {
    return undefined; // Stub implementation
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    throw new Error('Not implemented');
  }

  async updateTodo(id: number, todo: Partial<InsertTodo>): Promise<Todo | undefined> {
    return undefined; // Stub implementation
  }

  async deleteTodo(id: number, userId: string): Promise<boolean> {
    return false; // Stub implementation
  }

  async markTodoComplete(id: number, userId: string): Promise<Todo | undefined> {
    return undefined; // Stub implementation
  }

  async addTodoTick(id: number, userId: string): Promise<Todo | undefined> {
    return undefined; // Stub implementation
  }

  async completeAllTicks(id: number, userId: string): Promise<Todo | undefined> {
    return undefined; // Stub implementation
  }

  async getAssignedTodos(userId: string): Promise<TodoWithDetails[]> {
    return []; // Stub implementation
  }

  async getCreatedTodos(userId: string): Promise<TodoWithDetails[]> {
    return []; // Stub implementation
  }

  async getPinboardPages(userId?: string): Promise<PinboardPageWithItems[]> {
    return []; // Stub implementation
  }

  async getPinboardPage(id: number): Promise<PinboardPageWithItems | undefined> {
    return undefined; // Stub implementation
  }

  async createPinboardPage(page: InsertPinboardPage): Promise<PinboardPage> {
    throw new Error('Not implemented');
  }

  async updatePinboardPage(id: number, page: Partial<InsertPinboardPage>, userId: string): Promise<PinboardPage | undefined> {
    return undefined; // Stub implementation
  }

  async deletePinboardPage(id: number, userId: string): Promise<boolean> {
    return false; // Stub implementation
  }

  async getPinboardItems(pageId: number): Promise<PinboardItemWithDetails[]> {
    return []; // Stub implementation
  }

  async createPinboardItem(item: InsertPinboardItem): Promise<PinboardItem> {
    throw new Error('Not implemented');
  }

  async updatePinboardItem(id: number, item: Partial<InsertPinboardItem>, userId: string): Promise<PinboardItem | undefined> {
    return undefined; // Stub implementation
  }

  async deletePinboardItem(id: number, userId: string): Promise<boolean> {
    return false; // Stub implementation
  }

  async createPinboardNote(note: InsertPinboardNote): Promise<PinboardNote> {
    throw new Error('Not implemented');
  }

  async updatePinboardNote(id: number, note: Partial<InsertPinboardNote>, userId: string): Promise<PinboardNote | undefined> {
    return undefined; // Stub implementation
  }

  async deletePinboardNote(id: number, userId: string): Promise<boolean> {
    return false; // Stub implementation
  }

  async createPinboardPoll(poll: InsertPinboardPoll): Promise<PinboardPoll> {
    throw new Error('Not implemented');
  }

  async updatePinboardPoll(id: number, poll: Partial<InsertPinboardPoll>, userId: string): Promise<PinboardPoll | undefined> {
    return undefined; // Stub implementation
  }

  async deletePinboardPoll(id: number, userId: string): Promise<boolean> {
    return false; // Stub implementation
  }

  async votePinboardPoll(pollId: number, userId: string, optionIndex: number): Promise<PinboardPoll | undefined> {
    return undefined; // Stub implementation
  }

  async getAudioFiles(userId?: string): Promise<AudioFile[]> {
    try {
      let query = db.collection('audioFiles').orderBy('uploadedAt', 'desc');
      if (userId) {
        query = query.where('uploadedBy', '==', userId);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() })) as AudioFile[];
    } catch (error) {
      console.error('Error getting audio files:', error);
      return [];
    }
  }

  async getAudioFile(id: number): Promise<AudioFile | undefined> {
    try {
      const doc = await db.collection('audioFiles').doc(id.toString()).get();
      if (!doc.exists) return undefined;
      return { id: parseInt(doc.id), ...doc.data() } as AudioFile;
    } catch (error) {
      console.error('Error getting audio file:', error);
      return undefined;
    }
  }

  async createAudioFile(file: InsertAudioFile): Promise<AudioFile> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const fileData = {
        ...file,
        id: parseInt(id),
        uploadedAt: now,
      };
      
      await db.collection('audioFiles').doc(id).set(fileData);
      return fileData as AudioFile;
    } catch (error) {
      console.error('Error creating audio file:', error);
      throw error;
    }
  }

  async deleteAudioFile(id: number, userId: string): Promise<boolean> {
    try {
      await db.collection('audioFiles').doc(id.toString()).delete();
      return true;
    } catch (error) {
      console.error('Error deleting audio file:', error);
      return false;
    }
  }

  async getMergeJobs(userId?: string): Promise<MergeJob[]> {
    try {
      let query = db.collection('mergeJobs').orderBy('createdAt', 'desc');
      if (userId) {
        query = query.where('createdBy', '==', userId);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() })) as MergeJob[];
    } catch (error) {
      console.error('Error getting merge jobs:', error);
      return [];
    }
  }

  async getMergeJob(id: number): Promise<MergeJob | undefined> {
    try {
      const doc = await db.collection('mergeJobs').doc(id.toString()).get();
      if (!doc.exists) return undefined;
      return { id: parseInt(doc.id), ...doc.data() } as MergeJob;
    } catch (error) {
      console.error('Error getting merge job:', error);
      return undefined;
    }
  }

  async createMergeJob(job: InsertMergeJob): Promise<MergeJob> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const jobData = {
        ...job,
        id: parseInt(id),
        createdAt: now,
        updatedAt: now,
      };
      
      await db.collection('mergeJobs').doc(id).set(jobData);
      return jobData as MergeJob;
    } catch (error) {
      console.error('Error creating merge job:', error);
      throw error;
    }
  }

  async updateMergeJob(id: number, job: Partial<InsertMergeJob>): Promise<MergeJob | undefined> {
    try {
      const jobRef = db.collection('mergeJobs').doc(id.toString());
      const doc = await jobRef.get();
      
      if (!doc.exists) return undefined;
      
      const updateData = {
        ...job,
        updatedAt: new Date(),
      };
      
      await jobRef.update(updateData);
      
      const updatedDoc = await jobRef.get();
      return { id: parseInt(updatedDoc.id), ...updatedDoc.data() } as MergeJob;
    } catch (error) {
      console.error('Error updating merge job:', error);
      return undefined;
    }
  }

  async deleteMergeJob(id: number, userId: string): Promise<boolean> {
    try {
      await db.collection('mergeJobs').doc(id.toString()).delete();
      return true;
    } catch (error) {
      console.error('Error deleting merge job:', error);
      return false;
    }
  }

  async addJobFiles(jobId: number, fileIds: number[]): Promise<void> {
    try {
      const jobRef = db.collection('mergeJobs').doc(jobId.toString());
      const doc = await jobRef.get();
      
      if (!doc.exists) return;
      
      const currentData = doc.data();
      const currentFiles = currentData?.files || [];
      const updatedFiles = [...currentFiles, ...fileIds];
      
      await jobRef.update({
        files: updatedFiles,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding job files:', error);
    }
  }

  async getTodoTemplateGroups(projectId: number): Promise<(TodoTemplateGroup & { templates: TodoTemplate[] })[]> {
    return []; // Stub implementation
  }

  async getTodoTemplateGroup(id: number): Promise<(TodoTemplateGroup & { templates: TodoTemplate[] }) | undefined> {
    return undefined; // Stub implementation
  }

  async createTodoTemplateGroup(group: InsertTodoTemplateGroup): Promise<TodoTemplateGroup> {
    throw new Error('Not implemented');
  }

  async updateTodoTemplateGroup(id: number, group: Partial<InsertTodoTemplateGroup>): Promise<TodoTemplateGroup | undefined> {
    return undefined; // Stub implementation
  }

  async deleteTodoTemplateGroup(id: number): Promise<boolean> {
    return false; // Stub implementation
  }

  async getTodoTemplates(groupId: number): Promise<TodoTemplate[]> {
    return []; // Stub implementation
  }

  async getTodoTemplate(id: number): Promise<TodoTemplate | undefined> {
    return undefined; // Stub implementation
  }

  async createTodoTemplate(template: InsertTodoTemplate): Promise<TodoTemplate> {
    throw new Error('Not implemented');
  }

  async updateTodoTemplate(id: number, template: Partial<InsertTodoTemplate>): Promise<TodoTemplate | undefined> {
    return undefined; // Stub implementation
  }

  async deleteTodoTemplate(id: number): Promise<boolean> {
    return false; // Stub implementation
  }

  async getScheduleAssignments(scheduleId: number): Promise<(ScheduleAssignment & { group: TodoTemplateGroup & { templates: TodoTemplate[] } })[]> {
    return []; // Stub implementation
  }

  async createScheduleAssignment(assignment: InsertScheduleAssignment): Promise<ScheduleAssignment> {
    throw new Error('Not implemented');
  }

  async updateScheduleAssignment(id: number, assignment: Partial<InsertScheduleAssignment>): Promise<ScheduleAssignment | undefined> {
    return undefined; // Stub implementation
  }

  async deleteScheduleAssignment(id: number): Promise<boolean> {
    return false; // Stub implementation
  }

  // System settings operations
  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      const settingsRef = collection(db, "system_settings");
      const querySnapshot = await getDocs(settingsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.data().id,
        key: doc.data().key,
        value: doc.data().value,
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error("Error fetching system settings:", error);
      return [];
    }
  }

  async getSystemSetting(key: string): Promise<SystemSettings | undefined> {
    try {
      const settingsRef = collection(db, "system_settings");
      const q = query(settingsRef, where("key", "==", key));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.data().id,
          key: doc.data().key,
          value: doc.data().value,
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching system setting:", error);
      return undefined;
    }
  }

  async setSystemSetting(key: string, value: string): Promise<SystemSettings> {
    try {
      const settingsRef = collection(db, "system_settings");
      const q = query(settingsRef, where("key", "==", key));
      const querySnapshot = await getDocs(q);
      
      const settingData = {
        key,
        value,
        updatedAt: new Date(),
      };

      if (!querySnapshot.empty) {
        // Update existing setting
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, settingData);
        return {
          id: querySnapshot.docs[0].data().id,
          ...settingData,
        };
      } else {
        // Create new setting
        const newId = this.generateId();
        const newSetting = {
          id: newId,
          ...settingData,
        };
        await addDoc(settingsRef, newSetting);
        return newSetting;
      }
    } catch (error) {
      console.error("Error setting system setting:", error);
      throw error;
    }
  }

  async getUploadScheduleItem(id: number): Promise<UploadSchedule | undefined> {
    try {
      const scheduleRef = collection(db, "upload_schedule");
      const q = query(scheduleRef, where("id", "==", id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.data().id,
          projectId: doc.data().projectId,
          title: doc.data().title,
          description: doc.data().description,
          scheduledDate: doc.data().scheduledDate?.toDate() || new Date(),
          status: doc.data().status,
          assignedTo: doc.data().assignedTo,
          createdBy: doc.data().createdBy,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching upload schedule item:", error);
      return undefined;
    }
  }

  async getUserStats(userId: string): Promise<{ totalProjects: number; totalTodos: number; completedTodos: number; totalActivities: number; }> {
    try {
      const [projectsSnapshot, todosSnapshot, activitiesSnapshot] = await Promise.all([
        this.getCollection("projects"),
        this.getCollection("todos"),
        this.getCollection("activities")
      ]);

      // Count projects where user is involved
      const totalProjects = projectsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.members && data.members.includes(userId);
      }).length;

      // Count todos assigned to user
      const userTodos = todosSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.assignedTo === userId;
      });

      const totalTodos = userTodos.length;
      const completedTodos = userTodos.filter(doc => doc.data().status === "completed").length;

      // Count activities by user
      const totalActivities = activitiesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.userId === userId;
      }).length;

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