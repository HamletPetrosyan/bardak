import type { Account, PublicUser } from '../types.js';
import {
  findStoredAccountById,
  findStoredAccountByLoginKey,
  seedAccountsDatabase,
  updateStoredAccountDisplayName
} from '../database/accountsDatabase.js';
import { hashAccountKey } from '../security/accountKeyCrypto.js';

type AccountEnvMapping = {
  accountId: string;
  displayName: string;
  keyEnvName: string;
};

const initialAccountDefinitions: AccountEnvMapping[] = [
  {
    accountId: 'alice',
    displayName: 'Alice',
    keyEnvName: 'ACCOUNT_KEY_ALICE'
  },
  {
    accountId: 'bob',
    displayName: 'Bob',
    keyEnvName: 'ACCOUNT_KEY_BOB'
  }
];

function toAccount(account: {
  accountId: string;
  displayName: string;
  accountKeyHash: string;
}): Account {
  return {
    accountId: account.accountId,
    displayName: account.displayName,
    accountKeyHash: account.accountKeyHash
  };
}

export async function seedInitialAccountsFromEnvironment(): Promise<void> {
  const seedAccounts = initialAccountDefinitions.flatMap((definition) => {
    const rawKey = process.env[definition.keyEnvName];

    if (!rawKey || rawKey.trim() === '') {
      return [];
    }

    return [
      {
        accountId: definition.accountId,
        displayName: definition.displayName,
        accountKeyHash: hashAccountKey(rawKey)
      }
    ];
  });

  await seedAccountsDatabase(seedAccounts);
}

export async function findAccountByKey(accountKey: string): Promise<Account | undefined> {
  const matchingAccount = await findStoredAccountByLoginKey(accountKey);
  if (!matchingAccount) {
    return undefined;
  }

  return toAccount({
    accountId: matchingAccount.account_id,
    displayName: matchingAccount.display_name,
    accountKeyHash: matchingAccount.account_key_hash
  });
}

export async function findAccountById(accountId: string): Promise<Account | undefined> {
  const account = await findStoredAccountById(accountId);
  if (!account || account.is_disabled) {
    return undefined;
  }

  return toAccount({
    accountId: account.account_id,
    displayName: account.display_name,
    accountKeyHash: account.account_key_hash
  });
}

export async function updateAccountDisplayName(accountId: string, displayName: string): Promise<PublicUser | null> {
  const updated = await updateStoredAccountDisplayName(accountId, displayName);
  if (!updated) {
    return null;
  }

  const account = await findAccountById(accountId);
  if (!account) {
    return null;
  }

  return toPublicUser(account);
}

export function toPublicUser(account: Account): PublicUser {
  return {
    accountId: account.accountId,
    displayName: account.displayName
  };
}
