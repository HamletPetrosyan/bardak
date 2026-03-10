import dotenv from 'dotenv';
import { initializeAccountsDatabase, upsertStoredAccount } from '../database/accountsDatabase.js';
import { hashAccountKey } from '../security/accountKeyCrypto.js';

dotenv.config();

type ParsedArgs = {
  accountId: string;
  displayName: string;
  accountKey: string;
};

function readFlag(flagName: string): string | null {
  const flagIndex = process.argv.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }

  return process.argv[flagIndex + 1] ?? null;
}

function parseArguments(): ParsedArgs {
  const accountId = readFlag('--account-id')?.trim() ?? '';
  const displayName = readFlag('--display-name')?.trim() ?? '';
  const accountKey = readFlag('--account-key')?.trim() ?? '';

  if (!accountId || !displayName || !accountKey) {
    throw new Error(
      'Usage: npm run account:upsert -- --account-id <id> --display-name <name> --account-key <secret-key>'
    );
  }

  return {
    accountId,
    displayName,
    accountKey
  };
}

function main(): void {
  const args = parseArguments();

  initializeAccountsDatabase();
  upsertStoredAccount({
    accountId: args.accountId,
    displayName: args.displayName,
    accountKeyHash: hashAccountKey(args.accountKey)
  });

  console.log(`Account saved: ${args.accountId}`);
}

main();
