/**
 * Semantic Search System using OpenAI Embeddings
 * 
 * This module provides functions to generate embeddings for text content
 * and perform semantic similarity search using cosine similarity.
 */

import { invokeLLM } from "./_core/llm";

/**
 * Generate embeddings for a given text using OpenAI's text-embedding-3-small model
 * 
 * @param text - The text content to generate embeddings for
 * @returns Array of numbers representing the embedding vector (1536 dimensions)
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    // Use OpenAI's embedding model
    // Note: We're using the invokeLLM infrastructure, but for embeddings
    // we need to make a direct API call to the embeddings endpoint
    
    // For now, we'll use a placeholder implementation
    // In production, this should call OpenAI's embeddings API
    const response = await fetch(process.env.BUILT_IN_FORGE_API_URL + "/llm/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small",
      }),
    });

    if (!response.ok) {
      throw new Error(`Embeddings API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * 
 * @param embedding1 - First embedding vector
 * @param embedding2 - Second embedding vector
 * @returns Similarity score between 0 and 1 (1 = identical, 0 = completely different)
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Perform semantic search on a list of documents
 * 
 * @param queryEmbedding - Embedding vector of the search query
 * @param documents - Array of documents with their embeddings
 * @param topK - Number of top results to return (default: 5)
 * @returns Array of documents sorted by semantic similarity
 */
export function semanticSearch<T extends { embedding?: string }>(
  queryEmbedding: number[],
  documents: T[],
  topK: number = 5
): Array<T & { similarityScore: number }> {
  const results = documents
    .filter((doc) => doc.embedding) // Only include documents with embeddings
    .map((doc) => {
      const docEmbedding = JSON.parse(doc.embedding!);
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
      return {
        ...doc,
        similarityScore: similarity,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore) // Sort by similarity (descending)
    .slice(0, topK); // Take top K results

  return results;
}

/**
 * Hybrid search combining semantic and keyword-based search
 * 
 * @param queryEmbedding - Embedding vector of the search query
 * @param documents - Array of documents with embeddings and keyword scores
 * @param semanticWeight - Weight for semantic similarity (0-1, default: 0.7)
 * @param topK - Number of top results to return (default: 5)
 * @returns Array of documents sorted by combined score
 */
export function hybridSearch<T extends { embedding?: string | null; keywordScore?: number }>(
  queryEmbedding: number[],
  documents: T[],
  semanticWeight: number = 0.7,
  topK: number = 5
): Array<T & { similarityScore: number; keywordScore: number; combinedScore: number }> {
  const keywordWeight = 1 - semanticWeight;

  const results = documents
    .filter((doc) => doc.embedding) // Only include documents with embeddings
    .map((doc) => {
      const docEmbedding = JSON.parse(doc.embedding!);
      const similarityScore = cosineSimilarity(queryEmbedding, docEmbedding);
      const keywordScore = doc.keywordScore || 0;
      const combinedScore = similarityScore * semanticWeight + keywordScore * keywordWeight;

      return {
        ...doc,
        similarityScore,
        keywordScore,
        combinedScore,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore) // Sort by combined score (descending)
    .slice(0, topK); // Take top K results

  return results;
}
