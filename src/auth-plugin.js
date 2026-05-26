import { verifyToken } from './auth.js';

export default async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized' });
    throw new Error('Unauthorized');
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    request.user = decoded;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
    throw new Error('Unauthorized');
  }
}
