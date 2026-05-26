import postgres from 'postgres';
import { hashPassword } from '../src/auth/password.ts';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function seedAdmin(): Promise<void> {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin';

  const passwordHash = await hashPassword(password);

  await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username) DO UPDATE SET password_hash = ${passwordHash}
  `;

  console.log(`Admin user '${username}' seeded successfully.`);
  await sql.end();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
