import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  // Parse connection string to handle SSL and other params
  // The TiDB string looks like: mysql://user:pass@host:port/db?ssl={"rejectUnauthorized":true}
  const url = new URL(connectionString);
  const config = {
    host: url.hostname,
    port: parseInt(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl').replace(/\\"/g, '"')) : undefined,
    multipleStatements: true,
  };

  console.log(`Connecting to ${config.host}...`);
  const connection = await mysql.createConnection(config);

  const migrationDir = path.join(__dirname, '..', 'drizzle');
  const files = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    console.log(`Executing ${file}...`);
    const content = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    const statements = content.split('--> statement-breakpoint');
    
    for (let sql of statements) {
      sql = sql.trim();
      if (!sql) continue;
      
      try {
        await connection.query(sql);
        // console.log(`  Applied chunk`);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.message.includes('already exists') || err.message.includes('Duplicate column name')) {
          // console.warn(`  Skipped (already exists)`);
        } else {
          console.error(`  Error in ${file} at chunk: ${sql.slice(0, 50)}...`);
          console.error(`  Message:`, err.message);
        }
      }
    }
    console.log(`Finished ${file}`);
  }

  console.log('Migrations complete.');
  
  const [rows] = await connection.query('SHOW TABLES');
  console.log('Current tables in database:');
  console.log(rows.map(r => Object.values(r)[0]).join(', '));

  await connection.end();
}

runMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
