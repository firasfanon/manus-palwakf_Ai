import { describe, it, expect } from "vitest";
import { getFrequentQuestions } from "./learning";

describe("FAQ Auto-Generation System", () => {
  describe("getFrequentQuestions", () => {
    it("should return array of frequent questions", async () => {
      const questions = await getFrequentQuestions(5);
      
      expect(Array.isArray(questions)).toBe(true);
    });
    
    it("should respect limit parameter", async () => {
      const limit = 3;
      const questions = await getFrequentQuestions(limit);
      
      expect(questions.length).toBeLessThanOrEqual(limit);
    });
    
    it("should return questions with required fields", async () => {
      const questions = await getFrequentQuestions(10);
      
      if (questions.length > 0) {
        const question = questions[0];
        expect(question).toHaveProperty("content");
        expect(question).toHaveProperty("count");
        expect(typeof question.content).toBe("string");
        expect(typeof question.count).toBe("number");
        expect(question.count).toBeGreaterThan(0);
      }
    });
    
    it("should return questions sorted by count (descending)", async () => {
      const questions = await getFrequentQuestions(10);
      
      if (questions.length > 1) {
        for (let i = 0; i < questions.length - 1; i++) {
          expect(questions[i].count).toBeGreaterThanOrEqual(questions[i + 1].count);
        }
      }
    });
    
    it("should handle different limit values", async () => {
      const limits = [1, 5, 10, 20];
      
      for (const limit of limits) {
        const questions = await getFrequentQuestions(limit);
        expect(questions.length).toBeLessThanOrEqual(limit);
      }
    });
  });
  
  describe("FAQ Generation Integration", () => {
    it("should handle empty database gracefully", async () => {
      await expect(getFrequentQuestions(10)).resolves.toBeDefined();
    });
    
    it("should return consistent data types", async () => {
      const questions = await getFrequentQuestions(5);
      
      expect(Array.isArray(questions)).toBe(true);
      questions.forEach((q) => {
        expect(typeof q.content).toBe("string");
        expect(typeof q.count).toBe("number");
      });
    });
    
    it("should not return duplicate questions", async () => {
      const questions = await getFrequentQuestions(20);
      
      const uniqueContents = new Set(questions.map(q => q.content));
      expect(uniqueContents.size).toBe(questions.length);
    });
  });
});
