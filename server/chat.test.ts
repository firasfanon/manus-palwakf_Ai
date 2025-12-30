import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("chat.createConversation", () => {
  it("should create a new conversation for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const conversation = await caller.chat.createConversation({
      title: "Test Conversation",
      category: "general",
    });

    expect(conversation).toBeDefined();
    expect(conversation.userId).toBe(ctx.user!.id);
    expect(conversation.category).toBe("general");
    expect(conversation.isActive).toBe(true);
  });

  it("should create conversation with legal category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const conversation = await caller.chat.createConversation({
      category: "legal",
    });

    expect(conversation.category).toBe("legal");
  });
});

describe("chat.myConversations", () => {
  it("should return user's conversations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation first
    await caller.chat.createConversation({
      title: "My Test Conversation",
      category: "general",
    });

    const conversations = await caller.chat.myConversations();

    expect(Array.isArray(conversations)).toBe(true);
    expect(conversations.length).toBeGreaterThan(0);
  });
});

describe("faqs.list", () => {
  it("should return all active FAQs", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const faqs = await caller.faqs.list();

    expect(Array.isArray(faqs)).toBe(true);
    expect(faqs.length).toBeGreaterThan(0);
    faqs.forEach((faq) => {
      expect(faq.isActive).toBe(true);
    });
  });

  it("should filter FAQs by category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const faqs = await caller.faqs.list({ category: "general" });

    expect(Array.isArray(faqs)).toBe(true);
    faqs.forEach((faq) => {
      expect(faq.category).toBe("general");
    });
  });
});

describe("knowledge.list", () => {
  it("should return all active knowledge documents", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.knowledge.list();

    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBeGreaterThan(0);
    docs.forEach((doc) => {
      expect(doc.isActive).toBe(true);
    });
  });

  it("should filter documents by category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.knowledge.list({ category: "law" });

    expect(Array.isArray(docs)).toBe(true);
    docs.forEach((doc) => {
      expect(doc.category).toBe("law");
    });
  });
});

describe("search.query", () => {
  it("should search and return relevant documents", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.search.query({
      query: "الوقف",
      limit: 5,
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((result) => {
      expect(result.relevanceScore).toBeGreaterThan(0);
    });
  });

  it("should respect limit parameter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.search.query({
      query: "قانون",
      limit: 3,
    });

    expect(results.length).toBeLessThanOrEqual(3);
  });
});
