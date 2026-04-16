/**
 * scripts/migrate-admin-columns.ts
 * מוסיף עמודות ניהול לטבלת orders אם עוד לא קיימות.
 * הרץ פעם אחת: npx tsx scripts/migrate-admin-columns.ts
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load env
config({ path: '.env' });
config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  console.log('🚀 Running admin columns migration...');

  try {
    await sql`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'new',
        ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS material_cost_override NUMERIC;
    `;
    console.log('✅ Migration complete! Columns added (or already existed):');
    console.log('   - payment_status (TEXT, default: pending)');
    console.log('   - order_status   (TEXT, default: new)');
    console.log('   - discount       (NUMERIC, default: 0)');
    console.log('   - material_cost_override (NUMERIC, nullable)');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
