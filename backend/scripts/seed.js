/**
 * Seed script — inserts dummy users + employees for all 5 roles into Neon DB.
 * Run: node scripts/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const password = 'Admin@123'; // same password for all seed accounts

const users = [
  { username: 'owner',   email: 'owner@ems.com',   full_name: 'Super Admin',   role: 'owner',    emp_id: 'EMP0001' },
  { username: 'admin',   email: 'admin@ems.com',   full_name: 'Admin User',    role: 'admin',    emp_id: 'EMP0002' },
  { username: 'hruser',  email: 'hr@ems.com',      full_name: 'HR Manager',    role: 'hr',       emp_id: 'EMP0003' },
  { username: 'manager', email: 'manager@ems.com', full_name: 'Team Manager',  role: 'manager',  emp_id: 'EMP0004' },
  { username: 'emp',     email: 'emp@ems.com',     full_name: 'John Employee', role: 'employee', emp_id: 'EMP0005' },
];

async function seed() {
  const hash = await bcrypt.hash(password, 12);
  console.log('🔑 Password for all accounts:', password);
  console.log('');

  for (const u of users) {
    try {
      // Get role_id
      const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [u.role]);
      if (roleRes.rows.length === 0) { console.error(`Role "${u.role}" not found — did you run schema.sql?`); continue; }
      const roleId = roleRes.rows[0].id;

      // Insert user (skip if exists)
      const userRes = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, role_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password_hash = $3
         RETURNING id`,
        [u.username, u.email, hash, u.full_name, roleId]
      );
      const userId = userRes.rows[0].id;

      // Insert employee profile (skip if exists)
      await pool.query(
        `INSERT INTO employees (employee_id, user_id, full_name, email, employment_type, work_mode, status)
         VALUES ($1, $2, $3, $4, 'full-time', 'office', 'active')
         ON CONFLICT (email) DO NOTHING`,
        [u.emp_id, userId, u.full_name, u.email]
      );

      console.log(`✅ ${u.role.padEnd(10)} | ${u.email.padEnd(22)} | password: ${password}`);
    } catch (err) {
      console.error(`❌ Failed for ${u.email}:`, err.message);
    }
  }

  await pool.end();
  console.log('\n✅ Seeding complete!');
}

seed().catch(err => { console.error(err); process.exit(1); });
