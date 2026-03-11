import { hashAccountKey, safeHexEqual } from '../security/accountKeyCrypto.js';
import { getSql } from './supabaseDatabase.js';

type SeedAccount = {
  accountId: string;
  displayName: string;
  accountKeyHash: string;
};

type StoredAccountRow = {
  account_id: string;
  display_name: string;
  account_key_hash: string;
  is_disabled: boolean;
};

export async function initializeAccountsDatabase(): Promise<void> {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      account_key_hash TEXT NOT NULL,
      is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
}

export async function seedAccountsDatabase(seedAccounts: SeedAccount[]): Promise<void> {
  const sql = getSql();

  const countRows = (await sql`SELECT COUNT(*)::int AS count FROM accounts`) as Array<{ count: number }>;
  if ((countRows[0]?.count ?? 0) > 0) {
    return;
  }

  const timestamp = Date.now();

  for (const account of seedAccounts) {
    await sql`
      INSERT INTO accounts (
        account_id,
        display_name,
        account_key_hash,
        is_disabled,
        created_at,
        updated_at
      )
      VALUES (
        ${account.accountId},
        ${account.displayName},
        ${account.accountKeyHash},
        FALSE,
        ${timestamp},
        ${timestamp}
      )
    `;
  }
}

export async function findStoredAccountById(accountId: string): Promise<StoredAccountRow | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT account_id, display_name, account_key_hash, is_disabled
    FROM accounts
    WHERE account_id = ${accountId}
    LIMIT 1
  `) as StoredAccountRow[];

  return rows[0] ?? null;
}

export async function findStoredAccountByLoginKey(accountKey: string): Promise<StoredAccountRow | null> {
  const sql = getSql();
  const inputHash = hashAccountKey(accountKey);
  const rows = (await sql`
    SELECT account_id, display_name, account_key_hash, is_disabled
    FROM accounts
    WHERE is_disabled = FALSE
  `) as StoredAccountRow[];

  const matchingRow = rows.find((row) => safeHexEqual(row.account_key_hash, inputHash));
  return matchingRow ?? null;
}

export async function updateStoredAccountDisplayName(accountId: string, displayName: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    UPDATE accounts
    SET display_name = ${displayName},
        updated_at = ${Date.now()}
    WHERE account_id = ${accountId}
    RETURNING account_id
  `) as Array<{ account_id: string }>;

  return rows.length > 0;
}

export async function upsertStoredAccount(input: {
  accountId: string;
  displayName: string;
  accountKeyHash: string;
  isDisabled?: boolean;
}): Promise<void> {
  const sql = getSql();
  const timestamp = Date.now();

  await sql`
    INSERT INTO accounts (
      account_id,
      display_name,
      account_key_hash,
      is_disabled,
      created_at,
      updated_at
    )
    VALUES (
      ${input.accountId},
      ${input.displayName},
      ${input.accountKeyHash},
      ${input.isDisabled ?? false},
      ${timestamp},
      ${timestamp}
    )
    ON CONFLICT (account_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      account_key_hash = EXCLUDED.account_key_hash,
      is_disabled = EXCLUDED.is_disabled,
      updated_at = EXCLUDED.updated_at
  `;
}
