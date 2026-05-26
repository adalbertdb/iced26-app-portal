import postgres from 'postgres';
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

  // Placeholder - bcrypt will be added in auth module (issue #2)
  const passwordHash = password;

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
