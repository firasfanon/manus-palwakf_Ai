import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context for admin user
const adminContext: Context = {
  user: {
    id: 1,
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
    openId: "admin-open-id",
    createdAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// Mock context for regular user
const userContext: Context = {
  user: {
    id: 2,
    name: "Regular User",
    email: "user@test.com",
    role: "user",
    openId: "user-open-id",
    createdAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// Mock context for unauthenticated user
const guestContext: Context = {
  user: null,
  req: {} as any,
  res: {} as any,
};

describe("Admin APIs - Permissions", () => {
  it("should allow admin to access systemStats", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.systemStats();
    
    expect(result).toBeDefined();
    expect(result.totalUsers).toBeGreaterThanOrEqual(0);
    expect(result.totalConversations).toBeGreaterThanOrEqual(0);
    expect(result.totalMessages).toBeGreaterThanOrEqual(0);
    expect(result.totalFAQs).toBeGreaterThanOrEqual(0);
    expect(result.totalDocuments).toBeGreaterThanOrEqual(0);
  });

  it("should deny regular user access to systemStats", async () => {
    const caller = appRouter.createCaller(userContext);
    
    await expect(caller.admin.systemStats()).rejects.toThrow();
  });

  it("should deny guest access to systemStats", async () => {
    const caller = appRouter.createCaller(guestContext);
    
    await expect(caller.admin.systemStats()).rejects.toThrow();
  });
});

describe("Admin APIs - Users Management", () => {
  it("should allow admin to list users", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.users.list({
      page: 1,
      limit: 10,
    });
    
    expect(result).toBeDefined();
    expect(result.users).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("should allow admin to search users", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.users.list({
      page: 1,
      limit: 10,
      search: "admin",
    });
    
    expect(result).toBeDefined();
    expect(result.users).toBeInstanceOf(Array);
  });

  it("should allow admin to filter users by role", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.users.list({
      page: 1,
      limit: 10,
      role: "admin",
    });
    
    expect(result).toBeDefined();
    expect(result.users).toBeInstanceOf(Array);
    // All returned users should be admins
    result.users.forEach((user) => {
      expect(user.role).toBe("admin");
    });
  });

  it("should deny regular user access to users list", async () => {
    const caller = appRouter.createCaller(userContext);
    
    await expect(
      caller.admin.users.list({ page: 1, limit: 10 })
    ).rejects.toThrow();
  });

  it("should allow admin to get user by ID", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.users.getById({ userId: 1 });
    
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.role).toBeDefined();
  });

  it("should handle non-existent user gracefully", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    // Should either return null or throw an error
    try {
      const result = await caller.admin.users.getById({ userId: 999999 });
      expect(result).toBeNull();
    } catch (error) {
      // It's also acceptable to throw an error for non-existent user
      expect(error).toBeDefined();
    }
  });
});

describe("Admin APIs - Content Management", () => {
  it("should allow admin to list FAQs", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.content.faqs.list({});
    
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
  });

  it("should allow admin to filter FAQs by category", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.content.faqs.list({
      category: "general",
    });
    
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    // All returned FAQs should be in 'general' category
    result.forEach((faq) => {
      expect(faq.category).toBe("general");
    });
  });

  it("should allow admin to list documents", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.content.documents.list({});
    
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
  });

  it("should allow admin to filter documents by category", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.content.documents.list({
      category: "law",
    });
    
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    // All returned documents should be in 'law' category
    result.forEach((doc) => {
      expect(doc.category).toBe("law");
    });
  });

  it("should deny regular user access to content management", async () => {
    const caller = appRouter.createCaller(userContext);
    
    await expect(caller.admin.content.faqs.list({})).rejects.toThrow();
    await expect(caller.admin.content.documents.list({})).rejects.toThrow();
  });
});

describe("Admin APIs - Activity Log", () => {
  it("should allow admin to view activity log", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.activityLog({
      type: "all",
      limit: 20,
    });
    
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("should allow admin to filter activity by type", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.activityLog({
      type: "conversations",
      limit: 10,
    });
    
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    // All activities should be conversations
    result.forEach((activity) => {
      expect(activity.type).toBe("conversation");
    });
  });

  it("should respect limit parameter", async () => {
    const caller = appRouter.createCaller(adminContext);
    const result = await caller.admin.activityLog({
      type: "all",
      limit: 5,
    });
    
    expect(result).toBeDefined();
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("should deny regular user access to activity log", async () => {
    const caller = appRouter.createCaller(userContext);
    
    await expect(
      caller.admin.activityLog({ type: "all", limit: 10 })
    ).rejects.toThrow();
  });
});

describe("Admin APIs - Data Integrity", () => {
  it("should return consistent user count across endpoints", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    const stats = await caller.admin.systemStats();
    const usersList = await caller.admin.users.list({ page: 1, limit: 1000 });
    
    expect(stats.totalUsers).toBe(usersList.total);
  });

  it("should return valid date formats", async () => {
    const caller = appRouter.createCaller(adminContext);
    const activities = await caller.admin.activityLog({ type: "all", limit: 5 });
    
    activities.forEach((activity) => {
      expect(activity.createdAt).toBeInstanceOf(Date);
      expect(activity.createdAt.getTime()).not.toBeNaN();
    });
  });

  it("should return valid user stats", async () => {
    const caller = appRouter.createCaller(adminContext);
    const usersList = await caller.admin.users.list({ page: 1, limit: 10 });
    
    usersList.users.forEach((user) => {
      expect(user.conversationCount).toBeGreaterThanOrEqual(0);
      expect(typeof user.conversationCount).toBe("number");
    });
  });
});
