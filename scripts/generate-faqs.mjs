/**
 * Script to generate FAQs from conversations
 * 
 * This script:
 * 1. Analyzes user questions from conversations
 * 2. Groups similar questions
 * 3. Generates FAQ entries with answers
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("🚀 Starting FAQ generation...\n");

  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });

  try {
    // Fetch all conversations
    const conversations = await db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.isActive, true));

    // Fetch all messages
    const allMessages = await db
      .select()
      .from(schema.messages);

    // Group messages by conversation
    const conversationsWithMessages = conversations.map(conv => ({
      ...conv,
      messages: allMessages.filter(msg => msg.conversationId === conv.id)
    }));

    console.log(`📚 Found ${conversations.length} conversations\n`);

    if (conversations.length === 0) {
      console.log("⚠️  No conversations found. Run seed-conversations.mjs first.");
      return;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process each conversation
    for (const conv of conversationsWithMessages) {
      // Find user question and assistant answer
      const userMessage = conv.messages.find(m => m.role === "user");
      const assistantMessage = conv.messages.find(m => m.role === "assistant");

      if (!userMessage || !assistantMessage) {
        console.log(`⏭️  Skipping conversation "${conv.title}" (incomplete)`);
        skipped++;
        continue;
      }

      const question = userMessage.content;
      const answer = assistantMessage.content;

      // Check if FAQ already exists
      const existingFaq = await db.query.faqs.findFirst({
        where: (faqs, { eq }) => eq(faqs.question, question)
      });

      if (existingFaq) {
        console.log(`⏭️  FAQ already exists: "${question.substring(0, 50)}..."`);
        skipped++;
        continue;
      }

      // Map conversation category to FAQ category
      const categoryMap = {
        "legal": "legal",
        "jurisprudence": "jurisprudence",
        "administrative": "management",
        "historical": "general",
        "general": "general"
      };

      const faqCategory = categoryMap[conv.category] || "general";

      // Create FAQ entry
      await db.insert(schema.faqs).values({
        question,
        answer,
        category: faqCategory,
        order: created + 1,
        isActive: true,
        viewCount: 0
      });

      console.log(`✅ Created FAQ: "${question.substring(0, 50)}..."`);
      created++;
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary:");
    console.log("=".repeat(60));
    console.log(`Total conversations: ${conversations.length}`);
    console.log(`FAQs created: ${created}`);
    console.log(`FAQs updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log("=".repeat(60));

    if (created > 0) {
      console.log("\n✅ FAQs generated successfully!");
      console.log("\n💡 Visit /faqs to see the generated FAQs");
    } else {
      console.log("\n⚠️  No new FAQs created");
    }

  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
