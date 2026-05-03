import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const sqlFile = path.resolve('drizzle/0007_rainy_vulture.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

async function run() {
  console.log('Connecting to TiDB...');
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  
  try {
    const statements = sqlContent.split('--> statement-breakpoint');
    console.log(`Executing ${statements.length} statements...`);
    
    for (let statement of statements) {
      const sql = statement.trim();
      if (!sql) continue;
      
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      try {
        await connection.execute(sql);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEY' || err.code === 'ER_DUP_ENTRY') {
          console.log('  [Notice] Field/Table already exists, skipping.');
        } else {
          console.error('  [Error]', err.message);
        }
      }
    }
    
    console.log('Manual sync complete! Database is now updated.');
  } finally {
    await connection.end();
  }
}

run().catch(console.error);
