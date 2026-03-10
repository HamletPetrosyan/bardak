import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

type SeedAccount = {
  accountId: string;
  displayName: string;
  accountKeyHash: string;
};

type StoredAccountRow = {
  account_id: string;
  display_name: string;
  account_key_hash: string;
  is_disabled: number;
};

const storageDirectoryPath = path.join(process.cwd(), 'storage');
const accountsDatabasePath = path.join(storageDirectoryPath, 'accounts.sqlite');
const legacyProfilesDatabasePath = path.join(storageDirectoryPath, 'profiles.sqlite');
const legacyDisplayNamesFilePath = path.join(storageDirectoryPath, 'account-display-names.json');

type SqliteDatabase = InstanceType<typeof Database>;
let database: SqliteDatabase | null = null;

function ensureStorageDirectory(): void {
  if (!existsSync(storageDirectoryPath)) {
    mkdirSync(storageDirectoryPath, { recursive: true });
  }
}

function getDatabase(): SqliteDatabase {
  if (!database) {
    initializeAccountsDatabase();
  }

  return database!;
}

function loadLegacyDisplayNamesFromJson(): Record<string, string> {
  if (!existsSync(legacyDisplayNamesFilePath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(legacyDisplayNamesFilePath, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    );
  } catch {
    return {};
  }
}

function loadLegacyDisplayNamesFromProfilesDb(): Record<string, string> {
  if (!existsSync(legacyProfilesDatabasePath)) {
    return {};
  }

  try {
    const legacyDatabase = new Database(legacyProfilesDatabasePath, { readonly: true });
    const rows = legacyDatabase
      .prepare('SELECT account_id, display_name FROM account_profiles')
      .all() as Array<{ account_id: string; display_name: string }>;
    legacyDatabase.close();

    return Object.fromEntries(rows.map((row) => [row.account_id, row.display_name]));
  } catch {
    return {};
  }
}

function toStoredAccount(row: StoredAccountRow) {
  return {
    accountId: row.account_id,
    displayName: row.display_name,
    accountKeyHash: row.account_key_hash,
    isDisabled: row.is_disabled === 1
  };
}

export function initializeAccountsDatabase(): void {
  if (database) {
    return;
  }

  ensureStorageDirectory();
  database = new Database(accountsDatabasePath);
  database.pragma('journal_mode = WAL');

  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      account_key_hash TEXT NOT NULL,
      is_disabled INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

export function seedAccountsDatabase(seedAccounts: SeedAccount[]): void {
  const currentDatabase = getDatabase();
  const legacyNames = {
    ...loadLegacyDisplayNamesFromProfilesDb(),
    ...loadLegacyDisplayNamesFromJson()
  };

  const existingCountRow = currentDatabase
    .prepare('SELECT COUNT(*) as count FROM accounts')
    .get() as { count: number };

  if (existingCountRow.count > 0) {
    return;
  }

  const insertStatement = currentDatabase.prepare(`
    INSERT INTO accounts (
      account_id,
      display_name,
      account_key_hash,
      is_disabled,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, 0, ?, ?)
  `);

  const timestamp = Date.now();
  for (const account of seedAccounts) {
    insertStatement.run(
      account.accountId,
      legacyNames[account.accountId] ?? account.displayName,
      account.accountKeyHash,
      timestamp,
      timestamp
    );
  }
}

export function findStoredAccountById(accountId: string) {
  const currentDatabase = getDatabase();
  const row = currentDatabase
    .prepare(`
      SELECT account_id, display_name, account_key_hash, is_disabled
      FROM accounts
      WHERE account_id = ?
    `)
    .get(accountId) as StoredAccountRow | undefined;

  if (!row) {
    return null;
  }

  return toStoredAccount(row);
}

export function findStoredAccountsForLogin() {
  const currentDatabase = getDatabase();
  const rows = currentDatabase
    .prepare(`
      SELECT account_id, display_name, account_key_hash, is_disabled
      FROM accounts
      WHERE is_disabled = 0
    `)
    .all() as StoredAccountRow[];

  return rows.map(toStoredAccount);
}

export function updateStoredAccountDisplayName(accountId: string, displayName: string): boolean {
  const currentDatabase = getDatabase();
  const result = currentDatabase
    .prepare(`
      UPDATE accounts
      SET display_name = ?, updated_at = ?
      WHERE account_id = ?
    `)
    .run(displayName, Date.now(), accountId);

  return result.changes > 0;
}

export function upsertStoredAccount(input: {
  accountId: string;
  displayName: string;
  accountKeyHash: string;
  isDisabled?: boolean;
}): void {
  const currentDatabase = getDatabase();
  currentDatabase
    .prepare(`
      INSERT INTO accounts (
        account_id,
        display_name,
        account_key_hash,
        is_disabled,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET
        display_name = excluded.display_name,
        account_key_hash = excluded.account_key_hash,
        is_disabled = excluded.is_disabled,
        updated_at = excluded.updated_at
    `)
    .run(
      input.accountId,
      input.displayName,
      input.accountKeyHash,
      input.isDisabled ? 1 : 0,
      Date.now(),
      Date.now()
    );
}
