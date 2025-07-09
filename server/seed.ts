import { db } from "./db";
import { 
  users,
  teamMembers, 
  projects, 
  projectMembers, 
  uploadSchedule, 
  activities 
} from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // First create a demo user
    const demoUser = await db.insert(users).values({
      id: "demo-user",
      email: "demo@teamhub.com",
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: null
    }).onConflictDoNothing().returning();
    console.log("Created demo user");

    // Seed team members
    const memberData = [
      { 
        name: "Sarah Johnson", 
        role: "Video Editor", 
        email: "sarah@team.com",
        isActive: true,
        avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b332c85?w=32&h=32&fit=crop&crop=face"
      },
      { 
        name: "Mike Chen", 
        role: "Content Creator", 
        email: "mike@team.com",
        isActive: true,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
      },
      { 
        name: "Emma Davis", 
        role: "Channel Manager", 
        email: "emma@team.com",
        isActive: true,
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face"
      },
      { 
        name: "Alex Rivera", 
        role: "Graphic Designer", 
        email: "alex@team.com",
        isActive: true,
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
      },
      { 
        name: "Jordan Smith", 
        role: "Social Media Manager", 
        email: "jordan@team.com",
        isActive: true,
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=32&h=32&fit=crop&crop=face"
      },
    ];

    const insertedMembers = await db.insert(teamMembers).values(memberData).returning();
    console.log(`Seeded ${insertedMembers.length} team members`);

    // Seed projects
    const projectData = [
      { 
        name: "Tech Reviews", 
        category: "Technology", 
        status: "active", 
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop", 
        subscribers: 125000, 
        videoCount: 45, 
        monthlyViews: 2500000,
        createdBy: "demo-user"
      },
      { 
        name: "Cooking Adventures", 
        category: "Food", 
        status: "active", 
        thumbnailUrl: "https://images.unsplash.com/photo-1556909114-35b94e0ea6ec?w=400&h=300&fit=crop", 
        subscribers: 89000, 
        videoCount: 78, 
        monthlyViews: 1800000,
        createdBy: "demo-user"
      },
      { 
        name: "Fitness Journey", 
        category: "Health", 
        status: "paused", 
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop", 
        subscribers: 67000, 
        videoCount: 32, 
        monthlyViews: 950000,
        createdBy: "demo-user"
      },
      { 
        name: "Travel Vlogs", 
        category: "Travel", 
        status: "active", 
        thumbnailUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop", 
        subscribers: 156000, 
        videoCount: 89, 
        monthlyViews: 3200000,
        createdBy: "demo-user"
      },
      { 
        name: "DIY Crafts", 
        category: "Lifestyle", 
        status: "active", 
        thumbnailUrl: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=300&fit=crop", 
        subscribers: 43000, 
        videoCount: 56, 
        monthlyViews: 720000,
        createdBy: "demo-user"
      },
    ];

    const insertedProjects = await db.insert(projects).values(projectData).returning();
    console.log(`Seeded ${insertedProjects.length} projects`);

    // Seed project members (assign team members to projects)
    const projectMemberData = [
      { projectId: insertedProjects[0].id, memberId: insertedMembers[0].id },
      { projectId: insertedProjects[0].id, memberId: insertedMembers[1].id },
      { projectId: insertedProjects[1].id, memberId: insertedMembers[2].id },
      { projectId: insertedProjects[1].id, memberId: insertedMembers[3].id },
      { projectId: insertedProjects[2].id, memberId: insertedMembers[4].id },
      { projectId: insertedProjects[3].id, memberId: insertedMembers[0].id },
      { projectId: insertedProjects[3].id, memberId: insertedMembers[2].id },
      { projectId: insertedProjects[4].id, memberId: insertedMembers[1].id },
      { projectId: insertedProjects[4].id, memberId: insertedMembers[3].id },
    ];

    await db.insert(projectMembers).values(projectMemberData);
    console.log(`Seeded ${projectMemberData.length} project member relationships`);

    // Seed upload schedule
    const now = new Date();
    const scheduleData = [
      { 
        projectId: insertedProjects[0].id, 
        title: "iPhone 15 Pro Review", 
        scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "scheduled", 
        description: "Comprehensive review of the new iPhone 15 Pro",
        createdBy: "demo-user"
      },
      { 
        projectId: insertedProjects[1].id, 
        title: "Pasta Making Tutorial", 
        scheduledDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        status: "scheduled", 
        description: "How to make fresh pasta from scratch",
        createdBy: "demo-user"
      },
      { 
        projectId: insertedProjects[3].id, 
        title: "Tokyo Street Food Tour", 
        scheduledDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: "scheduled", 
        description: "Exploring the best street food in Tokyo",
        createdBy: "demo-user"
      },
      { 
        projectId: insertedProjects[4].id, 
        title: "DIY Plant Hangers", 
        scheduledDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
        status: "scheduled", 
        description: "Creating beautiful macrame plant hangers",
        createdBy: "demo-user"
      },
    ];

    const insertedSchedule = await db.insert(uploadSchedule).values(scheduleData).returning();
    console.log(`Seeded ${insertedSchedule.length} upload schedule items`);

    // Seed activities
    const activityData = [
      { 
        userId: "demo-user", 
        projectId: insertedProjects[0].id, 
        action: "uploaded", 
        details: "Uploaded new thumbnail for iPhone 15 Pro Review" 
      },
      { 
        userId: "demo-user", 
        projectId: insertedProjects[1].id, 
        action: "scheduled", 
        details: "Scheduled pasta making tutorial for next week" 
      },
      { 
        userId: "demo-user", 
        projectId: insertedProjects[3].id, 
        action: "edited", 
        details: "Updated Tokyo street food tour description" 
      },
      { 
        userId: "demo-user", 
        projectId: insertedProjects[4].id, 
        action: "commented", 
        details: "Added feedback on DIY plant hanger video" 
      },
      { 
        userId: "demo-user", 
        projectId: insertedProjects[2].id, 
        action: "paused", 
        details: "Paused fitness journey project for restructuring" 
      },
    ];

    const insertedActivities = await db.insert(activities).values(activityData).returning();
    console.log(`Seeded ${insertedActivities.length} activities`);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}