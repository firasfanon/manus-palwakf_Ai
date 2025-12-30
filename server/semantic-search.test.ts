/**
 * Tests for Semantic Search System
 */

import { describe, it, expect, beforeAll } from "vitest";
import { generateEmbeddings, cosineSimilarity, semanticSearch, hybridSearch } from "./embeddings";

describe("Semantic Search System", () => {
  describe("generateEmbeddings", () => {
    it("should generate embeddings for Arabic text", async () => {
      const text = "ما هي شروط صحة الوقف في الشريعة الإسلامية؟";
      const embedding = await generateEmbeddings(text);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      expect(embedding.every((val) => typeof val === "number")).toBe(true);
    }, 30000); // 30 second timeout for API call

    it("should generate different embeddings for different texts", async () => {
      const text1 = "الوقف في الشريعة الإسلامية";
      const text2 = "قانون الأراضي العثماني";

      const embedding1 = await generateEmbeddings(text1);
      const embedding2 = await generateEmbeddings(text2);

      expect(embedding1).not.toEqual(embedding2);
    }, 30000);
  });

  describe("cosineSimilarity", () => {
    it("should return 1 for identical embeddings", () => {
      const embedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const similarity = cosineSimilarity(embedding, embedding);

      expect(similarity).toBeCloseTo(1, 5);
    });

    it("should return 0 for orthogonal embeddings", () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];
      const similarity = cosineSimilarity(embedding1, embedding2);

      expect(similarity).toBeCloseTo(0, 5);
    });

    it("should return value between 0 and 1 for similar embeddings", () => {
      const embedding1 = [0.1, 0.2, 0.3];
      const embedding2 = [0.15, 0.25, 0.35];
      const similarity = cosineSimilarity(embedding1, embedding2);

      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it("should throw error for embeddings of different lengths", () => {
      const embedding1 = [0.1, 0.2, 0.3];
      const embedding2 = [0.1, 0.2];

      expect(() => cosineSimilarity(embedding1, embedding2)).toThrow();
    });
  });

  describe("semanticSearch", () => {
    it("should return top K most similar documents", () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const documents = [
        { id: 1, title: "Doc 1", embedding: JSON.stringify([0.1, 0.2, 0.3]) },
        { id: 2, title: "Doc 2", embedding: JSON.stringify([0.9, 0.8, 0.7]) },
        { id: 3, title: "Doc 3", embedding: JSON.stringify([0.15, 0.25, 0.35]) },
      ];

      const results = semanticSearch(queryEmbedding, documents, 2);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(1); // Most similar
      expect(results[1].id).toBe(3); // Second most similar
      expect(results[0].similarityScore).toBeGreaterThan(results[1].similarityScore);
    });

    it("should filter out documents without embeddings", () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const documents = [
        { id: 1, title: "Doc 1", embedding: JSON.stringify([0.1, 0.2, 0.3]) },
        { id: 2, title: "Doc 2" }, // No embedding
        { id: 3, title: "Doc 3", embedding: JSON.stringify([0.15, 0.25, 0.35]) },
      ];

      const results = semanticSearch(queryEmbedding, documents, 5);

      expect(results).toHaveLength(2); // Only 2 documents have embeddings
      expect(results.every((r) => r.embedding)).toBe(true);
    });

    it("should include similarityScore in results", () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const documents = [
        { id: 1, title: "Doc 1", embedding: JSON.stringify([0.1, 0.2, 0.3]) },
      ];

      const results = semanticSearch(queryEmbedding, documents, 1);

      expect(results[0]).toHaveProperty("similarityScore");
      expect(typeof results[0].similarityScore).toBe("number");
    });
  });

  describe("hybridSearch", () => {
    it("should combine semantic and keyword scores", () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const documents = [
        {
          id: 1,
          title: "Doc 1",
          embedding: JSON.stringify([0.1, 0.2, 0.3]),
          keywordScore: 0.8,
        },
        {
          id: 2,
          title: "Doc 2",
          embedding: JSON.stringify([0.9, 0.8, 0.7]),
          keywordScore: 0.9,
        },
      ];

      const results = hybridSearch(queryEmbedding, documents, 0.7, 2);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty("similarityScore");
      expect(results[0]).toHaveProperty("keywordScore");
      expect(results[0]).toHaveProperty("combinedScore");
    });

    it("should respect semantic weight parameter", () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const documents = [
        {
          id: 1,
          title: "Doc 1",
          embedding: JSON.stringify([0.1, 0.2, 0.3]), // Perfect semantic match
          keywordScore: 0.1, // Low keyword score
        },
        {
          id: 2,
          title: "Doc 2",
          embedding: JSON.stringify([0.9, 0.8, 0.7]), // Poor semantic match
          keywordScore: 0.9, // High keyword score
        },
      ];

      // High semantic weight (0.9) - Doc 1 should win
      const results1 = hybridSearch(queryEmbedding, documents, 0.9, 2);
      expect(results1[0].id).toBe(1);

      // Low semantic weight (0.1) - Doc 2 should win
      const results2 = hybridSearch(queryEmbedding, documents, 0.1, 2);
      expect(results2[0].id).toBe(2);
    });

    it("should handle missing keywordScore gracefully", () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const documents = [
        {
          id: 1,
          title: "Doc 1",
          embedding: JSON.stringify([0.1, 0.2, 0.3]),
          // No keywordScore
        },
      ];

      const results = hybridSearch(queryEmbedding, documents, 0.7, 1);

      expect(results).toHaveLength(1);
      expect(results[0].keywordScore).toBe(0); // Should default to 0
    });
  });

  describe("Integration Tests", () => {
    let embedding1: number[];
    let embedding2: number[];

    beforeAll(async () => {
      // Generate embeddings for similar Arabic texts
      embedding1 = await generateEmbeddings("الوقف في الشريعة الإسلامية");
      embedding2 = await generateEmbeddings("أحكام الوقف في الفقه الإسلامي");
    }, 60000);

    it("should find semantic similarity between similar Arabic texts", () => {
      const similarity = cosineSimilarity(embedding1, embedding2);

      // Similar texts should have high similarity (> 0.7)
      expect(similarity).toBeGreaterThan(0.7);
    });

    it("should rank semantically similar documents higher", async () => {
      const queryEmbedding = await generateEmbeddings("ما هي شروط الوقف؟");
      const documents = [
        {
          id: 1,
          title: "شروط صحة الوقف",
          embedding: JSON.stringify(embedding1),
        },
        {
          id: 2,
          title: "قانون الأراضي",
          embedding: JSON.stringify([0.9, 0.8, 0.7, 0.6, 0.5]),
        },
      ];

      const results = semanticSearch(queryEmbedding, documents, 2);

      // Document about "شروط الوقف" should rank higher
      expect(results[0].id).toBe(1);
    }, 30000);
  });
});
