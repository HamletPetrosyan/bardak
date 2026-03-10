import type { Account, PublicUser } from '../types.js';
import { hashAccountKey, safeHexEqual } from '../security/accountKeyCrypto.js';
import {
  findStoredAccountById,
  findStoredAccountsForLogin,
  seedAccountsDatabase,
  updateStoredAccountDisplayName
} from '../database/accountsDatabase.js';

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

function seedInitialAccountsFromEnvironment(): void {
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

  seedAccountsDatabase(seedAccounts);
}

seedInitialAccountsFromEnvironment();

export function findAccountByKey(accountKey: string): Account | undefined {
  const inputHash = hashAccountKey(accountKey);
  const storedAccounts = findStoredAccountsForLogin();

  const matchingAccount = storedAccounts.find((account) => safeHexEqual(account.accountKeyHash, inputHash));
  if (!matchingAccount) {
    return undefined;
  }

  return {
    accountId: matchingAccount.accountId,
    displayName: matchingAccount.displayName,
    accountKeyHash: matchingAccount.accountKeyHash
  };
}

export function findAccountById(accountId: string): Account | undefined {
  const account = findStoredAccountById(accountId);
  if (!account || account.isDisabled) {
    return undefined;
  }

  return {
    accountId: account.accountId,
    displayName: account.displayName,
    accountKeyHash: account.accountKeyHash
  };
}

export function updateAccountDisplayName(accountId: string, displayName: string): PublicUser | null {
  const updated = updateStoredAccountDisplayName(accountId, displayName);
  if (!updated) {
    return null;
  }

  const account = findAccountById(accountId);
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
