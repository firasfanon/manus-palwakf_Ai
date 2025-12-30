/**
 * Script to generate embeddings for existing knowledge documents
 * 
 * This script:
 * 1. Fetches all knowledge documents from the database
 * 2. Generates embeddings for each document's title + content
 * 3. Updates the database with the generated embeddings
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const BATCH_SIZE = 10; // Process 10 documents at a time
const DELAY_MS = 1000; // 1 second delay between batches to avoid rate limits

/**
 * Generate embeddings for a given text
 */
async function generateEmbeddings(text) {
  try {
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
 * Sleep for a given number of milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("🚀 Starting embeddings generation...\n");

  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });

  try {
    // Fetch all knowledge documents without embeddings
    const documents = await db
      .select()
      .from(schema.knowledgeDocuments)
      .where(eq(schema.knowledgeDocuments.isActive, true));

    console.log(`📚 Found ${documents.length} documents\n`);

    if (documents.length === 0) {
      console.log("✅ No documents to process");
      return;
    }

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process documents in batches
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)}`);

      for (const doc of batch) {
        try {
          processed++;

          // Skip if already has embeddings
          if (doc.embedding) {
            console.log(`⏭️  [${processed}/${documents.length}] Skipping "${doc.title.substring(0, 50)}..." (already has embeddings)`);
            skipped++;
            continue;
          }

          // Combine title and content for embedding
          const text = `${doc.title}\n\n${doc.content}`;
          
          // Truncate if too long (max ~8000 tokens for embedding model)
          const truncatedText = text.length > 30000 ? text.substring(0, 30000) : text;

          console.log(`🔄 [${processed}/${documents.length}] Generating embedding for "${doc.title.substring(0, 50)}..."`);

          // Generate embeddings
          const embedding = await generateEmbeddings(truncatedText);

          // Update database
          await db
            .update(schema.knowledgeDocuments)
            .set({ embedding: JSON.stringify(embedding) })
            .where(eq(schema.knowledgeDocuments.id, doc.id));

          console.log(`✅ [${processed}/${documents.length}] Updated "${doc.title.substring(0, 50)}..."`);
          updated++;

        } catch (error) {
          console.error(`❌ [${processed}/${documents.length}] Error processing "${doc.title.substring(0, 50)}...":`, error.message);
          errors++;
        }
      }

      // Delay between batches to avoid rate limits
      if (i + BATCH_SIZE < documents.length) {
        console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`);
        await sleep(DELAY_MS);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary:");
    console.log("=".repeat(60));
    console.log(`Total documents: ${documents.length}`);
    console.log(`Processed: ${processed}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log("=".repeat(60));

    if (errors === 0) {
      console.log("\n✅ All embeddings generated successfully!");
    } else {
      console.log(`\n⚠️  Completed with ${errors} errors`);
    }

  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
