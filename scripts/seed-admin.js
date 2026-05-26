import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import prompts from 'prompts';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5434/iced26';
const sql = postgres(DATABASE_URL);

async function seedAdmin() {
  let username = process.env.ADMIN_USERNAME;
  let password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    const response = await prompts([
      {
        type: 'text',
        name: 'username',
        message: 'Admin username:',
        validate: (value) => value.length > 0 ? true : 'Username is required',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Admin password:',
        validate: (value) => value.length >= 6 ? true : 'Password must be at least 6 characters',
      },
    ]);

    username = response.username;
    password = response.password;
  }

  if (!username || !password) {
    console.error('Username and password are required');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username)
    DO UPDATE SET password_hash = ${passwordHash}
    RETURNING id, username
  `;

  console.log(`Admin user '${result[0].username}' seeded successfully (id: ${result[0].id})`);

  await sql.end();
}

seedAdmin().catch((err) => {
  console.error('Error seeding admin:', err.message);
  process.exit(1);
});
