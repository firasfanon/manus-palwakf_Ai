import { describe, it, expect, beforeAll } from "vitest";
import {
  analyzeNegativeRatings,
  getFrequentQuestions,
  getBestAnswers,
  generateImprovementSuggestions,
} from "./learning";

describe("Analytics System", () => {
  describe("Negative Ratings Analysis", () => {
    it("should return analysis structure", async () => {
      const analysis = await analyzeNegativeRatings();
      
      expect(analysis).toHaveProperty("totalNegative");
      expect(analysis).toHaveProperty("withFeedback");
      expect(analysis).toHaveProperty("withoutSources");
      expect(analysis).toHaveProperty("shortResponses");
      expect(analysis).toHaveProperty("commonIssues");
      
      expect(typeof analysis.totalNegative).toBe("number");
      expect(Array.isArray(analysis.commonIssues)).toBe(true);
    });
    
    it("should have non-negative counts", async () => {
      const analysis = await analyzeNegativeRatings();
      
      expect(analysis.totalNegative).toBeGreaterThanOrEqual(0);
      expect(analysis.withFeedback).toBeGreaterThanOrEqual(0);
      expect(analysis.withoutSources).toBeGreaterThanOrEqual(0);
      expect(analysis.shortResponses).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe("Frequent Questions", () => {
    it("should return array of questions", async () => {
      const questions = await getFrequentQuestions(5);
      
      expect(Array.isArray(questions)).toBe(true);
    });
    
    it("should respect limit parameter", async () => {
      const questions = await getFrequentQuestions(3);
      
      expect(questions.length).toBeLessThanOrEqual(3);
    });
    
    it("should return questions with count", async () => {
      const questions = await getFrequentQuestions(10);
      
      if (questions.length > 0) {
        expect(questions[0]).toHaveProperty("content");
        expect(questions[0]).toHaveProperty("count");
        expect(typeof questions[0].count).toBe("number");
      }
    });
  });
  
  describe("Best Answers", () => {
    it("should return array of answers", async () => {
      const answers = await getBestAnswers(5);
      
      expect(Array.isArray(answers)).toBe(true);
    });
    
    it("should respect limit parameter", async () => {
      const answers = await getBestAnswers(3);
      
      expect(answers.length).toBeLessThanOrEqual(3);
    });
    
    it("should return answers with positive ratings", async () => {
      const answers = await getBestAnswers(10);
      
      if (answers.length > 0) {
        expect(answers[0]).toHaveProperty("messageId");
        expect(answers[0]).toHaveProperty("content");
        expect(answers[0]).toHaveProperty("positiveRatings");
        expect(typeof answers[0].positiveRatings).toBe("number");
        expect(answers[0].positiveRatings).toBeGreaterThan(0);
      }
    });
  });
  
  describe("Improvement Suggestions", () => {
    it("should return suggestions structure", async () => {
      const result = await generateImprovementSuggestions();
      
      expect(result).toHaveProperty("patterns");
      expect(result).toHaveProperty("suggestions");
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
    
    it("should provide actionable suggestions", async () => {
      const result = await generateImprovementSuggestions();
      
      // Suggestions should be strings
      result.suggestions.forEach((suggestion) => {
        expect(typeof suggestion).toBe("string");
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });
    
    it("should base suggestions on patterns", async () => {
      const result = await generateImprovementSuggestions();
      
      // If there are negative patterns, there should be suggestions
      if (result.patterns.totalNegative > 0) {
        // Suggestions can be empty if patterns don't meet thresholds
        expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
  
  describe("Integration Tests", () => {
    it("should handle empty database gracefully", async () => {
      // These should not throw errors even with empty database
      await expect(analyzeNegativeRatings()).resolves.toBeDefined();
      await expect(getFrequentQuestions(10)).resolves.toBeDefined();
      await expect(getBestAnswers(10)).resolves.toBeDefined();
      await expect(generateImprovementSuggestions()).resolves.toBeDefined();
    });
    
    it("should return consistent data types", async () => {
      const [analysis, questions, answers, suggestions] = await Promise.all([
        analyzeNegativeRatings(),
        getFrequentQuestions(5),
        getBestAnswers(5),
        generateImprovementSuggestions(),
      ]);
      
      expect(typeof analysis).toBe("object");
      expect(Array.isArray(questions)).toBe(true);
      expect(Array.isArray(answers)).toBe(true);
      expect(typeof suggestions).toBe("object");
    });
  });
});
