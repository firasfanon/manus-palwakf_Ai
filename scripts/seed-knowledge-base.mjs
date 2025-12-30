/**
 * Script to seed the knowledge base with initial references
 * Run with: node scripts/seed-knowledge-base.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('✅ Connected to database');

// Read knowledge base JSON
const knowledgeBasePath = join(__dirname, '../research_data/knowledge_base.json');
const knowledgeData = JSON.parse(readFileSync(knowledgeBasePath, 'utf-8'));

console.log(`📚 Found ${knowledgeData.knowledge_documents.length} documents to insert`);

// Insert documents
let insertedCount = 0;
let skippedCount = 0;

for (const doc of knowledgeData.knowledge_documents) {
  try {
    // Check if document already exists
    const [existing] = await connection.execute(
      'SELECT id FROM knowledge_documents WHERE title = ?',
      [doc.title]
    );

    // Map category names to match schema
    const categoryMap = {
      'قانوني': 'law',
      'فقهي': 'jurisprudence',
      'إداري': 'administrative',
      'تاريخي': 'historical',
      'مجلة': 'majalla'
    };
    const mappedCategory = categoryMap[doc.category] || 'reference';

    if (existing.length > 0) {
      console.log(`⏭️  Skipped: "${doc.title}" (already exists)`);
      skippedCount++;
      continue;
    }

    // Insert document
    const [result] = await connection.execute(
      `INSERT INTO knowledge_documents 
      (title, content, source, category, tags, isActive, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        doc.title,
        doc.content,
        doc.source,
        mappedCategory,
        doc.tags
      ]
    );

    console.log(`✅ Inserted: "${doc.title}" (ID: ${result.insertId})`);
    insertedCount++;
  } catch (error) {
    console.error(`❌ Error inserting "${doc.title}":`, error.message);
  }
}

console.log('\n📊 Summary:');
console.log(`   - Inserted: ${insertedCount} documents`);
console.log(`   - Skipped: ${skippedCount} documents`);
console.log(`   - Total: ${knowledgeData.knowledge_documents.length} documents`);

await connection.end();
console.log('\n✅ Done!');
