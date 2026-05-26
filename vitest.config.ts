import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    env: {
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/iced26',
    },
  },
});
