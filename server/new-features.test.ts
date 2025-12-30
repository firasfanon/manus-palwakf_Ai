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

describe("Knowledge Management Tests", () => {
  let createdDocId: number;
  let createdFaqId: number;

  it("should create a knowledge document", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const doc = await caller.knowledge.create({
      title: "قانون الأوقاف الفلسطيني",
      content: "نص القانون...",
      category: "law",
      tags: "قانون، أوقاف",
    });
    expect(doc).toBeDefined();
    expect(doc.title).toBe("قانون الأوقاف الفلسطيني");
    createdDocId = doc.id;
  });

  it("should list knowledge documents", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.knowledge.list();
    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBeGreaterThan(0);
  });

  it("should get knowledge document by id", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const doc = await caller.knowledge.getById({ id: createdDocId });
    expect(doc).toBeDefined();
    expect(doc?.id).toBe(createdDocId);
  });

  it("should update knowledge document", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.knowledge.update({
      id: createdDocId,
      data: {
        title: "قانون الأوقاف الفلسطيني المحدث",
        content: "نص القانون المحدث...",
      },
    });
    const doc = await caller.knowledge.getById({ id: createdDocId });
    expect(doc?.title).toBe("قانون الأوقاف الفلسطيني المحدث");
  });

  it("should create a FAQ", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const faq = await caller.faqs.create({
      question: "ما هو الوقف؟",
      answer: "الوقف هو حبس الأصل وتسبيل المنفعة",
      category: "general",
    });
    expect(faq).toBeDefined();
    expect(faq.question).toBe("ما هو الوقف؟");
    createdFaqId = faq.id;
  });

  it("should list FAQs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const faqs = await caller.faqs.list();
    expect(Array.isArray(faqs)).toBe(true);
    expect(faqs.length).toBeGreaterThan(0);
  });

  it("should delete knowledge document (soft delete)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.knowledge.delete({ id: createdDocId });
    const doc = await caller.knowledge.getById({ id: createdDocId });
    // Soft delete: document still exists but isActive is false
    expect(doc).toBeDefined();
    expect(doc?.isActive).toBe(false);
  });

  it("should delete FAQ (soft delete)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.faqs.delete({ id: createdFaqId });
    const faq = await caller.faqs.getById({ id: createdFaqId });
    // Soft delete: FAQ still exists but isActive is false
    expect(faq).toBeDefined();
    expect(faq?.isActive).toBe(false);
  });
});

describe("Property Details Tests", () => {
  let propertyId: number;

  it("should create a property", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const property = await caller.properties.create({
      nationalKey: "PW-TEST-001-" + Date.now(),
      name: "مسجد الاختبار",
      propertyType: "mosque",
      governorate: "القدس",
      city: "القدس",
      waqfType: "charitable",
      description: "مسجد للاختبار",
    });
    expect(property).toBeDefined();
    propertyId = property.id;
  });

  it("should get property by id with all details", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const property = await caller.properties.getById({ id: propertyId });
    expect(property).toBeDefined();
    expect(property?.name).toBe("مسجد الاختبار");
    expect(property?.governorate).toBe("القدس");
  });

  it("should update property", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.properties.update({
      id: propertyId,
      data: {
        name: "مسجد الاختبار المحدث",
        description: "وصف محدث",
      },
    });
    const property = await caller.properties.getById({ id: propertyId });
    expect(property?.name).toBe("مسجد الاختبار المحدث");
  });

  it("should delete property (soft delete)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.properties.delete({ id: propertyId });
    const property = await caller.properties.getById({ id: propertyId });
    // Soft delete: property still exists but isActive is false
    expect(property).toBeDefined();
    expect(property?.isActive).toBe(false);
  });
});

describe("File Upload Tests", () => {
  it("should upload a file", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a simple base64 test file
    const testFileData = "data:text/plain;base64,VGVzdCBmaWxlIGNvbnRlbnQ=";
    
    const result = await caller.files.upload({
      fileName: "test.txt",
      fileData: testFileData,
      mimeType: "text/plain",
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.fileName).toBe("test.txt");
    expect(result.fileKey).toBeDefined();
  });
});
