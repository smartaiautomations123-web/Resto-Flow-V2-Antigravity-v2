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
    console.log(`--- Executing ${file} ---`);
    const content = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    
    // Improved splitting: match the breakpoint even if it's surrounded by comments or weird whitespace
    const statements = content.split(/--> statement-breakpoint/);
    
    for (let sql of statements) {
      sql = sql.trim();
      if (!sql) continue;
      
      // Remove any lingering comments at the start of the block that might confuse TiDB
      sql = sql.replace(/^\/\*.*?\*\//gs, '').trim();

      try {
        await connection.query(sql);
        console.log(`  [OK] ${sql.slice(0, 80)}...`);
      } catch (err) {
        // Skip common "already exists" errors
        if (
          err.code === 'ER_TABLE_EXISTS_ERROR' || 
          err.code === 'ER_DUP_FIELDNAME' ||
          err.message.includes('already exists') || 
          err.message.includes('Duplicate column name') ||
          err.message.includes('Duplicate key name') ||
          err.message.includes('Duplicate foreign key constraint')
        ) {
          // console.log(`  [SKIP] Already applied.`);
        } else {
          console.error(`  [ERROR] in ${file}:`);
          console.error(`  SQL: ${sql}`);
          console.error(`  Message: ${err.message}`);
        }
      }
    }
  }

  console.log('\nMigrations complete. Verifying critical columns...');
  
  const checkColumn = async (table, column, definition) => {
    try {
      const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
      if (cols.length > 0) {
        console.log(`✅ ${table}.${column} exists.`);
      } else {
        console.log(`❌ ${table}.${column} is MISSING. Attempting manual fix...`);
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`✅ ${table}.${column} created.`);
      }
    } catch (e) {
      console.error(`Error verifying ${table}.${column}:`, e.message);
    }
  };

  await checkColumn('ingredients', 'locationId', 'int DEFAULT 1 NOT NULL');
  await checkColumn('ingredients', 'itemId', 'varchar(128)');
  await checkColumn('ingredients', 'baseUom', 'varchar(32)');
  await checkColumn('ingredients', 'parLevel', 'decimal(10,3) DEFAULT 0');
  await checkColumn('ingredients', 'safetyStock', 'decimal(10,3) DEFAULT 0');
  
  await checkColumn('orders', 'locationId', 'int DEFAULT 1');

  await connection.end();
}

runMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
