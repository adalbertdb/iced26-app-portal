import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type postgres from 'postgres';
import { signToken, verifyToken } from '../auth/jwt.ts';
import { comparePassword } from '../auth/password.ts';

export async function registerAdminRoutes(app: FastifyInstance, sql: postgres.Sql<{}>) {
  app.post('/admin/login', async (req, reply) => {
    const { username, password } = req.body as { username: string; password: string };

    const users = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (users.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = signToken(String(user.id));
    return { token };
  });

  // Auth preHandler
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const token = authHeader.slice(7);
    try {
      const payload = verifyToken(token);
      (req as any).user = payload;
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Test protected route
  app.get('/admin/protected-test', {
    preHandler: [app.authenticate as any],
    handler: async () => {
      return { message: 'OK' };
    },
  });
}
