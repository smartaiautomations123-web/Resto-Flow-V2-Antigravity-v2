import "dotenv/config";
import { getDb } from "../server/db.js";
import { sql } from "drizzle-orm";

async function clearDatabase() {
  console.log("🧹 Commencing full database wipe to reset Resto-Flow...");
  const database = await getDb();
  if (!database) {
    console.error("❌ Could not connect to database");
    process.exit(1);
  }

  try {
    // Disable foreign key checks to allow truncating tables with relationships
    await database.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    
    // List of tables to truncate (order doesn't matter since FK checks are off)
    const tables = [
      'order_items', 'orders', 'recipes', 'menu_items', 'menu_categories',
      'ingredients', 'suppliers', 'staff', 'tables', 'sections', 'locations',
      'customers', 'segment_members', 'customer_segments', 'void_audit_log',
      'price_uploads', 'price_upload_items', 'purchase_orders', 'purchase_order_items'
    ];
    
    for (const table of tables) {
      console.log(`Clearing table: ${table}...`);
      try {
        await database.execute(sql.raw(`TRUNCATE TABLE \`${table}\`;`));
      } catch (err: any) {
        if (err.code !== 'ER_NO_SUCH_TABLE') {
          console.warn(`Warning clearing ${table}:`, err.message);
        }
      }
    }
    
    // Re-enable foreign key checks
    await database.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
    
    console.log("✅ Database wiped successfully! Resto-Flow is now in a fresh state.");
  } catch (err) {
    console.error("❌ Error during database wipe:", err);
  } finally {
    process.exit(0);
  }
}

clearDatabase();
