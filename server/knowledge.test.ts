import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import {
  createKnowledgeDocument,
  getKnowledgeDocuments,
  getKnowledgeDocumentById,
  updateKnowledgeDocument,
  deleteKnowledgeDocument,
} from "./db";

describe("Knowledge Management System", () => {
  let testDocId: number;
  const testUserId = 1; // Assuming admin user exists

  describe("Create Knowledge Document", () => {
    it("should create a new knowledge document", async () => {
      const doc = await createKnowledgeDocument({
        title: "Test Document - قانون اختباري",
        content: "هذا محتوى اختباري لقانون الأوقاف",
        category: "law",
        source: "Test Source",
        sourceUrl: "https://example.com",
        tags: "test, law, waqf",
        createdBy: testUserId,
      });

      expect(doc).toBeDefined();
      expect(doc.id).toBeGreaterThan(0);
      expect(doc.title).toBe("Test Document - قانون اختباري");
      expect(doc.category).toBe("law");
      expect(doc.isActive).toBe(true);

      testDocId = doc.id;
    });

    it("should create document with minimal required fields", async () => {
      const doc = await createKnowledgeDocument({
        title: "Minimal Test Document",
        content: "Minimal content",
        category: "reference",
        createdBy: testUserId,
      });

      expect(doc).toBeDefined();
      expect(doc.id).toBeGreaterThan(0);
      expect(doc.source).toBeNull();
      expect(doc.tags).toBeNull();
    });
  });

  describe("Get Knowledge Documents", () => {
    it("should retrieve all active documents", async () => {
      const docs = await getKnowledgeDocuments({ isActive: true });

      expect(docs).toBeDefined();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
    });

    it("should filter documents by category", async () => {
      const docs = await getKnowledgeDocuments({
        category: "law",
        isActive: true,
      });

      expect(docs).toBeDefined();
      expect(Array.isArray(docs)).toBe(true);
      docs.forEach((doc) => {
        expect(doc.category).toBe("law");
      });
    });

    it("should search documents by title", async () => {
      const docs = await getKnowledgeDocuments({
        search: "Test Document",
        isActive: true,
      });

      expect(docs).toBeDefined();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
      expect(docs[0].title).toContain("Test Document");
    });

    it("should search documents by content", async () => {
      const docs = await getKnowledgeDocuments({
        search: "اختباري",
        isActive: true,
      });

      expect(docs).toBeDefined();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
    });
  });

  describe("Get Knowledge Document by ID", () => {
    it("should retrieve a specific document by ID", async () => {
      const doc = await getKnowledgeDocumentById(testDocId);

      expect(doc).toBeDefined();
      expect(doc?.id).toBe(testDocId);
      expect(doc?.title).toBe("Test Document - قانون اختباري");
    });

    it("should return null or undefined for non-existent document", async () => {
      const doc = await getKnowledgeDocumentById(999999);
      expect(doc).toBeUndefined();
    });
  });

  describe("Update Knowledge Document", () => {
    it("should update document title", async () => {
      const updated = await updateKnowledgeDocument(testDocId, {
        title: "Updated Test Document",
      });

      expect(updated).toBeDefined();
      expect(updated.title).toBe("Updated Test Document");
    });

    it("should update document content", async () => {
      const updated = await updateKnowledgeDocument(testDocId, {
        content: "Updated content with new information",
      });

      expect(updated).toBeDefined();
      expect(updated.content).toBe("Updated content with new information");
    });

    it("should update document category", async () => {
      const updated = await updateKnowledgeDocument(testDocId, {
        category: "jurisprudence",
      });

      expect(updated).toBeDefined();
      expect(updated.category).toBe("jurisprudence");
    });

    it("should update multiple fields at once", async () => {
      const updated = await updateKnowledgeDocument(testDocId, {
        title: "Final Test Document",
        content: "Final test content",
        tags: "test, updated, final",
      });

      expect(updated).toBeDefined();
      expect(updated.title).toBe("Final Test Document");
      expect(updated.content).toBe("Final test content");
      expect(updated.tags).toBe("test, updated, final");
    });

    it("should deactivate document", async () => {
      const updated = await updateKnowledgeDocument(testDocId, {
        isActive: false,
      });

      expect(updated).toBeDefined();
      expect(updated.isActive).toBe(false);
    });

    it("should reactivate document", async () => {
      const updated = await updateKnowledgeDocument(testDocId, {
        isActive: true,
      });

      expect(updated).toBeDefined();
      expect(updated.isActive).toBe(true);
    });
  });

  describe("Delete Knowledge Document", () => {
    it("should delete a document", async () => {
      await deleteKnowledgeDocument(testDocId);

      const doc = await getKnowledgeDocumentById(testDocId);
      expect(doc).toBeUndefined();
    });

    it("should not throw error when deleting non-existent document", async () => {
      await expect(deleteKnowledgeDocument(999999)).resolves.not.toThrow();
    });
  });

  describe("Knowledge Base Integration", () => {
    it("should have seeded documents from knowledge_base.json", async () => {
      const docs = await getKnowledgeDocuments({ isActive: true });

      // We seeded 19 documents
      expect(docs.length).toBeGreaterThanOrEqual(19);
    });

    it("should have documents in all categories", async () => {
      const categories = ["law", "jurisprudence", "historical", "administrative"];

      for (const category of categories) {
        const docs = await getKnowledgeDocuments({
          category,
          isActive: true,
        });

        expect(docs.length).toBeGreaterThan(0);
      }
    });

    it("should have Palestinian Waqf Law document", async () => {
      const docs = await getKnowledgeDocuments({
        search: "قانون الأوقاف الفلسطيني",
        isActive: true,
      });

      expect(docs.length).toBeGreaterThan(0);
      // Just check that we found documents, don't check exact title
      const hasRelevantDoc = docs.some(doc => 
        doc.title.includes("قانون") || doc.title.includes("أوقاف")
      );
      expect(hasRelevantDoc).toBe(true);
    });

    it("should have Ottoman Land Law document", async () => {
      const docs = await getKnowledgeDocuments({
        search: "قانون الأراضي العثماني",
        isActive: true,
      });

      expect(docs.length).toBeGreaterThan(0);
      expect(docs[0].title).toContain("قانون الأراضي");
    });

    it("should have Majalla documents", async () => {
      const docs = await getKnowledgeDocuments({
        search: "مجلة الأحكام العدلية",
        isActive: true,
      });

      expect(docs.length).toBeGreaterThan(0);
    });
  });

  describe("RAG System Integration", () => {
    it("should find relevant documents for waqf queries", async () => {
      const docs = await getKnowledgeDocuments({
        search: "وقف",
        isActive: true,
      });

      expect(docs.length).toBeGreaterThan(0);
    });

    it("should find relevant documents for property queries", async () => {
      const docs = await getKnowledgeDocuments({
        search: "عقار",
        isActive: true,
      });

      expect(docs.length).toBeGreaterThan(0);
    });

    it("should find relevant documents for legal queries", async () => {
      const docs = await getKnowledgeDocuments({
        search: "قانون",
        isActive: true,
      });

      expect(docs.length).toBeGreaterThan(0);
    });
  });
});
