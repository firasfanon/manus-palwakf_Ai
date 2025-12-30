import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get messages for conversation 15
const result = await connection.query(
  'SELECT id, conversation_id, role, LEFT(content, 100) as content_preview, created_at FROM messages WHERE conversation_id IN (SELECT id FROM conversations ORDER BY updated_at DESC LIMIT 5) ORDER BY conversation_id, created_at'
);

console.log('Recent conversation messages:');
console.log(JSON.stringify(result[0], null, 2));

await connection.end();
