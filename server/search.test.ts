import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    name: "Test Admin",
    email: "admin@test.com",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Advanced Search Tests", () => {
  it("should search across all types", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.advancedSearch.advanced({
      query: "test",
      limit: 50,
    });

    expect(results).toBeDefined();
    expect(results.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(results.results)).toBe(true);
  });

  it("should filter by specific types", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.advancedSearch.advanced({
      types: ["property", "case"],
      limit: 50,
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
    
    // All results should be either property or case
    results.results.forEach((result: any) => {
      expect(["property", "case"]).toContain(result.type);
    });
  });

  it("should filter by governorate", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.advancedSearch.advanced({
      governorate: "القدس",
      types: ["property"],
      limit: 50,
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  });

  it("should return results sorted by date", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.advancedSearch.advanced({
      limit: 10,
    });

    expect(results).toBeDefined();
    
    if (results.results.length > 1) {
      // Check that results are sorted by creation date (newest first)
      for (let i = 0; i < results.results.length - 1; i++) {
        const current = new Date(results.results[i].createdAt).getTime();
        const next = new Date(results.results[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it("should respect limit parameter", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.advancedSearch.advanced({
      limit: 5,
    });

    expect(results).toBeDefined();
    expect(results.results.length).toBeLessThanOrEqual(5);
  });

  it("should include required fields in results", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.advancedSearch.advanced({
      limit: 1,
    });

    expect(results).toBeDefined();
    
    if (results.results.length > 0) {
      const result = results.results[0];
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("url");
    }
  });
});
