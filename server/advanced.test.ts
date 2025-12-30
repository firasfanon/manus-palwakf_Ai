import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Waqf Properties", () => {
  it("should list waqf properties", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Waqf Cases", () => {
  it("should list waqf cases", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cases.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Ministerial Instructions", () => {
  it("should list ministerial instructions", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.instructions.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Enhanced Search", () => {
  it("should search across all sources", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.enhancedSearch.query({
      query: "وقف",
      limit: 10,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("should search only in knowledge documents", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.enhancedSearch.query({
      query: "شروط الوقف",
      sources: ["knowledge"],
      limit: 5,
    });

    expect(Array.isArray(results)).toBe(true);
    results.forEach((result) => {
      expect(result.sourceType).toBe("knowledge");
    });
  });
});

describe("Feedback System", () => {
  it("should list feedback for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.list();

    expect(Array.isArray(result)).toBe(true);
  });
});
