import postgres from 'postgres';

let sqlClient: ReturnType<typeof postgres> | null = null;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Set it in backend/.env or in your hosting environment.');
  }

  return databaseUrl;
}

export function getSql(): ReturnType<typeof postgres> {
  if (!sqlClient) {
    sqlClient = postgres(getDatabaseUrl(), {
      ssl: 'require'
    });
  }

  return sqlClient;
}
