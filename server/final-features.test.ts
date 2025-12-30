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

describe("Dashboard Statistics Tests", () => {
  it("should get dashboard statistics", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();
    
    expect(stats).toBeDefined();
    expect(stats.totals).toBeDefined();
    expect(stats.totals.properties).toBeGreaterThanOrEqual(0);
    expect(stats.totals.cases).toBeGreaterThanOrEqual(0);
    expect(stats.totals.rulings).toBeGreaterThanOrEqual(0);
    expect(stats.totals.deeds).toBeGreaterThanOrEqual(0);
    expect(stats.totals.instructions).toBeGreaterThanOrEqual(0);
    
    expect(Array.isArray(stats.propertiesByGovernorate)).toBe(true);
    expect(Array.isArray(stats.casesByStatus)).toBe(true);
    expect(Array.isArray(stats.propertiesByType)).toBe(true);
  });
});

describe("Rulings CRUD Tests", () => {
  let rulingId: number;

  it("should create a ruling", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const ruling = await caller.rulings.create({
      caseNumber: "RULING-TEST-" + Date.now(),
      title: "حكم اختبار",
      court: "محكمة الاختبار",
      rulingDate: new Date(),
      summary: "ملخص الحكم للاختبار",
      status: "final",
    });

    expect(ruling).toBeDefined();
    expect(ruling.title).toBe("حكم اختبار");
    rulingId = ruling.id;
  });

  it("should get ruling by id", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const ruling = await caller.rulings.getById({ id: rulingId });
    expect(ruling).toBeDefined();
    expect(ruling?.id).toBe(rulingId);
    expect(ruling?.title).toBe("حكم اختبار");
  });

  it("should list rulings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const rulings = await caller.rulings.list();
    expect(Array.isArray(rulings)).toBe(true);
    expect(rulings.length).toBeGreaterThan(0);
  });

  it("should update ruling", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.rulings.update({
      id: rulingId,
      data: {
        title: "حكم اختبار محدث",
        summary: "ملخص محدث",
      },
    });

    const ruling = await caller.rulings.getById({ id: rulingId });
    expect(ruling?.title).toBe("حكم اختبار محدث");
  });

  it("should delete ruling (soft delete)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.rulings.delete({ id: rulingId });
    const ruling = await caller.rulings.getById({ id: rulingId });
    expect(ruling).toBeDefined();
    expect(ruling?.isActive).toBe(false);
  });
});

describe("Deeds CRUD Tests", () => {
  let deedId: number;

  it("should create a deed", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const deed = await caller.deeds.create({
      deedNumber: "DEED-TEST-" + Date.now(),
      title: "حجة اختبار",
      deedDate: new Date(),
      content: "محتوى الحجة للاختبار",
      issuer: "جهة الإصدار",
    });

    expect(deed).toBeDefined();
    expect(deed.title).toBe("حجة اختبار");
    deedId = deed.id;
  });

  it("should get deed by id", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const deed = await caller.deeds.getById({ id: deedId });
    expect(deed).toBeDefined();
    expect(deed?.id).toBe(deedId);
  });

  it("should list deeds", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const deeds = await caller.deeds.list();
    expect(Array.isArray(deeds)).toBe(true);
    expect(deeds.length).toBeGreaterThan(0);
  });

  it("should delete deed (soft delete)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.deeds.delete({ id: deedId });
    const deed = await caller.deeds.getById({ id: deedId });
    expect(deed).toBeDefined();
    expect(deed?.isActive).toBe(false);
  });
});
